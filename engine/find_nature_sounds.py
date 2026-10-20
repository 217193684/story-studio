"""Find real nature field recordings on Wikimedia Commons that are free to use in YouTube videos.

Only CC0 / public domain / CC BY (attribution) files are kept — never share-alike (SA), non-commercial (NC) or no-derivatives (ND).
Each candidate is saved as a 90-second mono mp3 in sound_candidates/<kind>/ with its licence details, for checking by ear and by numbers.
"""
import json, os, re, subprocess, tempfile, time, urllib.parse, urllib.request
from pathlib import Path

OUT = Path("sound_candidates")
UA = {"User-Agent": "StoryStudio/1.0 (calm nature videos; https://story-studio-kappa-one.vercel.app) python-urllib"}
PER_KIND = 12
SEARCH = {
    "wind": ["wind blowing field recording", "wind in grass", "breeze in trees", "wind ambience", "gentle wind"],
    "crickets": ["crickets night", "crickets chirping", "night insects ambience", "summer night ambience"],
    "birds": ["birdsong", "dawn chorus", "forest birds ambience", "bird song morning"],
    "evening": ["evening ambience", "dusk birds", "summer evening ambience", "sunset ambience"],
    "forest": ["forest ambience", "leaves rustling", "woodland ambience", "forest sound"],
    "stream": ["stream babbling", "brook", "creek water", "small stream"],
    "waterfall": ["waterfall", "waterfall sound", "cascade water"],
    "lake": ["lake water lapping", "lakeshore", "water lapping", "lake ambience"],
    "waves": ["ocean waves", "sea waves beach", "surf", "waves on shore"],
    "rain": ["rain", "rain ambience", "rain on leaves", "heavy rain", "rain falling"],
    "thunder": ["thunder", "thunderstorm", "thunder rumble"],
    "fire": ["fireplace crackling", "campfire", "fire crackling", "crackling fire"],
    "city": ["distant traffic", "city ambience", "city at night ambience", "urban ambience", "traffic hum", "balcony city", "highway distant"],
    "cicadas": ["cicada", "cicadas", "cicadas summer", "cicada chorus"],
    "frogs": ["frogs night", "frog chorus", "frogs pond", "toads"],
    "roof_rain": ["rain on roof", "rain on tin roof", "rain metal roof", "rain gutter"],
    "train": ["distant train", "train passing", "train horn distant", "freight train"],
    "bells": ["church bells", "distant church bells", "bells ringing"],
    "chimes": ["wind chimes", "windchime", "wind chime"],
}
LOOSE = {"city": "traffic|car|city", "train": "train"}      # words normally skipped that these kinds need
OK_LICENCE = re.compile(r"^(cc0|cc-zero|public domain|pd\b|pd-|cc[ -]by[ -][\d.]+)$", re.I)
BAD_LICENCE = re.compile(r"\b(sa|nc|nd|share ?alike|non-?commercial|no ?deriv)", re.I)


def get(url, timeout=60):
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
                return r.read()
        except Exception as e:
            if i == 3: raise
            time.sleep(3 * (i + 1))


