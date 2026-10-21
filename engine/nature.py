"""Nature videos: loop a real nature clip seamlessly, add matching real nature sounds and soft music, repeat to any length.

  python engine/nature.py --clip some.mp4 --beds amb_rain_heavy --thunder --music chimes --minutes 1 --out test.mp4

The clip is turned into one seamless loop (its end cross-fades into its start), the sound into another loop
(a few minutes long), and ffmpeg repeats both, so a 3-hour video costs about the same to make as a 3-minute one.
"""
import argparse, json, subprocess, tempfile, urllib.request
import stamp as corner_stamp
from pathlib import Path
import numpy as np, soundfile as sf

HERE = Path(__file__).resolve().parent
SOUNDS = HERE / "sounds"
SR, FPS = 44100, 30
MAX_BYTES = 1.85e9          # GitHub release files must stay under 2 GB
AUDIO_LOOP = 240.0          # seconds of sound before it repeats (bent to fit the music's length)
# if a nature sound hasn't been made yet, use the closest ones we have
STAND_IN = {
    "amb_rain_heavy": [("amb_rain", 1.3)], "amb_rain_leaves": [("amb_rain", 1)], "amb_waves": [("amb_wind", .8), ("amb_rain", .4)],
    "amb_stream": [("amb_rain", .7)], "amb_waterfall": [("amb_stream", 1), ("amb_rain_heavy", .6)], "amb_forest": [("amb_birds", .8), ("amb_wind", .4)],
    "amb_lake": [("amb_stream", .5), ("amb_night", .3)], "amb_evening": [("amb_night", .6), ("amb_birds", .4)], "amb_fire": [("amb_room", 1)],
}
THUNDER = 0.5               # distant thunder: noticeable rolls, never a startling crack
MUSIC_FILES = {"piano": "music_calm", "lofi": "music_lofi"}


def run(cmd): subprocess.run(cmd, check=True)


def load(name):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(SOUNDS / f"{name}.mp3"), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], check=True, capture_output=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def seamless(a, xf=2.0):
    x = int(xf * SR); body, tail = a[:-x].copy(), a[-x:]
    k = np.linspace(0, 1, x); body[:x] = body[:x] * np.sqrt(k) + tail * np.sqrt(1 - k)
    return body


def rms(a): return np.sqrt((a ** 2).mean()) + 1e-9


def resolve(beds, log=print):
    """Swap any sound not made yet for its stand-ins."""
    out = []
    for name, vol in beds:
        if (SOUNDS / f"{name}.mp3").exists(): out.append((name, vol)); continue
        subs = [(s, vol * v) for s, v in STAND_IN.get(name, []) if (SOUNDS / f"{s}.mp3").exists()]
        log(f"sound {name} not made yet, using {[s for s, _ in subs] or 'nothing'}"); out += subs
    return out


def sound_loop(beds, thunder, music, log=print):
    """Nature beds + optional thunder + soft music, as one seamless loop. Returns float32 mono."""
    m_loop = None
    if music in MUSIC_FILES and (SOUNDS / f"{MUSIC_FILES[music]}.mp3").exists():
        m_loop = seamless(load(MUSIC_FILES[music]), 3.0)
        n = int(round(AUDIO_LOOP / (len(m_loop) / SR))) * len(m_loop)          # whole repeats of the track
    else:
        n = int(AUDIO_LOOP * SR)
    xf = int(3 * SR); m = n + xf
    nat = np.zeros(m)
    for name, vol in resolve(beds, log):
        b = seamless(load(name)); nat += np.tile(b, m // len(b) + 1)[:m] / rms(b) * vol
    if thunder and (SOUNDS / "thunder.mp3").exists():
        th = load("thunder"); th = th / rms(th); base = rms(nat)
        for at in (.12, .47, .81):                                              # three distant rolls per loop
            i = int(at * n); seg = th[: m - i]; nat[i:i + len(seg)] += seg * base * THUNDER
    k = np.linspace(0, 1, xf); nat[:xf] = nat[:xf] * np.sqrt(k) + nat[n:n + xf] * np.sqrt(1 - k); nat = nat[:n]
    nat = nat / rms(nat) * .12
    if music != "none":
        if m_loop is not None: mus = np.tile(m_loop, n // len(m_loop))
        else:
            from calm_music import MAKERS
            mus = MAKERS[music](n) if music in MAKERS else np.zeros(n)
        if mus.any(): nat = nat + mus / rms(mus) * (.035 if music != "lofi" else .045)   # music sits softly under nature
    nat = nat / rms(nat) * .1                    # every mix equally loud (about -20 dB)
    return (np.tanh(nat / .8) * .8).astype(np.float32)   # soft limiter: crackles, chimes and thunder never clip


def duration(path):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)], check=True, capture_output=True, text=True).stdout.strip())


