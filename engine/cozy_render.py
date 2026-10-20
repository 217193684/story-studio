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

SCENES = {  # scene -> picture options + the real recordings (from make_sounds.py) it uses
    "rain_window": {"opts": {"rain": "steady", "thunder": True}, "bed": "amb_rain", "thunder": True},
    "quiet_rain": {"opts": {"rain": "steady", "thunder": False}, "bed": "amb_rain", "thunder": False},
    "storm_window": {"opts": {"rain": "heavy", "thunder": True}, "bed": "amb_rain", "thunder": True},
}
KAWAII = {"cat_meal": {"lib": "kawaii.js", "fn": "renderKawaii", "loop": 40.0}}  # flat cute ASMR scenes with timed sounds
FRAME = SR // FPS  # 1470 samples per frame, so sound and picture loops have exactly the same length


def load(name):
    """Decode a real recording from engine/sounds to mono float at SR."""
    p = SOUNDS / f"{name}.mp3"
    if not p.exists(): raise SystemExit(f"missing sound {p.name} — run engine/make_sounds.py first")
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(p), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], check=True, capture_output=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def seamless(a):
    """Fold the last XF seconds over the start with an equal-power crossfade, then cut to whole video frames."""
    x = int(XF * SR); body, tail = a[:-x].copy(), a[-x:]
    k = np.linspace(0, 1, x); body[:x] = body[:x] * np.sqrt(k) + tail * np.sqrt(1 - k)
    return body[: len(body) // FRAME * FRAME]


def sound_loop(scene, music):
    """Builds the sound loop and returns (audio, loop seconds, thunder times). The loop is two passes of the rain bed."""
    S = SCENES[scene]; bed = seamless(load(S["bed"]))
    if scene == "storm_window": bed = bed * 1.25
    out = np.tile(bed, 2); n = len(out); loop_s = n / SR
    thunder_at = [loop_s * .2, loop_s * .62] if S["thunder"] else []
    if S["thunder"]:
        th = load("thunder"); th = th / (np.abs(th).max() or 1) * np.linspace(1, .2, len(th))
        for at in thunder_at:
            i = int((at + .9) * SR); seg = th[: n - i]; out[i:i + len(seg)] += seg * .5  # rumble a moment after the flash
            if len(th) > n - i: out[: len(th) - (n - i)] += th[n - i:] * .5  # wraps round the loop end
    if music and (SOUNDS / "music_calm.mp3").exists():  # optional soft piano under the rain
        m = seamless(load("music_calm")); m = np.tile(m, n // len(m) + 1)[:n]
        k = np.ones(n); f = int(3 * SR); k[:f] = np.linspace(.6, 1, f); k[-f:] = np.linspace(1, .6, f)  # soft join at the loop point
        out = out / (np.sqrt((out ** 2).mean()) + 1e-9) * .08 + m / (np.sqrt((m ** 2).mean()) + 1e-9) * .05 * k
    pk = np.abs(out).max() or 1
    return (out / pk * .8).astype(np.float32), loop_s, thunder_at


def kawaii_sound_loop(scene, loop_s):
    """Rain on the window and soft calm music underneath, with the scene's ASMR sounds at their exact moments."""
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(); pg.set_content(page_html(KAWAII[scene]["lib"]))
        events = pg.evaluate("kawaiiSounds()")["events"]; b.close()
    n = int(round(loop_s * FPS)) * FRAME; xf = int(XF * SR); m = n + xf  # make a little extra, then fold it over the start
    out = np.zeros(m)
    rain = seamless(load("amb_rain")); out += np.tile(rain, m // len(rain) + 1)[:m] / (np.sqrt((rain ** 2).mean()) + 1e-9) * .03
    if (SOUNDS / "music_calm.mp3").exists():
        mu = seamless(load("music_calm")); out += np.tile(mu, m // len(mu) + 1)[:m] / (np.sqrt((mu ** 2).mean()) + 1e-9) * .05
    for at, name in events:
        if not (SOUNDS / f"{name}.mp3").exists(): print("sound not made yet:", name); continue
        x = load(name); x = x / (np.abs(x).max() or 1) * .35; i = int(at * SR); out[i:i + len(x)] += x[: m - i]
    k = np.linspace(0, 1, xf); out[:xf] = out[:xf] * np.sqrt(k) + out[n:n + xf] * np.sqrt(1 - k)  # seamless loop point
    out = out[:n]; return (out / (np.abs(out).max() or 1) * .85).astype(np.float32)


def page_html(lib_name="cozy.js"):
    lib = (HERE / "lib" / lib_name).read_text()
    return f"<html><meta charset='utf-8'><body style='margin:0;background:#000'><canvas id=c width={W} height={H}></canvas><script>{lib}</script></body></html>"


def render_chunk(i0, i1, opts, path, lib="cozy.js", fn="renderCozy"):
    from playwright.sync_api import sync_playwright
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "image2pipe", "-framerate", str(FPS), "-i", "-",
                           "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-g", str(FPS * 4), str(path)], stdin=subprocess.PIPE)
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={"width": W, "height": H}); pg.set_content(page_html(lib))
        for i in range(i0, i1):
            url = pg.evaluate(f"(() => {{ const c = document.getElementById('c'); {fn}(c.getContext('2d'), {i / FPS}, {json.dumps(opts)}); return c.toDataURL('image/jpeg', .92); }})()")
            ff.stdin.write(base64.b64decode(url.split(",", 1)[1]))
        b.close()
    ff.stdin.close(); ff.wait()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scene", default="rain_window", choices=list(SCENES) + list(KAWAII)); ap.add_argument("--minutes", type=float, default=1)
    ap.add_argument("--out", default="cozy.mp4"); ap.add_argument("--silent", action="store_true", help="picture only (sounds not made yet)")
    ap.add_argument("--workers", type=int, default=4); ap.add_argument("--music", action="store_true", help="add soft calm music under the rain")
    a = ap.parse_args()
    if a.scene in KAWAII:
        K = KAWAII[a.scene]; loop_s = K["loop"]; lib, fn, opts = K["lib"], K["fn"], {}
        audio = None if a.silent else kawaii_sound_loop(a.scene, loop_s)
    else:
        audio, loop_s, thunder_at = sound_loop(a.scene, a.music)  # the picture loop is made exactly as long as the sound loop
        opts = {"loop": loop_s, "thunderAt": thunder_at, **SCENES[a.scene]["opts"]}; lib, fn = "cozy.js", "renderCozy"
    work = Path(tempfile.mkdtemp(prefix="cozy-"))
    frames = round(loop_s * FPS); step = -(-frames // a.workers)
    parts = [(i, min(frames, i + step), work / f"part{k}.mp4") for k, i in enumerate(range(0, frames, step))]
    print(f"drawing a {loop_s:.2f}s loop ({frames} frames) with {len(parts)} workers")
    with cf.ThreadPoolExecutor(len(parts)) as ex: list(ex.map(lambda p: render_chunk(p[0], p[1], opts, p[2], lib, fn), parts))
    (work / "parts.txt").write_text("".join(f"file '{p[2]}'\n" for p in parts))
    loop_mp4 = work / "loop.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(work / "parts.txt"), "-c", "copy", str(loop_mp4)], check=True)
    total = a.minutes * 60; reps = int(np.ceil(total / loop_s))
    (work / "loops.txt").write_text(f"file '{loop_mp4}'\n" * reps)
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(work / "loops.txt")]
    if not a.silent:
        wav = work / "loop.wav"; sf.write(wav, audio, SR)
        cmd += ["-stream_loop", "-1", "-i", str(wav), "-map", "0:v", "-map", "1:a", "-c:a", "aac", "-b:a", "160k"]
    cmd += ["-c:v", "copy", "-t", f"{total:.2f}", "-movflags", "+faststart", a.out]
    subprocess.run(cmd, check=True)
    print(f"done: {a.out} ({total / 60:.1f} min)")


if __name__ == "__main__":
    main()
