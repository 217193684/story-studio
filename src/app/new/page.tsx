"use client";
import { useState } from "react";

const STYLES = [["horror", "Horror"], ["comedy", "Comedy"], ["western", "Western"], ["drama", "Drama"], ["kids", "Kids"], ["romance", "Romance"], ["action", "Action"]];

export default function NewStory() {
  const [story, setStory] = useState(""); const [title, setTitle] = useState(""); const [style, setStyle] = useState("drama");
  const [captions, setCaptions] = useState(true); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const words = story.trim() ? story.trim().split(/\s+/).length : 0;
  const mins = words / 140;
  async function make() {
    setBusy(true); setErr("");
    const r = await fetch("/api/stories", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ story, title: title || undefined, style, captions }) });
    const b = await r.json();
    if (r.ok) location.href = `/stories/${b.id}`; else { setErr(b.error || "Something went wrong. Try again."); setBusy(false); }
  }
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <h1>New story</h1>
      <div className="grid2">
        <div className="panel" style={{ display: "grid", gap: 16 }}>
          <div>
            <label htmlFor="story">Your story</label>
            <textarea id="story" value={story} onChange={(e) => setStory(e.target.value)} placeholder="Paste your story here. Write the dialogue in quotes and say who speaks, like: “Who is there?” Nomsa whispered." />
            <p className="muted small" style={{ margin: "6px 0 0" }}>{words.toLocaleString()} words{words ? `, about ${mins < 1 ? "under a minute" : `${Math.round(mins)} minute${Math.round(mins) === 1 ? "" : "s"}`} of video` : ""}</p>
          </div>
        </div>
        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <div className="panel" style={{ display: "grid", gap: 16 }}>
            <div><label htmlFor="title">Title (optional)</label><input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Claude can suggest one" /></div>
            <div>
              <label id="style-l">Kind of story</label>
              <div className="choices" role="group" aria-labelledby="style-l">
                {STYLES.map(([v, l]) => <button key={v} type="button" aria-pressed={style === v} onClick={() => setStyle(v)}>{l}</button>)}
              </div>
            </div>
            <label className="row" style={{ fontWeight: 400, cursor: "pointer" }}><input type="checkbox" checked={captions} onChange={(e) => setCaptions(e.target.checked)} style={{ width: "auto" }} /> Show captions on the video</label>
            {err && <p style={{ color: "var(--rose)", margin: 0 }}>{err}</p>}
            <button className="btn" onClick={make} disabled={busy || words < 10}>{busy ? "Sending to the director…" : "Make my video"}</button>
          </div>
          <div className="panel small muted" style={{ display: "grid", gap: 8 }}>
            <p style={{ margin: 0 }}>Claude reads the story and plans each scene: who is in it, where it happens, who says what and what they do. That takes about a minute for a short story.</p>
            <p style={{ margin: 0 }}>The video maker then voices, draws and scores it. A 10-minute story takes about 15 minutes once it starts. It checks for new stories every 5 minutes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
