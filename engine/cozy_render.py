"""Renders a cozy ambient video: one seamless loop of picture + nature sound, repeated to any length.

  python engine/cozy_render.py --scene rain_window --minutes 60 --out rain.mp4

The picture loop is drawn once (LOOP seconds), the sound loop is built to the exact same length, and
ffmpeg repeats both — so a 1-hour video costs about the same to make as a 1-minute one.
"""
import argparse, base64, concurrent.futures as cf, json, subprocess, tempfile
from pathlib import Path
import numpy as np, soundfile as sf

HERE = Path(__file__).resolve().parent
SOUNDS = HERE / "sounds"
W, H, FPS, SR = 1280, 720, 30, 44100
XF = 2.0  # seconds of crossfade used to make each sound bed loop seamlessly

SCENES = {  # scene -> picture options + which sound beds / one-shots it uses
    "rain_window": {"opts": {"rain": "steady", "thunder": True}, "beds": [("rain_window", 1.0)], "thunder": True},
    "storm_window": {"opts": {"rain": "heavy", "thunder": True, "thunderAt": [5.0, 17.0, 29.0]}, "beds": [("rain_heavy", 1.0)], "thunder": True},
    "quiet_rain": {"opts": {"rain": "steady", "thunder": False}, "beds": [("rain_window", 1.0)], "thunder": False},
}


def load(name):
    """Decode an mp3 from engine/sounds to mono float32 at SR."""
    p = SOUNDS / f"{name}.mp3"
    if not p.exists(): raise SystemExit(f"missing sound {p.name} — run engine/cozy_sounds.py first")
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(p), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], check=True, capture_output=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def seamless(a):
    """Fold the last XF seconds over the start with an equal-power crossfade, so the clip loops with no seam."""
    x = int(XF * SR); body, tail = a[:-x].copy(), a[-x:]
    k = np.linspace(0, 1, x); body[:x] = body[:x] * np.sqrt(k) + tail * np.sqrt(1 - k)
    return body


def sound_loop(scene, loop_s, thunder_at):
    n = int(loop_s * SR); out = np.zeros(n, np.float32)
    for name, gain in SCENES[scene]["beds"]:
        b = seamless(load(name)); reps = int(np.ceil(n / len(b))) + 1
        out += np.tile(b, reps)[:n] * gain  # bed period divides evenly into the loop (see main)
    if SCENES[scene]["thunder"] and (SOUNDS / "thunder_far.mp3").exists():
        th = load("thunder_far"); th *= np.linspace(1, 0, len(th)) ** .5  # soft tail
        for at in thunder_at:
            i = int((at + .9) * SR)  # thunder arrives a moment after the flash
            seg = th[: n - i] if i < n else th[:0]; out[i:i + len(seg)] += seg * .55
            if len(th) > n - i: out[: len(th) - (n - i)] += th[n - i:] * .55  # wraps round the loop end
    pk = np.abs(out).max() or 1
    return (out / pk * .8).astype(np.float32)


def page_html():
    lib = (HERE / "lib" / "cozy.js").read_text()
    return f"<html><meta charset='utf-8'><body style='margin:0;background:#000'><canvas id=c width={W} height={H}></canvas><script>{lib}</script></body></html>"


def render_chunk(i0, i1, opts, path):
    from playwright.sync_api import sync_playwright
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "image2pipe", "-framerate", str(FPS), "-i", "-",
                           "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-g", str(FPS * 4), str(path)], stdin=subprocess.PIPE)
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={"width": W, "height": H}); pg.set_content(page_html())
        for i in range(i0, i1):
            url = pg.evaluate(f"(() => {{ const c = document.getElementById('c'); renderCozy(c.getContext('2d'), {i / FPS}, {json.dumps(opts)}); return c.toDataURL('image/jpeg', .92); }})()")
            ff.stdin.write(base64.b64decode(url.split(",", 1)[1]))
        b.close()
    ff.stdin.close(); ff.wait()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scene", default="rain_window", choices=list(SCENES)); ap.add_argument("--minutes", type=float, default=1)
    ap.add_argument("--out", default="cozy.mp4"); ap.add_argument("--silent", action="store_true", help="picture only (sounds not made yet)")
    ap.add_argument("--workers", type=int, default=4)
    a = ap.parse_args()
    # loop length = two bed periods (beds are 20 s, minus the 2 s crossfade = 18 s), so sound and picture repeat together
    loop_s = 2 * (20 - XF)
    opts = {"loop": loop_s, **SCENES[a.scene]["opts"]}
    opts.setdefault("thunderAt", [7.5, 21.0])
    work = Path(tempfile.mkdtemp(prefix="cozy-"))
    frames = int(loop_s * FPS); step = -(-frames // a.workers)
    parts = [(i, min(frames, i + step), work / f"part{k}.mp4") for k, i in enumerate(range(0, frames, step))]
    print(f"drawing a {loop_s:.0f}s loop ({frames} frames) with {len(parts)} workers")
    with cf.ThreadPoolExecutor(len(parts)) as ex: list(ex.map(lambda p: render_chunk(p[0], p[1], opts, p[2]), parts))
    (work / "parts.txt").write_text("".join(f"file '{p[2]}'\n" for p in parts))
    loop_mp4 = work / "loop.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(work / "parts.txt"), "-c", "copy", str(loop_mp4)], check=True)
    total = a.minutes * 60; reps = int(np.ceil(total / loop_s))
    (work / "loops.txt").write_text(f"file '{loop_mp4}'\n" * reps)
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(work / "loops.txt")]
    if not a.silent:
        wav = work / "loop.wav"; sf.write(wav, sound_loop(a.scene, loop_s, opts["thunderAt"]), SR)
        cmd += ["-stream_loop", "-1", "-i", str(wav), "-map", "0:v", "-map", "1:a", "-c:a", "aac", "-b:a", "160k"]
    cmd += ["-c:v", "copy", "-t", f"{total:.2f}", "-movflags", "+faststart", a.out]
    subprocess.run(cmd, check=True)
    print(f"done: {a.out} ({total / 60:.1f} min)")


if __name__ == "__main__":
    main()