def api(**p):
    p.update(format="json", formatversion="2")
    return json.loads(get("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(p)))


def strip(html): return re.sub(r"<[^>]+>", "", html or "").strip()


CATEGORY_WORDS = {
    "wind": ["wind"], "crickets": ["crickets", "orthoptera", "insects"], "birds": ["birdsong", "bird songs", "dawn chorus", "bird"],
    "evening": ["ambience", "soundscape", "field recording"], "forest": ["forest", "woodland", "soundscape"],
    "stream": ["stream", "streams", "brook", "creek", "river"], "waterfall": ["waterfall", "waterfalls"], "lake": ["lake", "pond", "water"],
    "waves": ["sea", "ocean", "waves", "surf"], "rain": ["rain"], "thunder": ["thunder", "thunderstorm"], "fire": ["fire", "campfire", "fireplace"],
    "city": ["traffic", "city", "urban", "street"], "cicadas": ["cicada", "cicadas", "insects"], "frogs": ["frogs", "frog", "anura", "toads"],
    "roof_rain": ["rain"], "train": ["train", "trains", "railway"], "bells": ["bells", "church bells"], "chimes": ["wind chimes", "chimes"],
}
NOT_NATURE = re.compile(r"\b(isrc|inaugural|address|remarks|president|read by|speech|étude|etude|symphony|op\.|hwv|bwv|episode|radio|interview|lecture|podcast|audiobook|librivox|wikipedia|spoken|news)\b", re.I)


def pages(**p):
    d = api(action="query", prop="imageinfo", iiprop="url|size|mime|extmetadata", **p)
    return (d.get("query") or {}).get("pages", [])


def audio_categories(kind):
    cats = set()
    for w in CATEGORY_WORDS[kind]:
        for q in (f"audio files of {w}", f"sounds of {w}", f"{w} sounds", f"{w} recordings"):
            d = api(action="query", list="search", srsearch=q, srnamespace=14, srlimit=20)
            for r in (d.get("query") or {}).get("search", []):
                t = r["title"]
                if re.search(r"audio|sound|recording|soundscape|ambien", t, re.I) and re.search(w, t, re.I): cats.add(t)
            time.sleep(.5)
    return sorted(cats)


def candidates(kind):
    seen, out = set(), []
    groups = [pages(generator="categorymembers", gcmtitle=c, gcmtype="file", gcmlimit=200) for c in audio_categories(kind)]
    groups += [pages(generator="search", gsrsearch=f"{q} filetype:audio", gsrnamespace=6, gsrlimit=40) for q in SEARCH[kind]]
    for grp in groups:
        for pg in grp:
            t = pg["title"]
            if t in seen or not pg.get("imageinfo") or NOT_NATURE.search(t): continue
            if not re.search(r"\.(ogg|oga|opus|flac|wav|mp3|webm)$", t, re.I): continue
            seen.add(t); ii = pg["imageinfo"][0]; m = ii.get("extmetadata", {})
            lic = (m.get("LicenseShortName") or {}).get("value", "")
            if not OK_LICENCE.search(lic) or BAD_LICENCE.search(lic): continue
            if ii.get("size", 0) > 120e6: continue
            skip = "music|song(?!bird)|speech|voice|spoken|talk|pronunciation|siren|traffic|car|train|city"
            for w in (LOOSE.get(kind) or "").split("|"):
                if w: skip = skip.replace("|" + w, "")
            if re.search(rf"\b({skip})\b", t, re.I): continue
            out.append({"title": t, "url": ii["url"], "page": ii.get("descriptionurl"), "licence": lic,
                        "author": strip((m.get("Artist") or {}).get("value", ""))[:120]})
    return out


def length(p):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], capture_output=True, text=True)
    try: return float(r.stdout.strip())
    except ValueError: return 0.0


def main():
    report = {}
    kinds = os.environ.get("KINDS", "").split() or list(SEARCH)
    for kind in kinds:
        got = []
        for c in candidates(kind):
            if len(got) >= PER_KIND: break
            try:
                tmp = Path(tempfile.mkdtemp()) / "src"
                tmp.write_bytes(get(c["url"], 300)); L = length(tmp)
                if L < 40: continue
                start = max(0, L / 2 - 45) if L > 100 else min(5, L * .05)
                name = f"{kind}_{len(got) + 1}"
                dst = OUT / kind / f"{name}.mp3"; dst.parent.mkdir(parents=True, exist_ok=True)
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{start:.1f}", "-t", "90", "-i", str(tmp), "-ac", "1", "-ar", "44100", "-b:a", "96k", str(dst)], check=True)
                c.update(name=name, seconds=round(L, 1)); got.append(c); print(kind, name, round(L), c["licence"], c["title"])
            except Exception as e:
                print("skip", c["title"], e)
        report[kind] = got
    (OUT / "candidates.json").write_text(json.dumps(report, indent=1, ensure_ascii=False))


if __name__ == "__main__":
    main()
