"use client";
import { useCallback, useEffect, useState } from "react";
import { CALM_SCENES, LENGTHS, weatherLabel, youtubeFor, type CalmScene, type Weather } from "@/lib/calm";
import { ENVIRONMENTS, MUSIC, natureYoutube, type NatureOptions } from "@/lib/nature";
import NaturePicker from "./NaturePicker";

type Row = { id: string; scene: CalmScene | "nature"; weather: Weather; options?: NatureOptions; yt_state: string | null; yt_video_id: string | null; yt_error: string | null; yt_meta: { pct?: number; privacy?: string }; minutes: number; status: string; progress: { note?: string; pct?: number }; video_url: string | null; error: string | null; created_at: string };
const STATUS: Record<string, string> = { queued: "Waiting for the video maker", rendering: "Being made", done: "Ready", failed: "Needs attention" };
const len = (m: number) => (m >= 60 && m % 60 === 0 ? `${m / 60} hour${m >= 120 ? "s" : ""}` : `${m} min`);

function Copy({ text, label }: { text: string; label: string }) {
  const [ok, setOk] = useState(false);
  return <button className="btn quiet" style={{ padding: "6px 12px", fontSize: 14 }} onClick={async () => { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); }}>{ok ? "Copied" : label}</button>;
}

type YT = { setup: boolean; connected?: boolean; channel?: string | null };

function YouTubeBar({ yt, reload }: { yt: YT | null; reload: () => void }) {
  const [msg, setMsg] = useState("");
  useEffect(() => {
    const m = new URLSearchParams(location.search).get("yt"); if (!m) return;
    setMsg(m.startsWith("connected:") ? `Connected to ${m.slice(10)} ✓` : m === "setup" ? "YouTube isn't set up on the website yet (Google keys missing in Vercel)." : m);
    history.replaceState(null, "", "/calm");
  }, []);
  if (!yt) return null;
  return (
    <div className="panel row" style={{ justifyContent: "space-between", gap: 10, padding: "12px 16px" }}>
      <span>{!yt.setup ? <>▶️ <b>YouTube</b> <span className="muted small">— add the Google keys in Vercel to send videos straight to your channel</span></>
        : yt.connected ? <>▶️ Sending to <b>{yt.channel}</b></> : <>▶️ <b>YouTube</b> <span className="muted small">— connect once, then send finished videos straight to your channel</span></>}</span>
      {yt.setup && (yt.connected
        ? <button className="btn quiet" style={{ padding: "6px 12px", fontSize: 14 }} onClick={async () => { await fetch("/api/youtube/status", { method: "DELETE" }); reload(); }}>Disconnect</button>
        : <a className="btn" href="/api/youtube/connect">Connect YouTube</a>)}
      {msg && <p className="small" style={{ margin: 0, width: "100%" }}>{msg}</p>}
    </div>
  );
}

function WhatsAppBar() {
  const [ready, setReady] = useState<boolean | null>(null); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { fetch("/api/notify/test", { cache: "no-store" }).then((r) => r.json()).then((d) => setReady(!!d.ready)).catch(() => setReady(false)); }, []);
  if (ready === null) return null;
  async function test() {
    setBusy(true); setMsg("");
    const r = await fetch("/api/notify/test", { method: "POST" }); const d = await r.json().catch(() => ({}));
    setBusy(false); setMsg(r.ok ? "Sent ✓ — check WhatsApp" : d.error || "Couldn't send");
  }
  return (
    <div className="panel row" style={{ justifyContent: "space-between", gap: 10, padding: "12px 16px" }}>
      <span>💬 <b>WhatsApp alerts</b> <span className="muted small">{ready ? "— on: a message when a video is ready and when it's on YouTube" : "— add WHATSAPP_PHONE and WHATSAPP_APIKEY in Vercel to get a message when videos are ready"}</span></span>
      {ready && <button className="btn quiet" style={{ padding: "6px 12px", fontSize: 14 }} onClick={test} disabled={busy}>{busy ? "Sending…" : "Send test"}</button>}
      {msg && <p className="small" style={{ margin: 0, width: "100%" }}>{msg}</p>}
    </div>
  );
}

