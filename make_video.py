"""Build a vertical YouTube Short from a project JSON.

project.json:
{
  "slug": "ronaldo-school",
  "voice": "am_michael", "speed": 1.05,
  "accent": "#e63946",
  "music": "optional/path/to/track.mp3",
  "upload": {"title": "...", "description": "...", "tags": ["..."]},
  "scenes": [
    {"say": "Narration for this scene.",
     "headline": "OPTIONAL BIG TEXT",
     "visual": "<svg viewBox='0 0 800 800'>...</svg>"}   # or any HTML
  ]
}
Usage: python3 make_video.py projects/<slug>.json
"""
import json, os, re, subprocess, sys, wave, shutil
import numpy as np
SR = 24000

HERE = os.path.dirname(os.path.abspath(__file__))
W, H, FPS = 1080, 1920, 30
CAP_SIZE, CAP_MV, CAP_WORDS, CAP_CHARS = 128, 470, 3, 14
CAP_OUT, CAP_SH, CAP_UPPER = 9, 4, True
GAP = 0.18           # silence after each scene
XF = 0.25            # crossfade between scenes

TEMPLATE = """<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Anton;src:url('file://%(fonts)s/Anton-Regular.ttf')}
@font-face{font-family:Disp;src:url('file://%(fonts)s/%(dispfile)s')}
@font-face{font-family:Mont;src:url('file://%(fonts)s/Montserrat[wght].ttf')}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:%(W)dpx;height:%(H)dpx;overflow:hidden}
body{background:radial-gradient(120%% 80%% at 50%% 30%%, %(accent)s55 0%%, #0d0f14 60%%, #07080b 100%%);
     font-family:Mont,sans-serif;color:#fff;position:relative}
.grain{position:absolute;inset:0;opacity:.07;background-image:repeating-linear-gradient(0deg,#fff 0 1px,transparent 1px 3px)}
.head{position:absolute;top:250px;left:70px;right:70px;text-align:center;font-family:Disp;
      font-size:%(hsize)dpx;line-height:1.12;text-transform:uppercase;letter-spacing:1px;
      text-shadow:0 6px 0 #000a}
.head b{color:%(accent)s;font-weight:normal}
.vis{position:absolute;left:90px;right:90px;top:%(vtop)dpx;height:760px;display:flex;align-items:center;justify-content:center}
.vis svg{width:100%%;height:100%%;overflow:visible;filter:drop-shadow(0 20px 40px #0009)}
.full{position:absolute;inset:0}
.bar{position:absolute;bottom:0;left:0;right:0;height:14px;background:%(accent)s}
</style></head><body><div class="grain"></div>
%(head)s<div class="vis">%(visual)s</div></body></html>"""


def sh(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit("FAILED: " + " ".join(cmd) + "\n" + r.stderr[-3000:])
    return r.stdout


def write_wav(path, a):
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(a, -1, 1) * 32767).astype(np.int16).tobytes())


def whoosh(dur=0.45):
    n = int(dur * SR); t = np.linspace(0, 1, n)
    noise = np.random.default_rng(7).standard_normal(n)
    # crude band-pass sweep: moving-average low-pass with changing window
    out = np.zeros(n); k0, k1 = 60, 6
    cs = np.cumsum(np.insert(noise, 0, 0))
    for i in range(n):
        k = int(k0 + (k1 - k0) * t[i]); j = max(0, i - k)
        out[i] = (cs[i + 1] - cs[j]) / (i + 1 - j)
    env = np.sin(np.pi * t) ** 2
    out = out * env
    return (out / (np.abs(out).max() + 1e-9) * 0.12).astype(np.float32)


def tick():
    n = int(0.06 * SR); t = np.arange(n) / SR
    a = np.sin(2 * np.pi * 1900 * t) * np.exp(-t * 90) + 0.5 * np.random.default_rng(3).standard_normal(n) * np.exp(-t * 300)
    return (a / np.abs(a).max() * 0.35).astype(np.float32)


