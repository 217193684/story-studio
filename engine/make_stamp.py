"""Draws the small "Story Studio" corner stamp (yellow dot + name, like the site's logo) as a transparent PNG.

  python engine/make_stamp.py      -> engine/stamp.png and public/stamp.png (the website preview uses the same picture)
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).resolve().parent
FONTS = ["/usr/share/fonts/opentype/inter/Inter-SemiBold.otf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]
S = 4                                   # draw 4x bigger, then shrink: smooth edges
H = 150                                 # final picture is 150 px tall (it gets scaled to the video)


def main():
    font = next((ImageFont.truetype(f, 70 * S) for f in FONTS if Path(f).exists()), ImageFont.load_default())
    text = "Story Studio"
    tw = int(font.getlength(text)); pad = 22 * S
    dot = 78 * S; gap = 22 * S
    w = pad + dot + gap + tw + pad; h = H * S
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    # soft shadow behind everything so it reads on bright skies and dark forests alike
    sh = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(sh)
    cy = h // 2
    d.ellipse([pad, cy - dot // 2, pad + dot, cy + dot // 2], fill=(0, 0, 0, 120))
    d.text((pad + dot + gap, cy), text, font=font, fill=(0, 0, 0, 150), anchor="lm")
    sh = sh.filter(ImageFilter.GaussianBlur(7 * S)); img.alpha_composite(sh)
    d = ImageDraw.Draw(img)
    # the dot: warm yellow with a darker crescent, like the logo on the site
    x0, y0 = pad, cy - dot // 2
    d.ellipse([x0, y0, x0 + dot, y0 + dot], fill=(224, 162, 0, 255))
    d.ellipse([x0, y0, x0 + dot - 9 * S, y0 + dot - 7 * S], fill=(245, 183, 0, 255))
    d.text((pad + dot + gap, cy), text, font=font, fill=(255, 255, 255, 255), anchor="lm")
    img = img.resize((w // S, h // S), Image.LANCZOS)
    for p in (HERE / "stamp.png", HERE.parent / "public" / "stamp.png"):
        p.parent.mkdir(exist_ok=True); img.save(p)
    print("stamp", img.size)


if __name__ == "__main__":
    main()
