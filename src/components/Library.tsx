"use client";
import { useEffect, useRef, useState } from "react";

/* The drawing library is plain JavaScript (the same files the video maker uses), loaded into the page as scripts. */
declare global { interface Window { setCtx?: (c: CanvasRenderingContext2D) => void; [k: string]: unknown } }
type Drawer = (t: number, w: number, h: number, g: CanvasRenderingContext2D) => void;
const FILES = ["core", "people", "animals", "props", "places", "effects"];

function useEngine() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (window.setCtx) { setReady(true); return; }
    let i = 0;
    const next = () => { if (i >= FILES.length) { setReady(true); return; } const s = document.createElement("script"); s.src = `/engine/${FILES[i++]}.js`; s.onload = next; document.body.appendChild(s); };
    next();
  }, []);
  return ready;
}

function Tile({ draw, label, animate = false, ratio = 1 }: { draw: Drawer; label: string; animate?: boolean; ratio?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!; const dpr = Math.min(2, window.devicePixelRatio || 1); const W = 300, H = Math.round(300 / ratio);
    cv.width = W * dpr; cv.height = H * dpr; const ctx = cv.getContext("2d")!;
    let raf = 0, visible = false, t0 = performance.now(), last = 0;
    const paint = (t: number) => { window.setCtx!(ctx); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); try { draw(t, W, H, ctx); } catch { /* skip a bad frame */ } };
    paint(1.2);
    const loop = (now: number) => { raf = requestAnimationFrame(loop); if (!visible || now - last < 50) return; last = now; paint((now - t0) / 1000 + 1.2); };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    if (animate && !reduce) { io.observe(cv); raf = requestAnimationFrame(loop); }
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, [draw, animate, ratio]);
  return <div><canvas ref={ref} style={{ aspectRatio: String(ratio) }} aria-label={label} /><div className="cap">{label.replace(/_/g, " ")}</div></div>;
}

const W = () => window as unknown as Record<string, (...a: unknown[]) => void> & Record<string, unknown>;
function person(sp: Record<string, unknown>, st: Record<string, unknown>, scale = .62, y = .95): Drawer {
  return (t, w, h, g) => { g.save(); g.translate(w / 2, h * y); g.scale(scale * h / 300, scale * h / 300); W().drawHuman(sp, { t, ...st, walkPhase: t * 6 }); g.restore(); };
}

export default function Library({ catalog }: { catalog: Record<string, unknown[]> }) {
  const ready = useEngine(); const [seed, setSeed] = useState(1);
  if (!ready) return <p className="muted">Loading the library…</p>;
  const str = (k: string) => catalog[k] as string[];
  const rnd = (i: number) => { const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453; return x - Math.floor(x); };
  const pick = <T,>(a: T[], i: number) => a[Math.floor(rnd(i) * a.length)];
  const people = Array.from({ length: 18 }, (_, i) => ({ name: `p${seed}-${i}`, gender: rnd(i * 7) > .5 ? "f" : "m", age: pick(["kid", "teen", "adult", "adult", "adult", "old"], i * 3), build: pick(["slim", "average", "average", "big"], i * 5),
    skin: Math.floor(rnd(i * 11) * 8), hair: pick(str("hairs"), i * 13), hairColor: pick(["black", "black", "darkbrown", "brown", "blonde", "ginger", "auburn", "grey"], i * 17), eyes: pick(str("eyes"), i * 19),
    beard: rnd(i * 23) > .7 ? pick(["beard", "moustache", "goatee", "stubble"], i) : "none", glasses: rnd(i * 29) > .8, outfit: pick(str("outfits"), i * 31) }));
  const sec = (title: string, note: string, kids: React.ReactNode) => <section style={{ display: "grid", gap: 10 }}><div><h2>{title}</h2><p className="muted small" style={{ margin: "4px 0 0" }}>{note}</p></div><div className="gallery">{kids}</div></section>;
  return (
    <div style={{ display: "grid", gap: 34 }}>
      {sec("People", "Every person is put together from parts. These are random mixes; Claude picks parts to match your story's characters.", <>
        {people.map((sp, i) => <Tile key={sp.name} label={`${sp.outfit}`} animate draw={person(sp, { pose: pick(["stand", "talk", "wave", "walk", "dance", "think", "laugh", "cheer"], i * 37), expr: pick(["happy", "neutral", "laugh", "smug", "surprised"], i * 41), facing: "front", talk: 0 }, .7)} ratio={.8} />)}
        <div style={{ display: "grid", placeItems: "center" }}><button className="btn quiet" onClick={() => setSeed(seed + 1)}>Mix new people</button></div>
      </>)}
      {sec("Faces", "How characters feel. Mouths also move by themselves when a character talks.", str("exprs").map((e, i) => <Tile key={e} label={e} animate draw={person({ name: "face" + i, skin: i % 8, hair: str("hairs")[i % 18], outfit: "casual", gender: i % 2 ? "f" : "m" }, { pose: "stand", expr: e, facing: "front" }, 2.1, 2.3)} />))}
      {sec("Poses", "What characters can do.", str("poses").map((p, i) => <Tile key={p} label={p} animate draw={person({ name: "pose" + i, skin: (i * 3) % 8, hair: "short", outfit: "casual", colors: { top: "#0f9d8c" } }, { pose: p, expr: "happy", facing: "right", poseT: 9, seat: 70 }, .6, .92)} ratio={.8} />))}
      {sec("Animals and creatures", "They walk, run, sit, sleep, eat and talk.", str("animals").map((a, i) => <Tile key={a} label={a} animate draw={(t, w, h, g) => { g.save(); g.translate(w / 2, h * .88); const s = ["elephant", "giraffe"].includes(a) ? .38 : ["horse", "cow", "bull", "zebra", "lion", "monster", "robot"].includes(a) ? .55 : .85; g.scale(s * h / 300, s * h / 300); W().drawAnimal({ kind: a, name: a }, { t, pose: i % 3 === 0 ? "walk" : "stand", walkPhase: t * 6, expr: "happy" }); g.restore(); }} />))}
      {sec("Places", "Each one works by day, in the evening and at night.", str("places").map((p, i) => <Tile key={p} label={p} ratio={16 / 9} animate={["club", "beach", "road", "lounge", "stage"].includes(p)} draw={(t, w, h) => { (W().PLACES as unknown as Record<string, { draw: (x: number, y: number, w: number, h: number, t: number, o: unknown) => void }>)[p].draw(0, 0, w, h, t, { tod: ["day", "evening", "night"][i % 3] }); }} />))}
      {sec("Props", "Things Claude can place in a scene.", str("props").map((p) => <Tile key={p} label={p} draw={(t, w, h) => { W().drawProp(p, w / 2, h * .9, h / 600, t, { on: true, text: "SIGN", items: ["food", "bottle"] }); }} />))}
      <section className="panel small"><h3>Sounds and music</h3><p className="muted">{str("sfx").length} sound effects: {str("sfx").join(", ").replace(/_/g, " ")}.</p><p className="muted" style={{ marginBottom: 0 }}>Music for every mood: {str("moods").join(", ")}. All of it is made by the studio, so there are no copyright problems on YouTube.</p></section>
    </div>
  );
}
