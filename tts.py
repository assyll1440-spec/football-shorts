"""Offline English TTS: espeak-ng (phonemes) + Kokoro-82M ONNX (voice)."""
import json, os, re, subprocess
import numpy as np
import onnxruntime as rt

HERE = os.path.dirname(os.path.abspath(__file__))
MODELS = os.path.join(HERE, "models")
ESPEAK = os.environ.get("ESPEAK_BIN", "/opt/espeak/bin/espeak-ng")
SR = 24000

_cfg = os.path.join(MODELS, "kokoro_config.json")
if not os.path.exists(_cfg):
    _cfg = os.path.join(HERE, "kokoro_config.json")
_vocab = json.load(open(_cfg))["vocab"]
_sess = None
_voices = None


def _session():
    global _sess, _voices
    if _sess is None:
        _sess = rt.InferenceSession(os.path.join(MODELS, "kokoro-v1.0.onnx"),
                                    providers=["CPUExecutionProvider"])
        _voices = np.load(os.path.join(MODELS, "voices-v1.0.bin"))
    return _sess, _voices


def _espeak_ipa(chunks, lang):
    """Phonemize several text chunks in one espeak call (one per line)."""
    if not chunks:
        return []
    out = subprocess.run([ESPEAK, "-q", "--ipa", "-v", lang, "--stdin"],
                         input="\n".join(c.replace("\n", " ") for c in chunks) + "\n",
                         capture_output=True, text=True, check=True).stdout
    lines = [l.strip() for l in out.strip().split("\n")]
    # espeak may split one chunk into several lines on clause boundaries; fall back to per-chunk calls
    if len(lines) != len(chunks):
        lines = []
        for c in chunks:
            o = subprocess.run([ESPEAK, "-q", "--ipa", "-v", lang, c],
                               capture_output=True, text=True, check=True).stdout
            lines.append(" ".join(o.split()))
    return [re.sub(r"\([a-z-]+\)", "", l) for l in lines]


def phonemize(text, lang="en-us", vocab=None):
    """Like phonemizer(preserve_punctuation=True, with_stress=True)."""
    text = text.replace("—", ", ").replace("–", ", ").replace("…", "...")
    parts = re.split(r"([.,!?;:\"“”()]+)", text)
    words = [p for i, p in enumerate(parts) if i % 2 == 0 and p.strip()]
    ipa = iter(_espeak_ipa([w.strip() for w in words], lang))
    out = ""
    for i, p in enumerate(parts):
        if i % 2 == 0:
            if p.strip():
                out += (" " if p[:1].isspace() and out else "") + next(ipa)
        else:
            out += p.strip().replace("“", '"').replace("”", '"') + " "
    import unicodedata
    if vocab is not None:
        out = unicodedata.normalize("NFD", out)
    ph = "".join(ch for ch in out if ch in (vocab or _vocab))
    return re.sub(r"\s+", " ", ph).strip()


_piper = {}
PIPER_EXPR = {"noise": None, "noise_w": None}  # set for livelier delivery


def synth_piper(text, voice, speed=1.0):
    """Russian (or any Piper) voice, e.g. voice='ru:ruslan'. Returns 24 kHz float32."""
    import unicodedata
    name = voice.split(":", 1)[1]
    d = os.path.join(MODELS, f"vits-piper-ru_RU-{name}-medium")
    if name not in _piper:
        cfg = json.load(open(os.path.join(d, f"ru_RU-{name}-medium.onnx.json")))
        _piper[name] = (rt.InferenceSession(os.path.join(d, f"ru_RU-{name}-medium.onnx"),
                                            providers=["CPUExecutionProvider"]), cfg)
    sess, cfg = _piper[name]
    idmap = cfg["phoneme_id_map"]; inf = cfg["inference"]
    ph = unicodedata.normalize("NFD", phonemize(text, "ru", vocab=idmap))
    ids = [idmap["^"][0], idmap["_"][0]]
    for c in ph:
        if c in idmap:
            ids += [idmap[c][0], idmap["_"][0]]
    ids.append(idmap["$"][0])
    a = sess.run(None, {"input": np.array([ids], dtype=np.int64),
                        "input_lengths": np.array([len(ids)], dtype=np.int64),
                        "scales": np.array([PIPER_EXPR["noise"] or inf["noise_scale"], 1.0 / speed, PIPER_EXPR["noise_w"] or inf["noise_w"]], dtype=np.float32)})[0]
    a = np.squeeze(a).astype(np.float32)
    sr = cfg["audio"]["sample_rate"]
    if sr != SR:
        x = np.arange(0, len(a) * SR / sr) * sr / SR
        a = np.interp(x, np.arange(len(a)), a).astype(np.float32)
    return trim(a / (np.abs(a).max() + 1e-9) * 0.6)


def synth(text, voice="am_michael", speed=1.0, lang="en-us"):
    """Return float32 mono audio at 24 kHz."""
    if voice.startswith("ru:"):
        return synth_piper(text, voice, speed)
    sess, voices = _session()
    ph = phonemize(text, lang)
    # split long phoneme strings on sentence punctuation to respect the 510-token limit
    pieces, cur = [], ""
    for seg in re.split(r"(?<=[.!?,;:])\s", ph):
        if len(cur) + len(seg) + 1 > 400 and cur:
            pieces.append(cur); cur = seg
        else:
            cur = (cur + " " + seg).strip()
    if cur:
        pieces.append(cur)
    if "+" in voice:  # blend, e.g. "am_michael+am_fenrir"
        style_all = np.mean([voices[v] for v in voice.split("+")], axis=0)
    else:
        style_all = voices[voice]
    audio = []
    for p in pieces:
        toks = [_vocab[c] for c in p if c in _vocab]
        style = style_all[min(len(toks), len(style_all)) - 1]
        a = sess.run(None, {"tokens": np.array([[0, *toks, 0]], dtype=np.int64),
                            "style": np.asarray(style, dtype=np.float32),
                            "speed": np.array([speed], dtype=np.float32)})[0]
        audio.append(np.squeeze(a).astype(np.float32))
    return trim(np.concatenate(audio))


def trim(a, thresh=0.01, pad=0.03):
    idx = np.where(np.abs(a) > thresh)[0]
    if not len(idx):
        return a
    p = int(pad * SR)
    return a[max(0, idx[0] - p): idx[-1] + p]


if __name__ == "__main__":
    import sys, wave
    txt = sys.argv[1] if len(sys.argv) > 1 else "At twelve, Cristiano Ronaldo was kicked out of school. And that changed everything."
    print(phonemize(txt))
    a = synth(txt)
    with wave.open("/tmp/tts_test.wav", "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(a, -1, 1) * 32767).astype(np.int16).tobytes())
    print(len(a) / SR, "sec")
