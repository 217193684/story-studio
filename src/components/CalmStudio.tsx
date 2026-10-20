"use client";
import { useCallback, useEffect, useState } from "react";
import { CALM_SCENES, LENGTHS, weatherLabel, youtubeFor, type CalmScene, type Weather } from "@/lib/calm";

type Row = { id: string; scene: CalmScene; weather: Weather; minutes: number; status: string; progress: { note?: string; pct?: number }; video_url: string | null; error: string | null; created_at: string };
const STATUS: Record<string, string> = { queued: "Waiting for the video maker", rendering: "Being made", done: "Ready", failed: "Needs attention" };
const len = (m: number) => (m >= 60 && m % 60 === 0 ? `${m / 60} hour${m >= 120 ? "s" : ""}` : `${m} min`);

function Copy({ text, label }: { text: string; label: string }) {
  const [ok, setOk] = useState(false);
  return <button className="btn quiet" style={{ padding: "6px 12px", fontSize: 14 }} onClick={async () => { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); }}>{ok ? "Copied" : label}</button>;
}

export default function CalmStudio() {
  const [scene, setScene] = useState<CalmScene>("cat_sleep");
  const [weather, setWeather] = useState<Weather>("rain");
  const [minutes, setMinutes] = useState(90);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [ask, setAsk] = useState("");
  const S = CALM_SCENES[scene];

  const load = useCallback(async () => { const r = await fetch("/api/calm", { cache: "no-store" }); if (r.ok) setRows(await r.json()); }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {   // keep the bars moving while anything is being made
    if (!rows?.some((r) => r.status === "queued" || r.status === "rendering")) return;
    const id = setTimeout(load, 6000); return () => clearTimeout(id);
  }, [rows, load]);
  useEffect(() => { if (!(S.weathers as readonly string[]).includes(weather)) setWeather(S.weathers[0] as Weather); }, [scene, S.weathers, weather]);

  async function make() {
    setBusy(true); setErr("");
    const r = await fetch("/api/calm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ scene, weather, minutes }) });
    setBusy(false); if (!r.ok) { setErr((await r.json()).error || "Something went wrong"); return; }
    load();
  }
  const act = async (id: string, method: string) => { await fetch(`/api/calm/${id}`, { method }); setAsk(""); load(); };

  return (
    <div style={{ display: "grid", gap: 22 }}>
      <div><h1>Calm videos</h1><p className="muted" style={{ marginTop: 6 }}>Cozy animated loops for sleep, study and relaxing. Pick a scene, the weather outside and how long it should be.</p></div>

      <div className="panel" style={{ display: "grid", gap: 18 }}>
        <div>
          <h3 style={{ marginBottom: 10 }}>Scene</h3>
          <div className="calm-scenes">
            {(Object.keys(CALM_SCENES) as CalmScene[]).map((k) => (
              <button key={k} className={`calm-scene ${k === scene ? "on" : ""}`} onClick={() => setScene(k)} aria-pressed={k === scene}>
                <b>{CALM_SCENES[k].label}</b><span className="small muted">{CALM_SCENES[k].about}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="row" style={{ alignItems: "flex-start", gap: 28 }}>
          <div><h3 style={{ marginBottom: 10 }}>Outside</h3><div className="row" style={{ gap: 8 }}>
            {S.weathers.map((w) => <button key={w} className={`chip ${w === weather ? "on" : ""}`} onClick={() => setWeather(w as Weather)} aria-pressed={w === weather}>{weatherLabel(scene, w)}</button>)}
          </div></div>
          <div><h3 style={{ marginBottom: 10 }}>Length</h3><div className="row" style={{ gap: 8 }}>
            {LENGTHS.map((m) => <button key={m} className={`chip ${m === minutes ? "on" : ""}`} onClick={() => setMinutes(m)} aria-pressed={m === minutes}>{len(m)}</button>)}
          </div></div>
        </div>
        <div className="row"><button className="btn" onClick={make} disabled={busy}>{busy ? "Adding…" : `Make a ${len(minutes)} video`}</button>
          <span className="small muted">Usually ready within 5–10 minutes, whatever the length (long videos take a few extra minutes to upload; 90 min ≈ 1.2 GB).</span></div>
        {err && <p style={{ color: "var(--rose)", margin: 0 }}>{err}</p>}
      </div>

      {rows === null ? <p className="muted">Loading…</p> : rows.length === 0 ? <p className="muted">No calm videos yet. Make your first one above.</p> : (
        <div style={{ display: "grid", gap: 14 }}>
          {rows.map((r) => {
            const yt = youtubeFor(r.scene, r.weather, r.minutes), pct = r.status === "done" ? 100 : r.progress?.pct ?? 5;
            return (
              <div key={r.id} className="panel" style={{ display: "grid", gap: 12 }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div><b>{CALM_SCENES[r.scene]?.label || r.scene}</b> <span className="muted">· {weatherLabel(r.scene, r.weather)} · {len(r.minutes)}</span></div>
                  <span className={`pill ${r.status}`}>{STATUS[r.status] || r.status}</span>
                </div>
                {r.status !== "failed" && r.status !== "done" && (
                  <div><div className={`bar ${r.status === "queued" ? "wait" : ""}`} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${Math.max(3, pct)}%` }} /></div>
                    <p className="small muted" style={{ margin: "8px 0 0" }}>{r.progress?.note}</p></div>
                )}
                {r.status === "failed" && <p style={{ color: "var(--rose)", margin: 0 }}>{r.error}</p>}
                {r.status === "done" && r.video_url && (
                  <div className="grid2">
                    <video src={r.video_url} controls preload="none" style={{ width: "100%", borderRadius: 12, background: "#000" }} />
                    <div style={{ display: "grid", gap: 8, alignContent: "start" }}>
                      <a className="btn" href={r.video_url}>Download video</a>
                      <div className="row"><Copy text={yt.title} label="Copy YouTube title" /><Copy text={yt.description} label="Copy description" /><Copy text={yt.tags.join(", ")} label="Copy tags" /></div>
                      <p className="small muted" style={{ margin: 0 }}>{yt.title}</p>
                    </div>
                  </div>
                )}
                <div className="row">
                  {r.status === "failed" && <button className="btn quiet" onClick={() => act(r.id, "POST")}>Try again</button>}
                  {ask === r.id
                    ? <><span className="small">Delete this video from the list?</span><button className="btn danger" onClick={() => act(r.id, "DELETE")}>Yes, delete</button><button className="btn quiet" onClick={() => setAsk("")}>Keep</button></>
                    : <button className="btn danger" style={{ padding: "6px 14px", fontSize: 14 }} onClick={() => setAsk(r.id)}>Delete</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
