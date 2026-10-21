"use client";
import { useEffect, useRef, useState } from "react";
import { ENVIRONMENTS, MUSIC, NATURE_LENGTHS, thumbWords, timeLabels, type Clip } from "@/lib/nature";
import { ThumbPicker, type ThumbStyle } from "./Thumbs";

const len = (m: number) => (m >= 60 && m % 60 === 0 ? `${m / 60} hour${m >= 120 ? "s" : ""}` : `${m} min`);

/** Pick a place, a real nature video, the sounds that go with it, music and length. */
export default function NaturePicker({ onMade }: { onMade: () => void }) {
  const [env, setEnv] = useState("rain");
  const E = ENVIRONMENTS[env];
  const [sound, setSound] = useState(Object.keys(E.sounds)[0]);
  const [music, setMusic] = useState("none");
  const [minutes, setMinutes] = useState(90); const [stamp, setStamp] = useState(true);
  const [thumbStyle, setThumbStyle] = useState<ThumbStyle | null>("big");
  const [own, setOwn] = useState<{ title?: string; hook?: string; badge?: string }>({});
  const [words, setWords] = useState(""); const [page, setPage] = useState(1);
  const [clips, setClips] = useState<Clip[] | null>(null); const [clip, setClip] = useState<Clip | null>(null);
  const [searchErr, setSearchErr] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");

  useEffect(() => { setSound(Object.keys(ENVIRONMENTS[env].sounds)[0]); setWords(""); setPage(1); }, [env]);
  useEffect(() => { setOwn({}); }, [env, sound]);
  useEffect(() => { setOwn((o) => ({ ...o, badge: undefined })); }, [minutes]);     // new place or sound: fresh thumbnail words
  const tw = { ...thumbWords(env, sound, minutes), ...own };
  useEffect(() => {
    let live = true; setClips(null); setSearchErr(""); setClip(null);
    fetch(`/api/nature/search?env=${env}&page=${page}${words ? `&q=${encodeURIComponent(words)}` : ""}`).then(async (r) => {
      const d = await r.json(); if (!live) return;
      if (!r.ok) { setSearchErr(d.error || "Search failed"); setClips([]); return; }
      setClips(d.clips);
    }).catch(() => live && (setSearchErr("Search failed — check your connection"), setClips([])));
    return () => { live = false; };
  }, [env, words, page]);

  async function make() {
    if (!clip) { setErr("Tap a video to choose it first"); return; }
    setBusy(true); setErr("");
    const r = await fetch("/api/calm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ scene: "nature", env, sound, music, minutes, stamp, clip, thumb: thumbStyle ? { style: thumbStyle, ...tw } : null }) });
    setBusy(false); if (!r.ok) { setErr((await r.json()).error || "Something went wrong"); return; }
    setClip(null); onMade();
  }

  return (
    <div className="panel" style={{ display: "grid", gap: 20 }}>
      <div>
        <h3 style={{ marginBottom: 10 }}>1. Place</h3>
        <div className="row" style={{ gap: 8 }}>
          {Object.entries(ENVIRONMENTS).map(([k, v]) => <button key={k} className={`chip ${k === env ? "on" : ""}`} onClick={() => setEnv(k)} aria-pressed={k === env}>{v.emoji} {v.label}</button>)}
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: 6 }}>2. Pick the video</h3>
        <p className="small muted" style={{ margin: "0 0 10px" }}>Real nature videos from Pixabay, free to use on YouTube. Tap one to play it, tap “Use this” to choose it. Videos with people or animals are left out.</p>
        <form className="row" style={{ gap: 8, marginBottom: 12 }} onSubmit={(e) => { e.preventDefault(); const v = (new FormData(e.currentTarget).get("w") as string || "").trim(); setPage(1); setWords(v); }}>
          <input name="w" key={env} defaultValue={words} placeholder={`Search your own words, e.g. “${E.search}”`} style={{ flex: 1, minWidth: 180 }} />
          <button className="btn quiet" type="submit">Search</button>
        </form>
        {searchErr && <p style={{ color: "var(--rose)", margin: "0 0 10px" }}>{searchErr}</p>}
        {clips === null ? <p className="muted">Finding videos…</p> : clips.length === 0 && !searchErr ? <p className="muted">No calm videos found — try other words.</p> : (
          <div className="clip-grid">
            {clips.map((c) => (
              <ClipCard key={c.id} c={c} on={clip?.id === c.id} pick={() => setClip(c)} />
            ))}
          </div>
        )}
        {clips && clips.length > 0 && <div className="row" style={{ marginTop: 10, gap: 8 }}>
          {page > 1 && <button className="btn quiet" onClick={() => setPage(page - 1)}>← Previous</button>}
          <button className="btn quiet" onClick={() => setPage(page + 1)}>More videos →</button>
        </div>}
      </div>

      <div className="row" style={{ alignItems: "flex-start", gap: 28 }}>
        <div><h3 style={{ marginBottom: 10 }}>3. Sound</h3><div className="row" style={{ gap: 8 }}>
          {Object.entries(E.sounds).map(([k, v]) => <button key={k} className={`chip ${k === sound ? "on" : ""}`} onClick={() => setSound(k)} aria-pressed={k === sound}>{v.label}</button>)}
        </div></div>
        <div><h3 style={{ marginBottom: 10 }}>4. Music</h3><div className="row" style={{ gap: 8 }}>
          {Object.entries(MUSIC).map(([k, v]) => <button key={k} title={v.about} className={`chip ${k === music ? "on" : ""}`} onClick={() => setMusic(k)} aria-pressed={k === music}>{v.label}</button>)}
        </div></div>
        <div><h3 style={{ marginBottom: 10 }}>5. Length</h3><div className="row" style={{ gap: 8 }}>
          {NATURE_LENGTHS.map((m) => <button key={m} className={`chip ${m === minutes ? "on" : ""}`} onClick={() => setMinutes(m)} aria-pressed={m === minutes}>{len(m)}</button>)}
        </div></div>
        <div><h3 style={{ marginBottom: 10 }}>6. Stamp</h3><div className="row" style={{ gap: 8 }}>
          {[[true, "Story Studio mark"], [false, "No mark"]].map(([v, l]) => <button key={String(v)} className={`chip ${stamp === v ? "on" : ""}`} onClick={() => setStamp(v as boolean)} aria-pressed={stamp === v}>{l as string}</button>)}
        </div></div>
      </div>

      {clip && <Preview clip={clip} env={env} sound={sound} music={music} stamp={stamp} />}

      {clip && clip.thumb && <div className="panel" style={{ display: "grid", gap: 10, padding: 12 }}>
        <div><b>Pick your thumbnail</b> <span className="small muted">— the picture people tap on YouTube. It goes up with the video.</span></div>
        <ThumbPicker src={clip.thumb} value={thumbStyle} words={tw} times={timeLabels(minutes)} onPick={setThumbStyle} onWords={(w) => setOwn({ ...own, ...w })} />
      </div>}

      <div className="row">
        <button className="btn" onClick={make} disabled={busy || !clip}>{busy ? "Adding…" : clip ? `Make a ${len(minutes)} nature video` : "Choose a video first"}</button>
        <span className="small muted">Usually ready in 5–15 minutes. Up to 90 min is full HD; 2–3 hours is made in 720p so the file stays under 2 GB.</span>
      </div>
      {err && <p style={{ color: "var(--rose)", margin: 0 }}>{err}</p>}
    </div>
  );
}

