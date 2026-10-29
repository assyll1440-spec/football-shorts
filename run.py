"""Render the next video from queue/ and move its JSON to done/.
Prints the slug to the file given in $GITHUB_OUTPUT (used by the workflow)."""
import os, shutil, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
queue = sorted(f for f in os.listdir(os.path.join(HERE, "queue")) if f.endswith(".json"))
out = os.environ.get("GITHUB_OUTPUT")
if not queue:
    print("Queue is empty - nothing to render.")
    if out:
        open(out, "a").write("slug=\n")
    sys.exit(0)
name = queue[0]; slug = name[:-5]
print("Rendering", slug)
# Voice settings come from the workflow (VOICE / SPEED). Empty VOICE = text-only video.
import json
qpath = os.path.join(HERE, "queue", name)
P = json.load(open(qpath))
voice = os.environ.get("VOICE", "").strip()
if voice:
    P["tts"] = True
    P["voice"] = voice
    P["speed"] = float(os.environ.get("SPEED", "1.05"))
    json.dump(P, open(qpath, "w"), indent=1, ensure_ascii=False)
subprocess.run([sys.executable, os.path.join(HERE, "make_video.py"), os.path.join(HERE, "queue", name)], check=True)
os.makedirs(os.path.join(HERE, "done"), exist_ok=True)
shutil.move(os.path.join(HERE, "queue", name), os.path.join(HERE, "done", name))
title = open(os.path.join(HERE, "output", slug + ".txt")).read().split("\n")[1].strip()
if out:
    open(out, "a").write(f"slug={slug}\ntitle={title}\nleft={len(queue) - 1}\n")
print("Done:", slug, "| left in queue:", len(queue) - 1)
