"""Story Studio — renders D.json + mix.wav into an MP4, using several browser pages in parallel."""
import json, os, subprocess, sys, time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HERE = Path(__file__).resolve().parent
LIBS = ["core.js", "people.js", "animals.js", "props.js", "places.js", "effects.js", "scene.js"]


def page_html(w, h):
    src = "".join(f"<script charset='utf-8' src='{(HERE / 'lib' / l).as_uri()}'></script>" for l in LIBS)
    return f"<!doctype html><html><head><meta charset='utf-8'></head><body style='margin:0;background:#000'><canvas id=c width={w} height={h}></canvas><script>window.g=null;</script>{src}<script>g=document.getElementById('c').getContext('2d');</script></body></html>"


def render_chunk(args):
    i, f0, f1, D, out, w, h, fps = args
    from playwright.sync_api import sync_playwright
    html = out.parent / f"_page_{w}.html"; html.write_text(page_html(w, h))
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(fps), "-c:v", "mjpeg", "-i", "-",
                           "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", str(out)], stdin=subprocess.PIPE)
    with sync_playwright() as p:
        b = p.chromium.launch(args=["--disable-gpu"]); pg = b.new_page(viewport={"width": w, "height": h})
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.add_init_script("window.D=" + json.dumps(D) + ";")
        pg.goto(html.as_uri()); pg.wait_for_function("typeof window.render==='function'")
        for f in range(f0, f1):
            pg.evaluate(f"render({f / fps})")
            ff.stdin.write(pg.screenshot(type="jpeg", quality=88))
            if errs: raise RuntimeError(errs[0])
        b.close()
    ff.stdin.close(); ff.wait()
    return i


def render(work, out_mp4, w=1280, h=720, workers=None, log=print):
    work = Path(work); D = json.loads((work / "D.json").read_text()); fps = D["fps"]
    frames = int(D["total"] * fps); workers = workers or max(1, min(6, os.cpu_count() or 2))
    per = -(-frames // workers); jobs = []
    for i in range(workers):
        f0, f1 = i * per, min(frames, (i + 1) * per)
        if f0 < f1: jobs.append((i, f0, f1, D, work / f"chunk{i}.mp4", w, h, fps))
    t0 = time.time(); log(f"rendering {frames} frames with {len(jobs)} workers")
    with ThreadPoolExecutor(len(jobs)) as ex: list(ex.map(render_chunk, jobs))
    (work / "chunks.txt").write_text("".join(f"file '{j[4].name}'\n" for j in jobs))
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(work / "chunks.txt"), "-i", str(work / "mix.wav"),
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", str(out_mp4)], check=True)
    log(f"done in {time.time() - t0:.0f}s -> {out_mp4}")


if __name__ == "__main__":
    render(sys.argv[1], sys.argv[2], *(int(x) for x in sys.argv[3:5]))