def ding():
    n = int(0.9 * SR); t = np.arange(n) / SR
    a = (np.sin(2 * np.pi * 880 * t) + 0.6 * np.sin(2 * np.pi * 1320 * t) + 0.3 * np.sin(2 * np.pi * 1760 * t)) * np.exp(-t * 5)
    a[:int(0.005 * SR)] *= np.linspace(0, 1, int(0.005 * SR))
    return (a / np.abs(a).max() * 0.35).astype(np.float32)


def render_frames(scenes, accent, tmp, dispfile):
    from playwright.sync_api import sync_playwright
    fonts = os.path.join(HERE, "fonts")
    paths = []
    with sync_playwright() as p:
        b = p.chromium.launch(args=["--allow-file-access-from-files"])
        pg = b.new_page(viewport={"width": W, "height": H}, device_scale_factor=1.5)
        for i, s in enumerate(scenes):
            head = s.get("headline", "")
            hsize = 150 if len(head) < 14 else 118 if len(head) < 26 else 96
            head = re.sub(r"\*(.+?)\*", r"<b>\1</b>", head)  # *word* -> accent colour
            if s.get("full"):
                html = TEMPLATE % dict(W=W, H=H, fonts=fonts, accent=accent, dispfile=dispfile, hsize=hsize, vtop=0,
                                       head=f'<div class="full">{s.get("visual", "")}</div>', visual="")
            else:
                html = TEMPLATE % dict(W=W, H=H, fonts=fonts, accent=accent, dispfile=dispfile, hsize=hsize,
                                       vtop=560 if head else 330,
                                       head=f'<div class="head">{head}</div>' if head else "",
                                       visual=s.get("visual", ""))
            f = os.path.join(tmp, f"scene{i}.html"); open(f, "w").write(html)
            pg.goto("file://" + f); pg.wait_for_timeout(150)
            out = os.path.join(tmp, f"scene{i}.png"); pg.screenshot(path=out); paths.append(out)
        b.close()
    return paths


def ass_time(t):
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"


