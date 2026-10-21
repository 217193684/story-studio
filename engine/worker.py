"""Story Studio video maker (runs in GitHub Actions every 5 minutes).

1. Keeps story planning moving on the website (so you can close the browser).
2. Takes the next planned story, makes the voices, music and frames, and renders the MP4.
3. Uploads the MP4 to this repository's Releases (free hosting) and tells the website where it is.
Every call to the website carries this run's GitHub-signed token, so no passwords are stored anywhere.
"""
import json, os, re, subprocess, sys, time, traceback, urllib.error, urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
API = os.environ.get("API_URL", "https://story-studio-kappa-one.vercel.app").rstrip("/")
REPO = os.environ.get("GITHUB_REPOSITORY", "217193684/story-studio")
DEADLINE = time.time() + float(os.environ.get("MAX_MINUTES", "300")) * 60


def token():
    u, t = os.environ.get("ACTIONS_ID_TOKEN_REQUEST_URL"), os.environ.get("ACTIONS_ID_TOKEN_REQUEST_TOKEN")
    if not u: return ""
    req = urllib.request.Request(u + "&audience=story-studio", headers={"authorization": f"Bearer {t}"})
    return json.loads(urllib.request.urlopen(req, timeout=30).read())["value"]


def call(path, body=None, method=None, timeout=330):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(API + path, data=data, method=method or ("POST" if data is not None else "GET"),
                                 headers={"content-type": "application/json", "authorization": f"Bearer {token()}", "user-agent": "story-studio-worker"})
    try:
        return json.loads(urllib.request.urlopen(req, timeout=timeout).read() or b"{}")
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"{path}: {e.code} {e.read()[:300]!r}")


def log(*a): print(*a, flush=True)


def advance_planning():
    for _ in range(40):
        if time.time() > DEADLINE: return
        try: r = call("/api/jobs/advance", {})
        except Exception as e: log("planning step failed:", e); return
        if r.get("idle"): return
        log("planning:", r.get("id"), (r.get("progress") or {}).get("note"))


class Progress:
    """Sends the website an overall percentage for the loading bar: voices 30-60%, drawing 60-95%, upload 96%."""
    def __init__(self, sid): self.sid, self.last, self.stage_t0 = sid, 0.0, time.time()

    def send(self, pct, note, force=False):
        if not force and time.time() - self.last < 6: return  # don't flood the website
        self.last = time.time()
        try: call(f"/api/jobs/{self.sid}/progress", {"note": note, "pct": round(pct, 1)}, timeout=30)
        except Exception as e: log("progress update failed:", e)

    def stage(self, lo, hi, label):
        self.stage_t0 = time.time()
        def cb(f):
            el = time.time() - self.stage_t0
            left = f" — about {max(1, round(el * (1 - f) / f / 60))} min left" if f > .05 and el > 20 else ""
            self.send(lo + (hi - lo) * f, f"{label} ({int(f * 100)}%){left}")
        return cb


def make(job):
    from compile import compile_plan
    from render import render
    sid, plan = job["id"], job["plan"]
    work = Path(f"/tmp/story-{sid}"); work.mkdir(parents=True, exist_ok=True)
    log(f"== {job.get('title')} ({sid})")
    pr = Progress(sid)
    pr.send(30, "Recording the voices", force=True)
    D = compile_plan(plan, work, log=log, progress=pr.stage(30, 60, "Recording the voices"))
    mins = f"{int(D['total'] // 60)}:{int(D['total'] % 60):02d}"
    pr.send(60, f"Drawing {mins} of video", force=True)
    slug = re.sub(r"[^a-z0-9]+", "-", (job.get("title") or "story").lower()).strip("-")[:50] or "story"
    out = work / f"{slug}.mp4"
    render(work, out, log=log, progress=pr.stage(60, 95, f"Drawing {mins} of video"))
    pr.send(96, "Uploading the finished video", force=True)
    tag = f"story-{sid[:8]}-{os.environ.get('GITHUB_RUN_ID', int(time.time()))}"
    subprocess.run(["gh", "release", "create", tag, str(out), "--repo", REPO, "--title", job.get("title") or "Story", "--notes", f"Story Studio video for story {sid}"], check=True)
    url = f"https://github.com/{REPO}/releases/download/{tag}/{out.name}"
    call(f"/api/jobs/{sid}/done", {"video_url": url, "duration": round(D["total"], 1), "report": D.get("report", [])})
    log("done:", url)


