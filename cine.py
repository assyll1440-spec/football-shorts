"""Cinematic animated renderer (vertical 1080x1920): layered SVG scenes with depth, light, fog, particles,
camera moves, vignette, grain and color grading. Scene art is per-video JS ("ANIM" functions) on top of a shared FX library.

Usage: python3 cine.py <video.json>
video.json: {"slug", "voice" ("ru:ruslan" | "am_puck" | "edge:ru-RU-DmitryNeural"...), "speed", "accent", "scene_js": "<path to .js>",
             "upload": {...}, "scenes": [{"anim", "say", "cap"?, "title"?, "sub"?, "hold"?, "sfx"?}]}
"""
import json, os, sys, shutil
import numpy as np
import make_video as mv

HERE = os.path.dirname(os.path.abspath(__file__))
W, H, FPS = 1080, 1920, 30
GAP = 0.25

LIB = r"""
const cl=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)), ease=x=>{x=cl(x);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2}, lerp=(a,b,k)=>a+(b-a)*k;
function rnd(seed){let s=seed*9301+49297;return()=>{s=(s*9301+49297)%233280;return s/233280;}}
const DEFS=`<defs>
 <filter id="blur8"><feGaussianBlur stdDeviation="8"/></filter>
 <filter id="blur20"><feGaussianBlur stdDeviation="20"/></filter>
 <filter id="blur50"><feGaussianBlur stdDeviation="50"/></filter>
 <filter id="glow"><feGaussianBlur stdDeviation="14" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
 <radialGradient id="vig" cx="50%" cy="50%" r="75%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".85"/></radialGradient>
 <linearGradient id="ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
</defs>`;
function grad(id,stops,v=true){return `<linearGradient id="${id}" x1="0" y1="0" x2="${v?0:1}" y2="${v?1:0}">${stops.map(s=>`<stop offset="${s[0]}" stop-color="${s[1]}" stop-opacity="${s[2]??1}"/>`).join('')}</linearGradient>`;}
function rgrad(id,stops,cx=.5,cy=.5,r=.5){return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(s=>`<stop offset="${s[0]}" stop-color="${s[1]}" stop-opacity="${s[2]??1}"/>`).join('')}</radialGradient>`;}
function sky(id,top,mid,bot){return `<defs>${grad(id,[[0,top],[.55,mid],[1,bot]])}</defs><rect x="-200" y="-200" width="1480" height="2320" fill="url(#${id})"/>`;}
function glowOrb(x,y,r,col,op=1){return `<defs>${rgrad('orb'+x+y,[[0,col,op],[.25,col,op*.55],[1,col,0]])}</defs><circle cx="${x}" cy="${y}" r="${r}" fill="url(#orb${x}${y})"/>`;}
function stars(n,seed,t,y1=900){const r=rnd(seed);let g='';for(let i=0;i<n;i++){const x=r()*1080,y=r()*y1,s=r()*2.2+.6,tw=.4+.6*Math.abs(Math.sin(t*(1+r()*2)+i));g+=`<circle cx="${x}" cy="${y}" r="${s}" fill="#fff" opacity="${tw*.8}"/>`;}return g;}
function fog(y,t,col,op,speed=20,seed=1,h=180){const r=rnd(seed);let g=`<g filter="url(#blur50)" opacity="${op}">`;for(let i=0;i<7;i++){const x=((r()*1400+t*speed*(.5+r()))%1700)-300;g+=`<ellipse cx="${x}" cy="${y+r()*h-h/2}" rx="${260+r()*260}" ry="${60+r()*70}" fill="${col}"/>`;}return g+`</g>`;}
function rays(x,y,t,col='#fff',op=.18,n=6,spread=40,len=1900){let g=`<g opacity="${op}" filter="url(#blur20)">`;for(let i=0;i<n;i++){const a=-spread/2+i*spread/(n-1)+Math.sin(t*.4+i)*2.5,w=18+i%3*14;g+=`<polygon points="${x},${y} ${x+Math.tan((a-w/10)*Math.PI/180)*len},${y+len} ${x+Math.tan((a+w/10)*Math.PI/180)*len},${y+len}" fill="${col}" opacity="${.5+.5*Math.sin(t*.7+i*1.7)}"/>`;}return g+`</g>`;}
function particles(n,seed,t,kind='dust',col='#fff'){const r=rnd(seed);let g='';for(let i=0;i<n;i++){const bx=r()*1080,by=r()*1920,sp=.3+r(),s=r();
  if(kind==='rain'){const x=(bx-t*260*sp)%1080+((bx-t*260*sp)<0?1080:0),y=(by+t*1500*sp)%1920;g+=`<line x1="${x}" y1="${y}" x2="${x-14}" y2="${y+46}" stroke="${col}" stroke-width="${1+s*1.5}" opacity="${.25+s*.3}"/>`;}
  else if(kind==='snow'){const x=(bx+Math.sin(t+i)*30+1080)%1080,y=(by+t*90*sp)%1920;g+=`<circle cx="${x}" cy="${y}" r="${1.5+s*4}" fill="${col}" opacity="${.35+s*.5}"/>`;}
  else {const x=(bx+t*12*sp+Math.sin(t*.5+i)*20+1080)%1080,y=(by-t*18*sp+1920)%1920;g+=`<circle cx="${x}" cy="${y}" r="${1+s*2.6}" fill="${col}" opacity="${(.15+s*.45)*Math.abs(Math.sin(t*.8+i))}"/>`;}}return g;}
function sea(y,t,c1,c2,hi,amp=16,seed=3){const r=rnd(seed);let g=`<defs>${grad('sea'+y,[[0,c1],[1,c2]])}</defs>`;
  for(let k=0;k<5;k++){const yy=y+k*55,a=amp*(1+k*.5),ph=t*(1.1+k*.3)+k;let d=`M-100 ${yy}`;for(let x=-100;x<=1180;x+=40){d+=` L${x} ${yy+Math.sin(x/(90+k*30)+ph)*a+Math.sin(x/37+ph*1.7)*a*.3}`;}
    g+=`<path d="${d} V2100 H-100 Z" fill="url(#sea${y})" opacity="${k?0.55:1}"/>`;
    for(let j=0;j<6;j++){const hx=(r()*1300+t*(20+k*10))%1300-100;g+=`<path d="M${hx} ${yy+6+r()*30} q 30 -6 60 0" stroke="${hi}" stroke-width="${2+k}" fill="none" opacity="${.25+.2*Math.sin(t*2+j)}"/>`;}}
  return g;}
function post(t,tint='#000',tintOp=0,grain=.07){const seed=Math.floor(t*30)%60;
  return `<rect x="0" y="0" width="1080" height="1920" fill="${tint}" opacity="${tintOp}" style="mix-blend-mode:multiply"/>`+
   `<filter id="gr${seed}"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${seed}"/><feColorMatrix values="0 0 0 0 .5 0 0 0 0 .5 0 0 0 0 .5 0 0 0 ${grain*9} 0"/></filter>`+
   `<rect width="1080" height="1920" filter="url(#gr${seed})" opacity="${grain*4}" style="mix-blend-mode:overlay"/>`+
   `<rect width="1080" height="1920" fill="url(#vig)"/>`;}
function cam(g,u,d,z0=1.0,z1=1.08,dx=0,dy=0){const k=ease(u/d),z=lerp(z0,z1,k);return `<g transform="translate(${540+dx*k} ${960+dy*k}) scale(${z}) translate(-540 -960)">${g}</g>`;}
function titleCard(title,sub,u,acc){if(!title)return '';const a=ease(u*1.6),b=ease((u-.5)*1.6),out=1;const ls=lerp(30,8,a);const fs=Math.min(92,1450/title.length);
  const band=`<defs><linearGradient id="tband" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".6"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient></defs><rect width="1080" height="640" fill="url(#tband)" opacity="${a}"/>`;
  return band+`<g opacity="${a*out}"><line x1="${540-260*a}" y1="300" x2="${540+260*a}" y2="300" stroke="${acc}" stroke-width="3"/>`+
   `<text x="540" y="400" text-anchor="middle" font-family="Disp" font-size="${fs}" letter-spacing="${ls}" fill="#fff" filter="url(#glow)">${title}</text>`+
   (sub?`<text x="540" y="470" text-anchor="middle" font-family="Mont" font-weight="600" font-size="34" letter-spacing="6" fill="${acc}" opacity="${b}">${sub}</text>`:'')+`</g>`;}
"""

