"""Render a test sheet: python test/sheet.py <js-snippet-file> <out.png> [w h]"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright
HERE = Path(__file__).resolve().parent.parent
libs = ["core.js", "people.js", "animals.js", "props.js", "places.js", "effects.js"]
w, h = (int(sys.argv[3]), int(sys.argv[4])) if len(sys.argv) > 4 else (1600, 900)
src = "".join(f"<script src='{(HERE/'lib'/l).as_uri()}'></script>" for l in libs if (HERE/'lib'/l).exists())
html = f"<html><body style='margin:0'><canvas id=c width={w} height={h}></canvas>{src}<script>g=document.getElementById('c').getContext('2d');{Path(sys.argv[1]).read_text()}</script></body></html>"
tmp = HERE / "test" / "_sheet.html"; tmp.write_text(html)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": w, "height": h})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(tmp.as_uri()); pg.wait_for_timeout(300)
    pg.screenshot(path=sys.argv[2]); b.close()
print("errors:", errs[:5] if errs else "none")
