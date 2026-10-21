"""Kumz Calm channel artwork: banner (2560x1440), profile picture (800x800) and video watermark (300x300 PNG).

  python scripts/brand/make_brand.py   -> public/brand/*.png|jpg

Calm night-to-dusk sky, layered mountains, a warm moon (the Story Studio yellow), Fredoka lettering.
"""
import base64, math, random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "brand"
SUN, INK = "#f5b700", "#3a2a00"


def font_css():
    css = ""
    for w in (500, 600, 700):
        b = base64.b64encode((ROOT / "public" / "fonts" / f"fredoka-{w}.woff2").read_bytes()).decode()
        css += f"@font-face{{font-family:F;font-weight:{w};src:url(data:font/woff2;base64,{b}) format('woff2')}}"
    return css


def ridge(w, base, amp, seed, step=8, peaks=7):
    """A mountain ridge (real peaks, not dunes) as an SVG path, filled down to the bottom."""
    rnd = random.Random(seed)
    P = [(rnd.uniform(-.1, 1.1) * w, amp * rnd.uniform(.45, 1.0), w * rnd.uniform(.07, .16)) for _ in range(peaks)]
    pts = []
    for x in range(-20, w + 40, step):
        y = 0.0
        for px, ph, pw in P:
            d = abs(x - px) / pw
            if d < 1: y = max(y, ph * (1 - d) ** 1.25)
        y += amp * .05 * math.sin(x * .021 + seed) + amp * .025 * math.sin(x * .067 + seed * 2)
        pts.append(f"{x},{base - y:.1f}")
    return "M" + " L".join(pts) + f" L{w + 40},4000 L-20,4000 Z"


def stars(w, h, n, seed, max_y):
    rnd = random.Random(seed); s = ""
    for _ in range(n):
        x, y = rnd.uniform(0, w), rnd.uniform(0, max_y) ** 1.0
        r = rnd.choice([1.1, 1.4, 1.8, 2.4, 3.2]) * (w / 2560) ** .3 * 1.4
        o = rnd.uniform(.35, .95) * (1 - y / max_y * .6)
        s += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.1f}" fill="#fff" opacity="{o:.2f}"/>'
    return s


def scene(w, h, horizon, moon, moon_r, n_stars, seed=3, ridges=None, crescent=False):
    """Sky, glow, moon, stars, mountains and mist as one SVG."""
    mx, my = moon; hz = min(.98, horizon / h)
    ridges = ridges or [(horizon - h * .02, h * .16, "#3b4a85", .9), (horizon + h * .03, h * .12, "#2a3568", 1), (horizon + h * .08, h * .09, "#1b2448", 1), (horizon + h * .13, h * .06, "#121a36", 1)]
    paths = "".join(f'<path d="{ridge(w, b, a, seed + i)}" fill="{c}" opacity="{o}"/>' for i, (b, a, c, o) in enumerate(ridges))
    mist = "".join(f'<rect x="0" y="{b - h * .035:.0f}" width="{w}" height="{h * .06:.0f}" fill="url(#mist)" opacity=".35"/>' for b, _, _, _ in ridges[:3])
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
<defs>
 <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#0b1330"/><stop offset="{hz * .55:.3f}" stop-color="#1d2a5c"/><stop offset="{hz * .82:.3f}" stop-color="#4b4a86"/>
  <stop offset="{hz * .94:.3f}" stop-color="#c07f8c"/><stop offset="{hz:.3f}" stop-color="#f4b56a"/><stop offset="1" stop-color="#f4b56a"/></linearGradient>
 <mask id="cres"><rect width="{w}" height="{h}" fill="#fff"/><circle cx="{mx + moon_r * .42}" cy="{my - moon_r * .28}" r="{moon_r * .86}" fill="#000"/></mask>
 <radialGradient id="glow" cx="{mx}" cy="{my}" r="{moon_r * 6}" gradientUnits="userSpaceOnUse">
  <stop offset="0" stop-color="#ffe7a3" stop-opacity=".55"/><stop offset=".35" stop-color="#ffd27a" stop-opacity=".16"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
 <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9d4ff" stop-opacity="0"/><stop offset=".5" stop-color="#c9d4ff" stop-opacity=".55"/><stop offset="1" stop-color="#c9d4ff" stop-opacity="0"/></linearGradient>
 <radialGradient id="moonfill" cx="{mx - moon_r * .3}" cy="{my - moon_r * .3}" r="{moon_r * 1.4}" gradientUnits="userSpaceOnUse">
  <stop offset="0" stop-color="#ffe9a8"/><stop offset=".6" stop-color="{SUN}"/><stop offset="1" stop-color="#e0a200"/></radialGradient>