def build_captions(scenes, starts, durs, accent, path, capfont="Anton"):
    # ASS colours are &HBBGGRR
    r, g, b = accent[1:3], accent[3:5], accent[5:7]
    acc = f"&H00{b}{g}{r}".upper()
    lines = ["[Script Info]", "ScriptType: v4.00+", f"PlayResX: {W}", f"PlayResY: {H}", "",
             "[V4+ Styles]",
             "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
             f"Style: Cap,{capfont},{CAP_SIZE},&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,0,0,0,0,100,100,2,0,1,{CAP_OUT},{CAP_SH},2,60,60,{CAP_MV},1",
             "", "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
    for s, st, du in zip(scenes, starts, durs):
        if not s.get("say", "").strip() or s.get("captions") is False:
            continue
        du = du - s.get("hold", 0)
        words = s.get("cap", s["say"]).split()
        weights = [len(re.sub(r"\W", "", w)) + 2 + 5 * len(re.sub(r"\D", "", w)) + (4 if re.search(r"[.,!?;:]$", w) else 0) for w in words]
        speak = du - GAP; tot = sum(weights); t = st
        wt = []
        for w, k in zip(words, weights):
            d = speak * k / tot; wt.append((w, t, t + d)); t += d
        # group into chunks of <= 3 words / 16 chars, break after punctuation
        chunks, cur = [], []
        for item in wt:
            cur.append(item)
            txt = " ".join(x[0] for x in cur)
            if len(cur) >= CAP_WORDS or len(txt) >= CAP_CHARS or re.search(r"[.,!?;:]$", item[0]):
                chunks.append(cur); cur = []
        if cur: chunks.append(cur)
        for ci, ch in enumerate(chunks):
            c0 = ch[0][1]; c1 = chunks[ci + 1][0][1] if ci + 1 < len(chunks) else st + du
            for wi, (w, w0, w1) in enumerate(ch):
                e1 = ch[wi + 1][1] if wi + 1 < len(ch) else c1
                parts = []
                for wj, (x, _, _) in enumerate(ch):
                    x = (x.upper() if CAP_UPPER else x).replace("{", "").replace("}", "")
                    parts.append(("{\\c%s}" % acc + x + "{\\c&H00FFFFFF&}") if wj == wi else x)
                pop = "{\\fscx88\\fscy88\\t(0,90,\\fscx100\\fscy100)}" if wi == 0 else ""
                lines.append(f"Dialogue: 0,{ass_time(w0)},{ass_time(e1)},Cap,,0,0,0,,{pop}{' '.join(parts)}")
    open(path, "w").write("\n".join(lines) + "\n")


def main(project_path):
    global W, H, CAP_SIZE, CAP_MV, CAP_WORDS, CAP_CHARS, CAP_OUT, CAP_SH, CAP_UPPER
    P = json.load(open(project_path))
    if P.get("format") == "landscape":
        W, H = 1920, 1080
        CAP_SIZE, CAP_MV, CAP_WORDS, CAP_CHARS = 58, 60, 6, 34
        CAP_OUT, CAP_SH, CAP_UPPER = 4, 2, False
    slug = P.get("slug") or os.path.splitext(os.path.basename(project_path))[0]
    accent = P.get("accent", "#e63946")
    out_dir = os.path.join(HERE, "output"); os.makedirs(out_dir, exist_ok=True)
    tmp = os.path.join(HERE, "build", slug); shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp)
    scenes = P["scenes"]

    print("1/4 voice...")
    if P.get("tts") is False:   # text-only video: scene length from reading time, no voice
        audios = [np.zeros(int(SR * max(1.6, 0.36 * len(s["say"].split()) + 0.5)), np.float32) if s.get("say", "").strip()
                  else np.zeros(0, np.float32) for s in scenes]
    else:
        from tts import synth
        audios = [synth(s["say"], P.get("voice", "am_michael"), P.get("speed", 1.05)) if s.get("say", "").strip()
                  else np.zeros(0, np.float32) for s in scenes]
    durs = [(len(a) / SR + GAP if len(a) else 0) + s.get("hold", 0) for a, s in zip(audios, scenes)]
    durs[-1] += 0.6
    starts = list(np.cumsum([0] + durs[:-1]))
    total = sum(durs)
    voice = np.zeros(int(total * SR) + SR, np.float32)
    sw = whoosh(); fx = {"tick": tick(), "ding": ding()}
    for i, (a, st) in enumerate(zip(audios, starts)):
        o = int(st * SR)
        if not P.get("mute_voice"):
            voice[o:o + len(a)] += a
        sfx = scenes[i].get("sfx")
        if sfx in fx:
            e = fx[sfx][:len(voice) - o]; voice[o:o + len(e)] += e
        if i > 0 and scenes[i].get("whoosh", True):
            wo = max(0, o - len(sw) // 2); voice[wo:wo + len(sw)] += sw[:len(voice) - wo]
    voice = voice[:int(total * SR)]
    voice *= 0.9 / max(1e-6, np.abs(voice).max())
    write_wav(os.path.join(tmp, "voice.wav"), voice)

    print("2/4 visuals...")
    ru = P.get("voice", "").startswith("ru:")
    dispfile = P.get("font_file", "OswaldHeavy.ttf" if ru else "Anton-Regular.ttf")
    capfont = P.get("font", "Oswald Heavy" if ru else "Anton")
    pngs = render_frames(scenes, accent, tmp, dispfile)

    print("3/4 captions...")
    build_captions([dict(s_, captions=False) for s_ in scenes] if P.get("mute_voice") else scenes,
                   starts, durs, accent, os.path.join(tmp, "caps.ass"), capfont)

    print("4/4 video...")
    clips = []
    for i, (png, d) in enumerate(zip(pngs, durs)):
        d_clip = d + (scenes[i + 1].get("xf", XF) if i < len(pngs) - 1 else 0)
        n = int(round(d_clip * FPS))
        c = os.path.join(tmp, f"clip{i}.mp4")
        if scenes[i].get("zoom") is False:
            sh(["ffmpeg", "-y", "-loop", "1", "-i", png, "-vf", f"scale={W}:{H},fps={FPS},format=yuv420p",
                "-frames:v", str(n), "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", c])
            clips.append((c, d_clip)); continue
        z_in = i % 2 == 0  # alternate zoom in / out
        zm = P.get("zoom_amount", 0.07)
        z = f"1+{zm}*on/{n}" if z_in else f"{1+zm}-{zm}*on/{n}"
        c = os.path.join(tmp, f"clip{i}.mp4")
        sh(["ffmpeg", "-y", "-loop", "1", "-i", png, "-vf",
            f"scale={int(P.get('zoom_scale', 2)*W)//2*2}:{int(P.get('zoom_scale', 2)*H)//2*2},zoompan=z='{z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s={W}x{H}:fps={FPS},format=yuv420p",
            "-frames:v", str(n), "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", c])
        clips.append((c, d_clip))
    # chain crossfades
    inputs, fc, prev, off = [], [], "0:v", 0.0
    for i, (c, d) in enumerate(clips):
        inputs += ["-i", c]
    for i in range(1, len(clips)):
        off += durs[i - 1]
        lab = f"v{i}"
        xf = scenes[i].get("xf", XF)
        fc.append(f"[{prev}][{i}:v]xfade=transition={scenes[i].get('transition', 'smoothup')}:duration={xf}:offset={off:.3f}[{lab}]")
        prev = lab
    ass = os.path.join(tmp, "caps.ass").replace(":", r"\:")
    fc.append(f"[{prev}]subtitles='{ass}':fontsdir='{os.path.join(HERE, 'fonts')}'[vout]")
    audio_in = ["-i", os.path.join(tmp, "voice.wav")]
    ai = len(clips)
    music = P.get("music")
    if music and os.path.exists(music):
        audio_in += ["-stream_loop", "-1", "-i", music]
        fc.append(f"[{ai + 1}:a]volume=0.12,afade=t=out:st={total - 1.5:.2f}:d=1.5[m];[{ai}:a][m]amix=inputs=2:duration=first:normalize=0[aout]")
        amap = "[aout]"
    else:
        amap = f"{ai}:a"
    final = os.path.join(out_dir, f"{slug}.mp4")
    sh(["ffmpeg", "-y", *inputs, *audio_in, "-filter_complex", ";".join(fc),
        "-map", "[vout]", "-map", amap, "-t", f"{total:.3f}",
        "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", final])

    if P.get("mute_voice"):
        lines = []
        for s_, st_, du_ in zip(scenes, starts, durs):
            if s_.get("say", "").strip():
                lines.append(f"[{st_:04.1f}–{st_ + du_:04.1f} с] {s_.get('cap', s_['say'])}")
        full = " ".join(s_.get("cap", s_["say"]) for s_ in scenes if s_.get("say", "").strip())
        open(os.path.join(out_dir, f"{slug}-script.txt"), "w").write(
            "ТЕКСТ ДЛЯ ОЗВУЧКИ (вставь целиком в ElevenLabs):\n\n" + full +
            "\n\nПО СЦЕНАМ (где какая фраза в видео):\n" + "\n".join(lines) + "\n")
    up = P.get("upload")
    chap = ""
    for s_, st_ in zip(scenes, starts):
        if s_.get("chapter"):
            m_, s2 = divmod(int(round(st_)), 60); chap += f"{m_}:{s2:02d} {s_['chapter']}\n"
    if chap:
        chap = "\n\nГЛАВЫ / CHAPTERS:\n" + chap
    if P.get("thumbnail"):
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p_:
            b_ = p_.chromium.launch(args=["--allow-file-access-from-files"])
            pg_ = b_.new_page(viewport={"width": 1280, "height": 720})
            f_ = os.path.join(tmp, "thumb.html"); open(f_, "w").write(P["thumbnail"].replace("%FONTS%", os.path.join(HERE, "fonts")))
            pg_.goto("file://" + f_); pg_.wait_for_timeout(200)
            pg_.screenshot(path=os.path.join(out_dir, f"{slug}-thumbnail.png")); b_.close()
    if up:
        txt = f"TITLE:\n{up.get('title','')}\n\nDESCRIPTION:\n{up.get('description','')}{chap}\n\nTAGS:\n{', '.join(up.get('tags', []))}\n"
        open(os.path.join(out_dir, f"{slug}.txt"), "w").write(txt)
    print(f"done: {final}  ({total:.1f}s)")
    return final


if __name__ == "__main__":
    main(sys.argv[1])
