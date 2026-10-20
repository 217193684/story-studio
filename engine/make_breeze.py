"""A soft, natural breeze (no microphone rumble, no howl), made from shaped noise with slow random gusts.

  python engine/make_breeze.py      -> engine/sounds/amb_wind.mp3 (2 minutes, loops seamlessly)
"""
import subprocess
from pathlib import Path
import numpy as np, soundfile as sf
from scipy.signal import stft, istft

HERE = Path(__file__).resolve().parent
SR, SECS = 44100, 120


def slow(n_frames, rng, periods=(31, 17, 11, 7)):
    """A smooth 0..1 wobble that repeats exactly every SECS seconds (so the loop is seamless)."""
    t = np.linspace(0, 1, n_frames, endpoint=False); x = np.zeros(n_frames)
    for k, cyc in enumerate(periods):
        x += np.sin(2 * np.pi * (SECS / cyc) // 1 * t + rng.uniform(0, 6.28)) / (k + 1)
    return (x - x.min()) / (x.max() - x.min())


def main(seed=11):
    rng = np.random.default_rng(seed); n = SECS * SR
    noise = rng.standard_normal(n)
    f, t, Z = stft(noise, SR, nperseg=4096, noverlap=3072)
    gust = slow(len(t), rng); swirl = slow(len(t), rng, (23, 13, 9, 5))
    fc = 260 * 2 ** (1.3 * (.6 * gust + .4 * swirl))                       # whoosh moves between ~260 and ~650 Hz
    lf = np.log2(np.maximum(f, 20))[:, None]
    body = np.exp(-.5 * ((lf - np.log2(fc)[None, :]) / 1.05) ** 2)          # broad, soft band (no whistle)
    air = np.exp(-.5 * ((lf - np.log2(2600)) / .9) ** 2) * .16 * gust[None, :] ** 2   # leaves/grass hiss rises with gusts
    pink = 1 / np.sqrt(np.maximum(f, 20))[:, None]
    level = (.28 + .72 * gust ** 1.4)[None, :]
    _, y = istft(Z * (body + air) * pink * level, SR, nperseg=4096, noverlap=3072)
    y = y[:n]; y = y / np.sqrt((y ** 2).mean()) * .08
    wav = HERE / "sounds" / "amb_wind.wav"; sf.write(wav, y.astype(np.float32), SR)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-ac", "1", "-b:a", "192k", str(wav.with_suffix(".mp3"))], check=True); wav.unlink()


if __name__ == "__main__":
    main()
