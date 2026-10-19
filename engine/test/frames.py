import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from render import page_html
from playwright.sync_api import sync_playwright
from PIL import Image
work = Path(sys.argv[1]); D = json.loads((work / "D.json").read_text()); times = [float(x) for x in sys.argv[3].split(",")]
html = work / "_t.html"; html.write_text(page_html(1280, 720))
ims = []
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1280, "height": 720}); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e))); pg.add_init_script("window.D=" + json.dumps(D) + ";"); pg.goto(html.as_uri())
    for t in times:
        pg.evaluate(f"render({t})"); f = work / f"f_{t:06.2f}.png"; pg.screenshot(path=str(f)); ims.append(Image.open(f).convert("RGB").resize((640, 360)))
    b.close()
cols = 2; rows = (len(ims) + 1) // 2; s = Image.new("RGB", (cols * 645, rows * 365), (20, 20, 20))
for i, im in enumerate(ims): s.paste(im, ((i % 2) * 645, (i // 2) * 365))
s.save(sys.argv[2]); print("errors:", errs[:3] or "none")