PAGE = r"""<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Disp;src:url('file://FONTS/DISPFONT')}
@font-face{font-family:Mont;src:url('file://FONTS/Montserrat[wght].ttf')}
html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#000}
svg{position:absolute;left:0;top:0}
</style></head><body><svg id="s" width="1080" height="1920" viewBox="0 0 1080 1920"></svg>
<script>
const SC = SCENES_JSON; const ACC = 'ACCENT';
LIBJS
SCENEJS
function frame(t){
  let i=0; while(i<SC.length-1 && t>=SC[i+1].start) i++;
  const s=SC[i], u=t-s.start;
  let g=DEFS+ANIM[s.anim](u,s.dur,t,s)+titleCard(s.title,s.sub,u,ACC);
  const fadeIn = i>0 ? cl(u/0.35) : cl(u/0.5);
  const fadeOut = i===SC.length-1 ? cl((s.dur-u)/0.6) : 1;
  g += `<rect width="1080" height="1920" fill="#000" opacity="${1-fadeIn*fadeOut}"/>`;
  document.getElementById('s').innerHTML=g;
}
</script></body></html>"""


def synth_any(text, voice, speed):
    from tts import synth
    return synth(text, voice, speed)


def main(path):
    E = json.load(open(path)); slug = E["slug"]; S = E["scenes"]
    voice = E.get("voice", "am_puck"); ru = voice.startswith("ru:") or "ru-RU" in voice
    tmp = os.path.join(HERE, "build", slug); shutil.rmtree(tmp, ignore_errors=True); os.makedirs(os.path.join(tmp, "f"))
    from tts import SR
    audios = [synth_any(s["say"], voice, E.get("speed", 1.0)) for s in S]
    durs = [len(a) / SR + GAP + s.get("hold", 0) for a, s in zip(audios, S)]; durs[0] += 0.3; durs[-1] += 0.8
    starts = list(np.cumsum([0] + durs[:-1])); total = float(sum(durs))
    for s, st, du in zip(S, starts, durs):
        s["start"], s["dur"] = float(st), float(du)
    v = np.zeros(int(total * SR) + SR, np.float32)
    for a, st, i in zip(audios, starts, range(len(S))):
        o = int((st + (0.3 if i == 0 else 0)) * SR); v[o:o + len(a)] += a
    fx = np.zeros_like(v); w = mv.whoosh(); fxs = {"ding": mv.ding(), "tick": mv.tick()}
    for st in starts[1:]:
        o = max(0, int(st * SR) - len(w) // 2); fx[o:o + len(w)] += w * 0.8
    for s, st in zip(S, starts):
        if s.get("sfx") in fxs:
            e = fxs[s["sfx"]]; o = int(st * SR); fx[o:o + len(e)] += e
    # low ambient drone bed (generated, copyright-free)
    tt = np.arange(len(v)) / SR
    drone = (np.sin(2 * np.pi * 55 * tt) * .5 + np.sin(2 * np.pi * 82.5 * tt) * .3 + np.sin(2 * np.pi * 110 * tt + np.sin(tt * .3)) * .2)
    drone *= (0.6 + 0.4 * np.sin(tt * 0.25)) * 0.035
    fade = np.minimum(1, np.minimum(tt / 2, (total - tt) / 2).clip(0))
    fx += (drone * fade).astype(np.float32)
    mv.write_wav(os.path.join(tmp, "voice.wav"), v[:int(total * SR)] * 0.9 / max(1e-6, np.abs(v).max()))
    mv.write_wav(os.path.join(tmp, "fx.wav"), fx[:int(total * SR)])
    scene_js = open(os.path.join(os.path.dirname(os.path.abspath(path)), E["scene_js"])).read()
    html = (PAGE.replace("FONTS", os.path.join(HERE, "fonts")).replace("DISPFONT", "OswaldHeavy.ttf" if ru else "Anton-Regular.ttf")
            .replace("LIBJS", LIB).replace("SCENEJS", scene_js).replace("ACCENT", E.get("accent", "#e0a43a"))
            .replace("SCENES_JSON", json.dumps(S, ensure_ascii=False)))
    open(os.path.join(tmp, "page.html"), "w").write(html)
    from playwright.sync_api import sync_playwright
    n = int(total * FPS)
    with sync_playwright() as p:
        b = p.chromium.launch(args=["--allow-file-access-from-files"])
        pg = b.new_page(viewport={"width": W, "height": H})
        pg.goto("file://" + os.path.join(tmp, "page.html")); pg.wait_for_timeout(500)
        for i in range(n):
            pg.evaluate(f"frame({i / FPS})")
            pg.screenshot(path=os.path.join(tmp, "f", f"{i:05d}.jpg"), type="jpeg", quality=92)
        b.close()
    mv.W, mv.H = W, H
    mv.CAP_SIZE, mv.CAP_MV, mv.CAP_WORDS, mv.CAP_CHARS, mv.CAP_OUT, mv.CAP_SH = 92, 430, 3, 18, 6, 0
    caps = [dict(s) for s in S]
    caps[0]["start"] = caps[0]["start"] + 0.3
    st2 = [s["start"] for s in caps]
    mv.build_captions(caps, st2, durs, E.get("accent", "#e0a43a"), os.path.join(tmp, "caps.ass"), "Oswald Heavy" if ru else "Anton")
    ass = os.path.join(tmp, "caps.ass")
    os.makedirs(os.path.join(HERE, "output"), exist_ok=True)
    final = os.path.join(HERE, "output", f"{slug}.mp4")
    mv.sh(["ffmpeg", "-y", "-framerate", str(FPS), "-i", os.path.join(tmp, "f", "%05d.jpg"),
           "-i", os.path.join(tmp, "voice.wav"), "-i", os.path.join(tmp, "fx.wav"),
           "-filter_complex",
           f"[0:v]subtitles='{ass}':fontsdir='{os.path.join(HERE, 'fonts')}',format=yuv420p[v];"
           "[1:a]highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=2[vo];"
           "[vo][2:a]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5[a]",
           "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "medium", "-crf", "20",
           "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", final])
    up = E.get("upload", {})
    open(os.path.join(HERE, "output", f"{slug}.txt"), "w").write(
        f"TITLE:\n{up.get('title','')}\n\nDESCRIPTION:\n{up.get('description','')}\n\nTAGS:\n{', '.join(up.get('tags', []))}\n")
    print(f"done: {final}  ({total:.1f}s)")


if __name__ == "__main__":
    main(sys.argv[1])
