"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type S = {
  id: string; title: string; story: string; style: string; status: string; progress: { step?: number; total?: number; note?: string; pct?: number };
  outline: { scenes: { place: string; time: string; summary?: string; body?: unknown }[] } | null; plan: unknown; report: string[] | null;
  youtube: { title: string; description: string; tags: string[] } | null; video_url: string | null; duration_sec: number | null; error: string | null;
};
const STATUS: Record<string, string> = { planning: "Claude is planning the scenes", queued: "Planned. Waiting for the video maker", rendering: "The video maker is working on it", done: "Your video is ready", failed: "This video needs attention" };

function Copy({ text, label }: { text: string; label: string }) {
  const [ok, setOk] = useState(false);
  return <button className="btn quiet" style={{ padding: "6px 12px", fontSize: 14 }} onClick={async () => { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); }}>{ok ? "Copied" : label}</button>;
}

export default function StoryView({ id }: { id: string }) {
  const [s, setS] = useState<S | null>(null); const [missing, setMissing] = useState(false);
  const [editing, setEditing] = useState(false); const [ask, setAsk] = useState<"" | "replan" | "delete">(""); const [planText, setPlanText] = useState(""); const [planErr, setPlanErr] = useState("");
  const stepping = useRef(false);
  const load = useCallback(async () => {
    const r = await fetch(`/api/stories/${id}`, { cache: "no-store" });
    if (r.status === 404) { setMissing(true); return null; }
    const b = (await r.json()) as S; setS(b); return b;
  }, [id]);
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      const b = await load(); if (!alive || !b) return;
      if (b.status === "planning" && !stepping.current) {
        stepping.current = true;
        try { await fetch(`/api/stories/${id}/step`, { method: "POST" }); } finally { stepping.current = false; }
        if (alive) setTimeout(tick, 300); return;
      }
      if (b.status !== "done" && b.status !== "failed") setTimeout(tick, b.status === "rendering" ? 8000 : 5000);
    };
    tick(); return () => { alive = false; };
  }, [id, load]);

  if (missing) return <div className="panel"><h2>This story was deleted</h2><p><a href="/">Back to my stories</a></p></div>;
  if (!s) return <p className="muted">Loading…</p>;
  const act = async (path: string, method = "POST") => { await fetch(`/api/stories/${id}${path}`, { method }); await load(); location.reload(); };
  const scenes = s.outline?.scenes || [];
  const nowIdx = s.status === "planning" ? scenes.findIndex((sc) => !sc.body) : -1;
  const pct = s.progress?.total ? Math.round(((s.progress.step || 0) / s.progress.total) * 100) : 0;
  // one bar for the whole journey: planning 0-25%, waiting 25%, voices 30-60%, drawing 60-95%, upload 96%, done 100%
  const overall = s.status === "planning" ? pct * .25 : s.status === "queued" ? 25 : s.status === "rendering" ? (s.progress?.pct ?? 30) : s.status === "done" ? 100 : 0;
  const stages = [["Planning", 0], ["Waiting", 25], ["Voices", 30], ["Drawing", 60], ["Uploading", 95]] as const;
  const stageNow = stages.reduce((cur, st, i) => (overall >= st[1] ? i : cur), 0);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div><a href="/" className="muted small">My stories</a><h1 style={{ marginTop: 6 }}>{s.title}</h1></div>
      <div className="panel" style={{ display: "grid", gap: 14 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2>{STATUS[s.status] || s.status}</h2>
          {s.status !== "failed" && <span className="muted" style={{ fontVariantNumeric: "tabular-nums" }}>{Math.round(overall)}%</span>}
        </div>
        {s.status !== "failed" && (
          <div>
            <div className={`bar ${s.status === "queued" ? "wait" : ""} ${s.status === "done" ? "full" : ""}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(overall)}>
              <i style={{ width: `${Math.max(2, overall)}%` }} />
            </div>
            <div className="stages">
              {stages.map(([label], i) => <span key={label} className={i < stageNow || s.status === "done" ? "past" : i === stageNow ? "cur" : ""}>{label}</span>)}
            </div>
          </div>
        )}
        {s.progress?.note && s.status !== "done" && <p className="muted" style={{ margin: 0 }}>{s.progress.note}</p>}
        {s.status === "failed" && <p style={{ margin: 0, color: "var(--rose)" }}>{s.error}</p>}
        {scenes.length > 0 && (
          <div className="strip" aria-label="Scenes">
            {scenes.map((sc, i) => (
              <div key={i} className={`frame ${sc.body ? "on" : ""} ${i === nowIdx ? "now" : ""}`} title={sc.summary}>
                <span><b>Scene {i + 1}</b><br />{sc.place.replace(/_/g, " ")}, {sc.time}</span>
              </div>
            ))}
          </div>
        )}
        {s.status === "queued" && <p className="muted small" style={{ margin: 0 }}>The video maker usually starts within a few minutes, but GitHub can sometimes take longer to start it. You can close this page; the bar keeps going and the video will be here when it&apos;s ready.</p>}
      </div>

      {s.status === "done" && s.video_url && (
        <div className="grid2">
          <div style={{ display: "grid", gap: 12 }}>
            <video src={s.video_url} controls preload="metadata" />
            <div className="row"><a className="btn" href={s.video_url}>Download video</a>{s.duration_sec ? <span className="muted">{Math.floor(s.duration_sec / 60)}:{String(Math.round(s.duration_sec % 60)).padStart(2, "0")} long</span> : null}</div>
          </div>
          {s.youtube && (
            <div className="panel" style={{ display: "grid", gap: 12, alignContent: "start" }}>
              <h3>For YouTube</h3>
              <div className="row" style={{ justifyContent: "space-between" }}><strong>Title</strong><Copy text={s.youtube.title} label="Copy title" /></div>
              <p style={{ margin: 0 }}>{s.youtube.title}</p>
              <div className="row" style={{ justifyContent: "space-between" }}><strong>Description</strong><Copy text={s.youtube.description + "\n\n" + s.youtube.tags.map((t) => "#" + t.replace(/\s+/g, "")).slice(0, 5).join(" ")} label="Copy description" /></div>
              <p className="small" style={{ margin: 0, whiteSpace: "pre-wrap" }}>{s.youtube.description}</p>
              <div className="row" style={{ justifyContent: "space-between" }}><strong>Tags</strong><Copy text={s.youtube.tags.join(", ")} label="Copy tags" /></div>
              <p className="small muted" style={{ margin: 0 }}>{s.youtube.tags.join(", ")}</p>
            </div>
          )}
        </div>
      )}

      {s.report && s.report.length > 0 && (
        <div className="panel small">
          <h3>Notes from the video maker (voice, sounds, missing library items)</h3>
          <p className="muted">The studio used the closest match for these. Tell Claude in chat if you want them added.</p>
          <ul>{s.report.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </div>
      )}

      <div className="row">
        {(s.status === "done" || s.status === "failed") && s.plan ? <button className="btn quiet" onClick={() => act("/requeue")}>Make the video again</button> : null}
        {s.status !== "planning" && (ask === "replan"
          ? <><span>Plan the whole story again? Claude will redo every scene.</span><button className="btn" onClick={() => act("/replan")}>Yes, plan again</button><button className="btn quiet" onClick={() => setAsk("")}>Keep this plan</button></>
          : <button className="btn quiet" onClick={() => setAsk("replan")}>Plan again from scratch</button>)}
        {s.plan ? <button className="btn quiet" onClick={() => { setPlanText(JSON.stringify(s.plan, null, 1)); setEditing(!editing); }}>{editing ? "Close the plan" : "Edit the plan"}</button> : null}
        {ask === "delete"
          ? <><span>Delete this story and its video link?</span><button className="btn danger" onClick={() => act("", "DELETE")}>Yes, delete it</button><button className="btn quiet" onClick={() => setAsk("")}>Keep it</button></>
          : <button className="btn danger" onClick={() => setAsk("delete")}>Delete</button>}
      </div>
      {editing && (
        <div className="panel" style={{ display: "grid", gap: 10 }}>
          <p className="muted small" style={{ margin: 0 }}>This is the scene plan Claude wrote. Change any line, face or position, then make the video again.</p>
          <textarea value={planText} onChange={(e) => setPlanText(e.target.value)} style={{ minHeight: 420, fontSize: 13 }} spellCheck={false} />
          {planErr && <p style={{ color: "var(--rose)", margin: 0 }}>{planErr}</p>}
          <button className="btn" onClick={async () => {
            try { JSON.parse(planText); } catch { setPlanErr("The plan has a typo (it isn't valid JSON)."); return; }
            const r = await fetch(`/api/stories/${id}/plan`, { method: "PUT", headers: { "content-type": "application/json" }, body: planText });
            if (r.ok) location.reload(); else setPlanErr((await r.json()).error);
          }}>Save and make the video</button>
        </div>
      )}
      <details className="panel"><summary style={{ cursor: "pointer", fontWeight: 700 }}>The story</summary><p style={{ whiteSpace: "pre-wrap" }}>{s.story}</p></details>
    </div>
  );
}
