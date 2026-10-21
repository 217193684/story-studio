"""The corner stamp on finished videos: where it goes and the ffmpeg pieces to put it there (kept in one place so every video matches the preview)."""
from pathlib import Path

PNG = Path(__file__).resolve().parent / "stamp.png"
HEIGHT = 0.044       # stamp height as a share of the video height
MARGIN = 0.03        # distance from the left and bottom edges, as a share of the video height
OPACITY = 0.85


def overlay(h, src="[v]", out="[vs]", stamp_input=1):
    """ffmpeg filter pieces: draws the stamp (an extra -i stamp.png input) in the bottom-left corner of a video that is `h` pixels tall."""
    sh = max(24, round(h * HEIGHT) // 2 * 2); mg = round(h * MARGIN)
    return (f";[{stamp_input}:v]scale=-2:{sh},format=rgba,colorchannelmixer=aa={OPACITY}[wm];"
            f"{src}[wm]overlay=x={mg}:y=H-h-{mg}{out}")
