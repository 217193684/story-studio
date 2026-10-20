"""Short sound previews for the Calming videos page, so you can hear a mix before making a long video.

  python engine/make_previews.py

Makes public/preview/nature/<place>-<sound>.mp3 (the nature sound exactly as the video maker mixes it, incl. stand-ins
and thunder) and public/preview/music/<music>.mp3. The page plays the two together. Run again after new sounds are made.
"""
import json, subprocess, sys
from pathlib import Path
import numpy as np, soundfile as sf

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
import nature  # noqa: E402
from calm_music import MAKERS  # noqa: E402

SECS = 24
OUT = ROOT / "public" / "preview"


def envs():
    js = "import('" + str(ROOT / "src/lib/nature.ts") + "').then(m => console.log(JSON.stringify(m.ENVIRONMENTS)))"
    r = subprocess.run(["node", "--experimental-strip-types", "--no-warnings", "-e", js], check=True, capture_output=True, text=True)
    return json.loads(r.stdout)


def mp3(a, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    wav = path.with_suffix(".wav"); sf.write(wav, a.astype(np.float32), nature.SR)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-ac", "1", "-b:a", "64k", str(path)], check=True)
    wav.unlink()


def main():
    nature.AUDIO_LOOP = SECS
    for env, E in envs().items():
        for key, S in E["sounds"].items():
            a = nature.sound_loop([tuple(b) for b in S["beds"]], S.get("thunder"), "none", log=lambda *_: None)
            mp3(a, OUT / "nature" / f"{env}-{key}.mp3"); print("nature", env, key)
    n = SECS * nature.SR
    for m in ["piano", "lofi", *MAKERS]:
        if m in nature.MUSIC_FILES:
            a = nature.load(nature.MUSIC_FILES[m])[:n]
            f = int(1.5 * nature.SR); a[-f:] *= np.linspace(1, 0, f); a[:f] *= np.linspace(0, 1, f)
        else:
            a = MAKERS[m](n)
        mp3(a / nature.rms(a) * .1, OUT / "music" / f"{m}.mp3"); print("music", m)


if __name__ == "__main__":
    main()