</defs>
<rect width="{w}" height="{h}" fill="url(#sky)"/>
{stars(w, h, n_stars, seed, horizon * .8)}
<rect width="{w}" height="{h}" fill="url(#glow)"/>
<circle cx="{mx}" cy="{my}" r="{moon_r}" fill="url(#moonfill)" {'mask="url(#cres)"' if crescent else ''}/>
{paths}{mist}
</svg>"""


def page(body, w, h):
    return f"""<!doctype html><html><head><style>{font_css()}
html,body{{margin:0;width:{w}px;height:{h}px;overflow:hidden;background:#0b1330}}
.wrap{{position:relative;width:{w}px;height:{h}px}} .wrap>svg{{position:absolute;inset:0}}
</style></head><body><div class="wrap">{body}</div></body></html>"""


def banner():
    w, h = 2560, 1440
    # what desktops/phones show is only the middle band (about 1546x423, y 508..931); TVs show everything
    svg = scene(w, h, horizon=930, moon=(1950, 640), moon_r=62, n_stars=420, crescent=True,
                ridges=[(930, 230, "#4a4f8e", .8), (975, 200, "#313b74", 1), (1040, 170, "#212b57", 1), (1130, 130, "#151d3d", 1), (1260, 90, "#0c1228", 1)])
    text = f"""<div style="position:absolute;left:0;right:0;top:570px;text-align:center;font-family:F;color:#fff">
  <div style="font-weight:700;font-size:150px;line-height:1;letter-spacing:1px;text-shadow:0 6px 30px rgba(5,10,30,.6)">Kumz Calm</div>
  <div style="font-weight:500;font-size:46px;margin-top:22px;opacity:.92;text-shadow:0 3px 16px rgba(5,10,30,.7)">Real nature sounds for sleep, study &amp; calm</div>
  <div style="display:inline-block;margin-top:26px;padding:10px 30px;border-radius:999px;background:{SUN};color:{INK};font-weight:700;font-size:30px;letter-spacing:3px;box-shadow:0 6px 24px rgba(0,0,0,.35)">NEW VIDEOS EVERY WEEK</div>
</div>"""
    return page(svg + text, w, h), w, h


def avatar(size=800):
    svg = scene(size, size, horizon=600, moon=(size * .55, size * .34), moon_r=size * .16, n_stars=60, seed=21, crescent=True,
                ridges=[(600, 230, "#4a4f8e", .85), (640, 170, "#313b74", 1), (700, 120, "#212b57", 1), (760, 70, "#151d3d", 1)])
    return page(svg, size, size), size, size


def main():
    from playwright.sync_api import sync_playwright
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch()
        for name, (html, w, h), kind in [("banner", banner(), "jpeg"), ("avatar", avatar(), "png")]:
            pg = b.new_page(viewport={"width": w, "height": h}); pg.set_content(html); pg.evaluate("document.fonts.ready")
            pg.wait_for_timeout(300)
            path = OUT / f"{name}.{'jpg' if kind == 'jpeg' else 'png'}"
            pg.screenshot(path=str(path), type=kind, **({"quality": 92} if kind == "jpeg" else {})); pg.close(); print("made", path)
        b.close()
    # round video watermark (transparent outside the circle)
    from PIL import Image, ImageDraw
    a = Image.open(OUT / "avatar.png").convert("RGBA").resize((300, 300), Image.LANCZOS)
    m = Image.new("L", (1200, 1200), 0); ImageDraw.Draw(m).ellipse([0, 0, 1199, 1199], fill=255); m = m.resize((300, 300), Image.LANCZOS)
    a.putalpha(m); a.save(OUT / "watermark.png"); print("made watermark")


if __name__ == "__main__":
    main()