def video_loop(clip, out, minutes, log=print, stamp=True):
    """One seamless loop of the clip: [middle part] + [end cross-fading into the start]. Size kept so the long video stays under 2 GB."""
    L = duration(clip); xf = min(2.0, max(.5, L / 5))
    kbps = MAX_BYTES * 8 / (minutes * 60) / 1000 - 180
    w, h = (1920, 1080) if kbps >= 2400 else (1280, 720)
    rate = int(min(kbps, 7000 if h == 1080 else 4000))
    log(f"clip {L:.1f}s -> loop {L - xf:.1f}s at {w}x{h}, up to {rate} kbps")
    f = (f"[0:v]scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},fps={FPS},format=yuv420p,split=3[a][b][c];"
         f"[a]trim={xf}:{L - xf},setpts=PTS-STARTPTS[body];[b]trim={L - xf}:{L},setpts=PTS-STARTPTS[tail];[c]trim=0:{xf},setpts=PTS-STARTPTS[head];"
         f"[tail][head]xfade=transition=fade:duration={xf}:offset=0[tr];[body][tr]concat=n=2:v=1:a=0[v]")
    if stamp: f += corner_stamp.overlay(h)                            # the small "Story Studio" mark in the corner
    run(["ffmpeg", "-v", "error", "-y", "-i", str(clip), *(["-i", str(corner_stamp.PNG)] if stamp else []), "-filter_complex", f, "-map", "[vs]" if stamp else "[v]", "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "21",
         "-maxrate", f"{rate}k", "-bufsize", f"{rate * 2}k", "-g", str(FPS * 2), str(out)])
    return duration(out)


def download(url, path):
    req = urllib.request.Request(url, headers={"User-Agent": "StoryStudio/1.0 (calm video maker)"})
    with urllib.request.urlopen(req, timeout=300) as r, open(path, "wb") as f:
        while True:
            b = r.read(1 << 20)
            if not b: break
            f.write(b)


def make_nature(opts, out, minutes, progress=lambda pct, note: None, log=print, clip_path=None):
    work = Path(tempfile.mkdtemp(prefix="nature-"))
    clip = Path(clip_path) if clip_path else work / "clip.mp4"
    if not clip_path:
        progress(15, "Downloading the nature video"); download(opts["clip"]["url"], clip)
    progress(30, "Making the video loop seamlessly")
    loop_mp4 = work / "loop.mp4"; loop_s = video_loop(clip, loop_mp4, minutes, log, stamp=opts.get("stamp", True))
    progress(60, "Mixing the nature sounds and music")
    wav = work / "sound.wav"; sf.write(wav, sound_loop([tuple(b) for b in opts["beds"]], opts.get("thunder"), opts.get("music", "none"), log), SR)
    progress(75, f"Putting together {minutes} minutes")
    total = minutes * 60; reps = int(np.ceil(total / loop_s))
    (work / "loops.txt").write_text(f"file '{loop_mp4}'\n" * reps)
    run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(work / "loops.txt"), "-stream_loop", "-1", "-i", str(wav),
         "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-t", f"{total:.2f}", "-movflags", "+faststart", str(out)])
    log(f"done: {out} ({Path(out).stat().st_size / 1e6:.0f} MB)")
    return total


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--clip", required=True); ap.add_argument("--beds", nargs="+", default=["amb_rain"]); ap.add_argument("--thunder", action="store_true")
    ap.add_argument("--music", default="none"); ap.add_argument("--minutes", type=float, default=1); ap.add_argument("--out", default="nature.mp4"); ap.add_argument("--no-stamp", action="store_true")
    a = ap.parse_args()
    make_nature({"beds": [[b, 1] for b in a.beds], "thunder": a.thunder, "music": a.music, "stamp": not a.no_stamp}, a.out, a.minutes, clip_path=a.clip)


if __name__ == "__main__":
    main()
