import Link from "next/link";
import { q } from "@/lib/db";

export const dynamic = "force-dynamic";
type Row = { id: string; title: string; style: string; status: string; progress: { note?: string }; duration_sec: number | null; created_at: string };
const LABEL: Record<string, string> = { planning: "Planning", queued: "Waiting to be made", rendering: "Being made", done: "Ready", failed: "Needs attention" };

export default async function Home() {
  let rows: Row[] = []; let dbError = "";
  try { rows = await q<Row>("select id, title, style, status, progress, duration_sec, created_at from stories order by created_at desc limit 100"); }
  catch (e) { dbError = (e as Error).message; }
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1>My stories</h1>
        <Link className="btn" href="/new">New story</Link>
      </div>
      {!process.env.APP_PASSWORD && <p className="warn">No password is set, so anyone with this link can use your studio. Add APP_PASSWORD in Vercel settings.</p>}
      {!process.env.ANTHROPIC_API_KEY && <p className="warn">Claude isn&apos;t connected yet. Add ANTHROPIC_API_KEY in Vercel settings so the studio can plan your stories.</p>}
      {dbError && <p className="warn">The database isn&apos;t reachable: {dbError}</p>}
      {!dbError && rows.length === 0 && (
        <div className="panel" style={{ textAlign: "center", padding: 48 }}>
          <h2>Your first cartoon starts with a story</h2>
          <p className="muted">Paste any story, from a few lines to about 10,000 words. Claude plans the scenes, then the studio draws, voices and scores it.</p>
          <Link className="btn" href="/new">Paste a story</Link>
        </div>
      )}
      <div className="list">
        {rows.map((r) => (
          <Link key={r.id} href={`/stories/${r.id}`} className="story">
            <div className="thumb" aria-hidden><b /></div>
            <div>
              <h3>{r.title}</h3>
              <div className="muted small row" style={{ gap: 14 }}><span>{r.style}</span><span>{new Date(r.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}</span>{r.duration_sec ? <span>{Math.round(r.duration_sec / 60)} min</span> : null}{r.progress?.note && r.status !== "done" ? <span>{r.progress.note}</span> : null}</div>
            </div>
            <span className={`pill ${r.status}`}>{LABEL[r.status] || r.status}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
