"""Turn the chosen real field recordings (engine/nature_sources.json) into Story Studio's nature sound beds.

  python engine/build_nature_beds.py            (needs internet: downloads the originals from Wikimedia Commons)

Each recording is cut to its best steady part and cleaned so it is calming to listen to for hours:
low rumble removed, harsh hiss softened, sudden loud bursts evened out. Saved as engine/sounds/<name>.mp3.
"""
import json, subprocess, tempfile, urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
UA = {"User-Agent": "StoryStudio/1.0 (calm nature videos; https://story-studio-kappa-one.vercel.app) python-urllib"}
LOW_CUT = {"amb_lake": 160, "amb_fire": 150, "thunder": 30, "amb_waves": 45, "amb_rain_heavy": 60, "amb_waterfall": 60}       # keep their deep body
HIGH_CUT = {"thunder": 2500, "amb_fire": 9000, "amb_rain_heavy": 10000}
EVEN_OUT = {"amb_birds", "amb_evening", "amb_fire", "amb_lake", "amb_forest", "amb_rain_leaves"}  # sudden loud bits softened


def main():
    src = json.loads((HERE / "nature_sources.json").read_text())
    for name, s in src.items():
        tmp = Path(tempfile.mkdtemp()) / "orig"
        with urllib.request.urlopen(urllib.request.Request(s["url"], headers=UA), timeout=300) as r: tmp.write_bytes(r.read())
        f = [f"highpass=f={LOW_CUT.get(name, 100)}:poles=2", f"lowpass=f={HIGH_CUT.get(name, 12000)}:poles=1"]
        if name in EVEN_OUT: f.append("acompressor=threshold=-26dB:ratio=3:attack=8:release=250:makeup=2")
        if name == "thunder": f.append("afade=t=in:d=0.4,afade=t=out:st={:.1f}:d=4".format(s["seconds"] - 4))
        f.append("loudnorm=I=-24:TP=-3:LRA=11")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(s["start"]), "-t", str(s["seconds"]), "-i", str(tmp),
                        "-af", ",".join(f), "-ac", "1", "-ar", "44100", "-b:a", "192k", str(HERE / "sounds" / f"{name}.mp3")], check=True)
        print("made", name, "from", s["title"], s["licence"])


if __name__ == "__main__":
    main()
