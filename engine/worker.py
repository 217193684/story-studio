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


def make(job):
    from compile import compile_plan
    from render import render
    sid, plan = job["id"], job["plan"]
    work = Path(f"/tmp/story-{sid}"); work.mkdir(parents=True, exist_ok=True)
    log(f"== {job.get('title')} ({sid})")
    D = compile_plan(plan, work, log=log)
    call(f"/api/jobs/{sid}/progress", {"note": f"Drawing {int(D['total'] // 60)}:{int(D['total'] % 60):02d} of video"})
    slug = re.sub(r"[^a-z0-9]+", "-", (job.get("title") or "story").lower()).strip("-")[:50] or "story"
    out = work / f"{slug}.mp4"
    render(work, out, log=log)
    tag = f"story-{sid[:8]}-{os.environ.get('GITHUB_RUN_ID', int(time.time()))}"
    subprocess.run(["gh", "release", "create", tag, str(out), "--repo", REPO, "--title", job.get("title") or "Story", "--notes", f"Story Studio video for story {sid}"], check=True)
    url = f"https://github.com/{REPO}/releases/download/{tag}/{out.name}"
    call(f"/api/jobs/{sid}/done", {"video_url": url, "duration": round(D["total"], 1), "report": D.get("report", [])})
    log("done:", url)


def main():
    pend = json.loads(urllib.request.urlopen(API + "/api/jobs/pending", timeout=60).read())
    log("waiting on the website:", pend)
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
