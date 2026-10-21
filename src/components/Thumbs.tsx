"use client";
import { useEffect, useRef, useState } from "react";

export type ThumbStyle = "big" | "badge" | "promise" | "clean";
export type ThumbSpec = { style: ThumbStyle; title: string; hook: string; badge: string; sub: string };
type Lib = { W: number; H: number; STYLES: Record<ThumbStyle, string>; draw: (g: CanvasRenderingContext2D, img: HTMLImageElement | null, spec: ThumbSpec) => void; loadFonts: (src: (f: string) => string) => Promise<void> };

const STYLE_KEYS: ThumbStyle[] = ["big", "badge", "promise", "clean"];
const STYLE_LABELS: Record<ThumbStyle, string> = { big: "Big title", badge: "Time badge", promise: "Sleep promise", clean: "Clean & soft" };

// the same drawing file the video maker uses, loaded once
let libPromise: Promise<Lib> | null = null;
function lib(): Promise<Lib> {
  if (!libPromise) libPromise = new Promise<Lib>((ok, bad) => {
    const w = window as unknown as { StoryThumb?: Lib };
    const done = () => w.StoryThumb!.loadFonts((f) => `/fonts/${f}`).then(() => ok(w.StoryThumb!));
    if (w.StoryThumb) { done(); return; }
    const s = document.createElement("script"); s.src = "/thumbnail.js"; s.onload = done; s.onerror = () => { libPromise = null; bad(new Error("thumbnail drawing didn't load")); };
    document.head.appendChild(s);
  });
  return libPromise;
}
const pictures = new Map<string, Promise<HTMLImageElement | null>>();
function picture(src: string) {
  if (!pictures.has(src)) pictures.set(src, new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; }));
  return pictures.get(src)!;
}

/** One thumbnail, drawn exactly as YouTube will get it. */
export function ThumbCanvas({ src, spec, style }: { src: string; spec: ThumbSpec; style?: React.CSSProperties }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = JSON.stringify(spec);
  useEffect(() => {
    let live = true;
    Promise.all([lib(), picture(src)]).then(([L, img]) => { if (live && ref.current) L.draw(ref.current.getContext("2d")!, img, spec); }).catch(() => {});
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, key]);
  return <canvas ref={ref} width={1280} height={720} style={{ width: "100%", height: "auto", display: "block", borderRadius: 10, background: "#1b2340", ...style }} />;
}

/** Pick the thumbnail (or none) and change its words. */
export function ThumbPicker({ src, value, words, onPick, onWords }: {
  src: string; value: ThumbStyle | null; words: Omit<ThumbSpec, "style">;
  onPick: (s: ThumbStyle | null) => void; onWords: (w: Partial<Pick<ThumbSpec, "title" | "hook">>) => void;
}) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="thumb-grid">
        {STYLE_KEYS.map((k) => (
          <button key={k} className={`thumb-pick ${value === k ? "on" : ""}`} onClick={() => onPick(k)} aria-pressed={value === k}>
            <ThumbCanvas src={src} spec={{ style: k, ...words }} />
            <span>{value === k ? "✓ " : ""}{STYLE_LABELS[k]}</span>
          </button>
        ))}
      </div>
      <div className="row" style={{ gap: 10, alignItems: "flex-end" }}>
        <label style={{ flex: 1, minWidth: 160, margin: 0 }}><span className="small">Big words</span>
          <input value={words.title} maxLength={40} onChange={(e) => onWords({ title: e.target.value })} /></label>
        <label style={{ flex: 1, minWidth: 160, margin: 0 }}><span className="small">Promise line (for “Sleep promise”)</span>
          <input value={words.hook} maxLength={60} onChange={(e) => onWords({ hook: e.target.value })} /></label>
        <button className={`chip ${value === null ? "on" : ""}`} onClick={() => onPick(null)} aria-pressed={value === null}>No thumbnail</button>
      </div>
    </div>
  );
}
