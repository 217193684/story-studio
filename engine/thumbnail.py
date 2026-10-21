"""Renders a Story Studio thumbnail (1280x720 JPEG) with the same drawing code the website uses (public/thumbnail.js),
so the picture sent to YouTube is exactly the one picked in the preview."""
import base64, json, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "StoryStudio/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r: return r.read()


def picture_for(clip_thumb):
    """The clip's picture in the biggest size Pixabay has (same frame as the preview)."""
    for u in (clip_thumb.replace("_medium.jpg", "_large.jpg"), clip_thumb):
        try: return fetch(u)
        except Exception: continue
    return None


def render(spec, image=None):
    from playwright.sync_api import sync_playwright
    js = (ROOT / "public" / "thumbnail.js").read_text()
    data = f"data:image/jpeg;base64,{base64.b64encode(image).decode()}" if image else ""
    fonts = {f.name: "data:font/woff2;base64," + base64.b64encode(f.read_bytes()).decode() for f in (ROOT / "public" / "fonts").glob("fredoka-*.woff2")}
    html = f"""<!doctype html><html><head></head>
<body style="margin:0"><canvas id="c" width="1280" height="720"></canvas><script>{js}</script></body></html>"""
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1280, "height": 720}); pg.set_content(html)
        url = pg.evaluate("""async ([spec, data, fonts]) => {
            await StoryThumb.loadFonts((name) => fonts[name]);
            let img = null;
            if (data) { img = new Image(); img.src = data; await img.decode(); }
            const c = document.getElementById("c"); StoryThumb.draw(c.getContext("2d"), img, spec);
            return c.toDataURL("image/jpeg", 0.9);
        }""", [spec, data, fonts])
        b.close()
    return base64.b64decode(url.split(",", 1)[1])


if __name__ == "__main__":
    import sys
    spec = json.loads(sys.argv[1]); img = Path(sys.argv[2]).read_bytes() if len(sys.argv) > 2 else None
    Path(sys.argv[3] if len(sys.argv) > 3 else "thumb.jpg").write_bytes(render(spec, img))