def make_calm(job):
    """A calm loop video: draw one loop of the scene, repeat it to the length asked for, upload it."""
    from cozy_render import make_video
    cid = job["id"]; mins = int(job["minutes"])
    def report(pct, note):
        try: call(f"/api/jobs/calm/{cid}", {"action": "progress", "note": note, "pct": round(pct, 1)}, timeout=30)
        except Exception as e: log("progress update failed:", e)
    last = [0.0]
    def drawing(f):
        if time.time() - last[0] < 6: return
        last[0] = time.time(); report(10 + 70 * f, f"Drawing the scene ({int(f * 100)}%)")
    log(f"== calm video: {job['scene']} / {job['weather']} / {mins} min ({cid})")
    work = Path(f"/tmp/calm-{cid}"); work.mkdir(parents=True, exist_ok=True)
    if job["scene"] == "nature":   # a real nature clip, looped, with nature sounds and music
        from nature import make_nature
        o = job.get("options") or {}
        out = work / f"nature-{job['weather']}-{o.get('sound', 'sound')}-{mins}min.mp4"
        make_nature(o, out, mins, progress=report, log=log)
    else:
        report(10, "Drawing the scene")
        out = work / f"{job['scene'].replace('_', '-')}-{job['weather']}-{mins}min.mp4"
        make_video(job["scene"], out, mins, job["weather"], progress=drawing, log=log, stamp=(job.get("options") or {}).get("stamp", True))
    report(85, f"Uploading the {mins}-minute video ({out.stat().st_size // 1_000_000} MB)")
    tag = f"calm-{cid[:8]}-{os.environ.get('GITHUB_RUN_ID', int(time.time()))}"
    subprocess.run(["gh", "release", "create", tag, str(out), "--repo", REPO, "--title", f"Calm: {job['scene']} {job['weather']} {mins} min", "--notes", f"Calm video {cid}"], check=True)
    call(f"/api/jobs/calm/{cid}", {"action": "done", "video_url": f"https://github.com/{REPO}/releases/download/{tag}/{out.name}"})
    log("done:", out.name)


def calm_jobs():
    while time.time() < DEADLINE:
        job = call("/api/jobs/calm/claim", {})
        if job.get("idle"): return
        try: make_calm(job)
        except Exception as e:
            traceback.print_exc()
            try: call(f"/api/jobs/calm/{job['id']}", {"action": "fail", "error": f"The video maker hit a problem: {e}"[:900]})
            except Exception as e2: log("couldn't report failure:", e2)


def youtube_upload(job):
    """Puts a finished video on the YouTube channel: fetch it from GitHub, then a resumable upload in 32 MB pieces."""
    vid, meta, tok = job["id"], job.get("yt_meta") or {}, job["access_token"]
    def report(body):
        try: call(f"/api/jobs/youtube/{vid}", body, timeout=30)
        except Exception as e: log("youtube report failed:", e)
    path = Path(f"/tmp/yt-{vid}.mp4")
    log(f"== YouTube upload: {meta.get('title')}")
    with urllib.request.urlopen(job["video_url"], timeout=600) as r, open(path, "wb") as f:
        while True:
            b = r.read(1 << 22)
            if not b: break
            f.write(b)
    size = path.stat().st_size
    info = {"snippet": {"title": meta["title"][:100], "description": meta.get("description", "")[:4900], "tags": meta.get("tags", []), "categoryId": "10"},
            "status": {"privacyStatus": meta.get("privacy", "private"), "selfDeclaredMadeForKids": False, "embeddable": True}}
    req = urllib.request.Request("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", data=json.dumps(info).encode(), method="POST",
                                 headers={"authorization": f"Bearer {tok}", "content-type": "application/json; charset=UTF-8", "x-upload-content-length": str(size), "x-upload-content-type": "video/mp4"})
    session = urllib.request.urlopen(req, timeout=60).headers["Location"]
    chunk, sent, last = 32 << 20, 0, 0.0
    with open(path, "rb") as f:
        while sent < size:
            f.seek(sent); data = f.read(chunk); end = sent + len(data) - 1
            put = urllib.request.Request(session, data=data, method="PUT", headers={"authorization": f"Bearer {tok}", "content-length": str(len(data)), "content-range": f"bytes {sent}-{end}/{size}"})
            for attempt in range(5):
                try:
                    r = urllib.request.urlopen(put, timeout=300); body = json.loads(r.read() or b"{}")
                    path.unlink(missing_ok=True); log("on YouTube:", body["id"])
                    note = youtube_thumbnail(body["id"], job.get("options") or {}, tok)
                    report({"action": "done", "video_id": body["id"], **({"note": note} if note else {})}); return
                except urllib.error.HTTPError as e:
                    if e.code == 308:                                   # piece received, carry on from where YouTube says
                        rng = e.headers.get("Range"); sent = int(rng.split("-")[1]) + 1 if rng else sent; break
                    if e.code in (500, 502, 503, 504) and attempt < 4: time.sleep(2 ** attempt * 3); continue
                    raise RuntimeError(f"YouTube said {e.code}: {e.read()[:300].decode('utf-8', 'replace')}")
                except (TimeoutError, ConnectionError, urllib.error.URLError) as e:
                    if attempt < 4: time.sleep(2 ** attempt * 3); continue
                    raise
            if time.time() - last > 10: last = time.time(); report({"action": "progress", "pct": round(100 * sent / size, 1)})