function ClipCard({ c, on, pick }: { c: Clip; on: boolean; pick: () => void }) {
  const [play, setPlay] = useState(false);
  return (
    <div className={`clip ${on ? "on" : ""}`}>
      <button className="clip-media" onClick={() => setPlay(!play)} aria-label={play ? "Stop preview" : "Play preview"}>
        {play ? <video src={c.preview} autoPlay muted loop playsInline /> : c.thumb ? <img src={c.thumb} alt={c.tags} loading="lazy" /> : <span>▶</span>}
        <i className="clip-len">{c.duration}s</i>
      </button>
      <div className="row" style={{ justifyContent: "space-between", gap: 6, padding: "6px 8px" }}>
        <span className="small muted" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "55%" }}>{c.tags.split(",")[0]}</span>
        <button className={`btn ${on ? "" : "quiet"}`} style={{ padding: "4px 10px", fontSize: 13 }} onClick={pick}>{on ? "Chosen ✓" : "Use this"}</button>
      </div>
    </div>
  );
}

const PREVIEW_SECS = 15;
const MUSIC_GAIN: Record<string, number> = { lofi: .375 };   // same balance as the video maker: music sits softly under nature

/** Hear and see your choice before making a long video: the clip loops with the exact nature mix and music you picked. */
function Preview({ clip, env, sound, music, stamp }: { clip: { preview: string; thumb: string }; env: string; sound: string; music: string; stamp: boolean }) {
  const [on, setOn] = useState(false); const [left, setLeft] = useState(PREVIEW_SECS);
  const nat = useRef<HTMLAudioElement>(null), mus = useRef<HTMLAudioElement>(null), vid = useRef<HTMLVideoElement>(null);
  const audio = useRef<{ ctx: AudioContext; master: GainNode; music: GainNode } | null>(null);

  function setup() {
    if (audio.current) return audio.current;
    const ctx = new AudioContext(), master = ctx.createGain(), mg = ctx.createGain();
    master.connect(ctx.destination); mg.connect(master);
    ctx.createMediaElementSource(nat.current!).connect(master);
    ctx.createMediaElementSource(mus.current!).connect(mg);
    return (audio.current = { ctx, master, music: mg });
  }
  function stop() {
    setOn(false); nat.current?.pause(); mus.current?.pause(); vid.current?.pause();
  }
  async function start() {
    const a = setup(); await a.ctx.resume();
    a.master.gain.cancelScheduledValues(a.ctx.currentTime); a.master.gain.setValueAtTime(1, a.ctx.currentTime);
    a.master.gain.setValueAtTime(1, a.ctx.currentTime + PREVIEW_SECS - 2); a.master.gain.linearRampToValueAtTime(0, a.ctx.currentTime + PREVIEW_SECS);
    for (const el of [nat.current, mus.current, vid.current]) { if (el) { el.currentTime = 0; el.play().catch(() => {}); } }
    if (music === "none") mus.current?.pause();
    setLeft(PREVIEW_SECS); setOn(true);
  }
  useEffect(() => {   // count down, then stop
    if (!on) return;
    if (left <= 0) { stop(); return; }
    const id = setTimeout(() => setLeft(left - 1), 1000); return () => clearTimeout(id);
  }, [on, left]);
  useEffect(() => {   // change sound or music while it plays: switch straight away
    if (audio.current) audio.current.music.gain.value = MUSIC_GAIN[music] ?? .29;
    if (!on) return;
    nat.current?.play().catch(() => {});
    if (music === "none") mus.current?.pause(); else mus.current?.play().catch(() => {});
  }, [env, sound, music, on]);
  useEffect(() => () => { audio.current?.ctx.close(); }, []);
  useEffect(() => { stop(); }, [clip.preview]);

  return (
    <div className="panel" style={{ display: "grid", gap: 10, padding: 12 }}>
      <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
        <b>Preview your video</b>
        <button className="btn" onClick={on ? stop : start} style={{ padding: "6px 14px" }}>{on ? `■ Stop (${left}s)` : `▶ Play ${PREVIEW_SECS}-second preview`}</button>
      </div>
      <div style={{ position: "relative", width: "100%", maxWidth: 640, aspectRatio: "16 / 9", borderRadius: 10, overflow: "hidden", background: "#000" }}>
        <video ref={vid} src={clip.preview} poster={clip.thumb || undefined} muted loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        {/* the same corner stamp the finished video gets (same picture, same size and place) */}
        {stamp && <img src="/stamp.png" alt="" style={{ position: "absolute", left: "1.69%", bottom: "3%", height: "4.4%", opacity: .85, pointerEvents: "none" }} />}
      </div>
      <audio ref={nat} src={`/preview/nature/${env}-${sound}.mp3`} loop preload="auto" />
      <audio ref={mus} src={music === "none" ? undefined : `/preview/music/${music}.mp3`} loop preload="auto" />
      <p className="small muted" style={{ margin: 0 }}>Uses a small version of the video so it loads fast on your phone — the real video is full HD and loops smoothly. The stamp is shown exactly where it will be. Change the sound or music while it plays to compare.</p>
    </div>
  );
}