function SendToYouTube({ r, yt, meta, reload }: { r: Row; yt: YT | null; meta: { title: string; description: string; tags: string[] }; reload: () => void }) {
  const [privacy, setPrivacy] = useState("private"); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  if (r.yt_state === "done" && r.yt_video_id) return <a className="btn" href={`https://studio.youtube.com/video/${r.yt_video_id}/edit`} target="_blank" rel="noreferrer">✓ On YouTube — open in Studio</a>;
  if (r.yt_state === "queued") return <p className="small muted" style={{ margin: 0 }}>▶️ Waiting to upload to YouTube…</p>;
  if (r.yt_state === "uploading") return <div><div className="bar" role="progressbar" aria-valuenow={Math.round(r.yt_meta?.pct || 0)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${Math.max(3, r.yt_meta?.pct || 0)}%` }} /></div><p className="small muted" style={{ margin: "6px 0 0" }}>Uploading to YouTube ({Math.round(r.yt_meta?.pct || 0)}%)</p></div>;
  if (!yt?.connected) return null;
  async function send() {
    setBusy(true); setErr("");
    const res = await fetch(`/api/calm/${r.id}/youtube`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...meta, privacy }) });
    setBusy(false); if (!res.ok) { setErr((await res.json()).error || "Couldn't send"); return; } reload();
  }
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {r.yt_state === "failed" && <p className="small" style={{ color: "var(--rose)", margin: 0 }}>{r.yt_error}</p>}
      <div className="row" style={{ gap: 6 }}>
        {[["private", "Private"], ["unlisted", "Unlisted"], ["public", "Public"]].map(([k, l]) => <button key={k} className={`chip ${privacy === k ? "on" : ""}`} onClick={() => setPrivacy(k)} aria-pressed={privacy === k}>{l}</button>)}
      </div>
      <button className="btn" onClick={send} disabled={busy}>{busy ? "Sending…" : r.yt_state === "failed" ? "Try YouTube again" : "Send to YouTube"}</button>
      {err && <p className="small" style={{ color: "var(--rose)", margin: 0 }}>{err}</p>}
    </div>
  );
}

export default function CalmStudio() {
  const [tab, setTab] = useState<"nature" | "cartoon">("nature");
  const [scene, setScene] = useState<CalmScene>("cat_sleep");
  const [weather, setWeather] = useState<Weather>("rain");
  const [minutes, setMinutes] = useState(90);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [ask, setAsk] = useState("");
  const S = CALM_SCENES[scene];

  const [yt, setYt] = useState<YT | null>(null);
  const load = useCallback(async () => { const r = await fetch("/api/calm", { cache: "no-store" }); if (r.ok) setRows(await r.json()); }, []);
  const loadYt = useCallback(async () => { const r = await fetch("/api/youtube/status", { cache: "no-store" }); if (r.ok) setYt(await r.json()); }, []);
  useEffect(() => { load(); loadYt(); }, [load, loadYt]);
  useEffect(() => {   // keep the bars moving while anything is being made
    if (!rows?.some((r) => r.status === "queued" || r.status === "rendering" || r.yt_state === "queued" || r.yt_state === "uploading")) return;
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
      <div>
        <h1>{tab === "nature" ? "Calming videos" : "Story videos"}</h1>
        <p className="muted" style={{ marginTop: 6 }}>
          {tab === "nature"
            ? "Long relaxing videos for sleep, study and calm: real nature footage with real nature sounds."
            : "Cozy animated stories with Kitty, looped into long, calming videos."}
        </p>
      </div>
      <YouTubeBar yt={yt} reload={loadYt} />
      <WhatsAppBar />
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === "nature"} className={tab === "nature" ? "on" : ""} onClick={() => setTab("nature")}>🌿 Calming videos</button>
        <button role="tab" aria-selected={tab === "cartoon"} className={tab === "cartoon" ? "on" : ""} onClick={() => setTab("cartoon")}>🐱 Story videos</button>
      </div>

      {tab === "nature" ? <NaturePicker onMade={load} /> : <div className="panel" style={{ display: "grid", gap: 18 }}>
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
      </div>}

      {rows === null ? <p className="muted">Loading…</p> : rows.length === 0 ? <p className="muted">No calm videos yet. Make your first one above.</p> : (
        <div style={{ display: "grid", gap: 14 }}>
          {rows.map((r) => {
            const nat = r.scene === "nature" && r.options?.clip ? r.options : null;
            const ytText = nat ? natureYoutube(nat, r.minutes) : youtubeFor(r.scene as CalmScene, r.weather, r.minutes), pct = r.status === "done" ? 100 : r.progress?.pct ?? 5;
            return (
              <div key={r.id} className="panel" style={{ display: "grid", gap: 12 }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  {nat ? <div><b>{ENVIRONMENTS[nat.env]?.emoji} {ENVIRONMENTS[nat.env]?.label}</b> <span className="muted">· {ENVIRONMENTS[nat.env]?.sounds[nat.sound]?.label}{nat.music !== "none" ? ` + ${MUSIC[nat.music]?.label.toLowerCase()}` : ""} · {len(r.minutes)}</span></div>
                    : <div><b>{CALM_SCENES[r.scene as CalmScene]?.label || r.scene}</b> <span className="muted">· {weatherLabel(r.scene, r.weather)} · {len(r.minutes)}</span></div>}
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
                      <SendToYouTube r={r} yt={yt} meta={ytText} reload={load} />
                      <a className="btn quiet" href={r.video_url}>Download video</a>
                      <div className="row"><Copy text={ytText.title} label="Copy YouTube title" /><Copy text={ytText.description} label="Copy description" /><Copy text={ytText.tags.join(", ")} label="Copy tags" /></div>
                      <p className="small muted" style={{ margin: 0 }}>{ytText.title}</p>
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