def youtube_thumbnail(video_id, opts, tok):
    """Sends the thumbnail picked in Story Studio. Never fails the upload: returns a short note for the website instead."""
    spec, clip = opts.get("thumb"), opts.get("clip") or {}
    if not spec or not clip.get("thumb"): return ""
    try:
        from thumbnail import picture_for, render
        jpg = render(spec, picture_for(clip["thumb"]))
        req = urllib.request.Request(f"https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId={video_id}&uploadType=media", data=jpg, method="POST",
                                     headers={"authorization": f"Bearer {tok}", "content-type": "image/jpeg", "content-length": str(len(jpg))})
        urllib.request.urlopen(req, timeout=120).read(); log("thumbnail set"); return "Thumbnail added"
    except urllib.error.HTTPError as e:
        msg = e.read()[:300].decode("utf-8", "replace"); log("thumbnail failed:", e.code, msg)
        if e.code == 403: return "Thumbnail not added: YouTube needs your channel phone-verified for custom thumbnails (youtube.com/verify)"
        return f"Thumbnail not added (YouTube said {e.code})"
    except Exception as e:
        log("thumbnail failed:", e); return "Thumbnail not added (couldn't draw it)"


def youtube_jobs():
    while time.time() < DEADLINE:
        job = call("/api/jobs/youtube/claim", {})
        if job.get("idle"): return
        try:
            if job.get("yt_state") == "thumbing":   # already on YouTube: only put the new thumbnail on it
                note = youtube_thumbnail(job["yt_video_id"], job.get("options") or {}, job["access_token"])
                call(f"/api/jobs/youtube/{job['id']}", {"action": "thumb_done", "note": note or "Thumbnail not added (no design picked)"})
            else: youtube_upload(job)
        except Exception as e:
            traceback.print_exc()
            try: call(f"/api/jobs/youtube/{job['id']}", {"action": "fail", "error": f"YouTube upload failed: {e}"[:900]})
            except Exception as e2: log("couldn't report failure:", e2)


def main():
    pend = json.loads(urllib.request.urlopen(API + "/api/jobs/pending", timeout=60).read())
    log("waiting on the website:", pend)
    if pend.get("calm"): calm_jobs()
    if pend.get("calm") or pend.get("youtube"): youtube_jobs()
    if not pend.get("planning") and not pend.get("queued"): return
    while time.time() < DEADLINE:
        advance_planning()
        job = call("/api/jobs/claim", {})
        if job.get("idle"):
            if json.loads(urllib.request.urlopen(API + "/api/jobs/pending", timeout=60).read()).get("planning"): time.sleep(20); continue
            break
        try: make(job)
        except Exception as e:
            traceback.print_exc()
            try: call(f"/api/jobs/{job['id']}/fail", {"error": f"The video maker hit a problem: {e}"[:900]})
            except Exception as e2: log("couldn't report failure:", e2)


if __name__ == "__main__":
    main()
