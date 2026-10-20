import { q } from "@/lib/db";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";
/** Lets the video maker skip quickly when there is nothing to do (counts only, no story content). */
export async function GET() {
  const rows = await q<{ status: string; n: string }>(`select status, count(*) n from stories where status in ('planning','queued') or (status = 'rendering' and claimed_at < now() - interval '3 hours') group by status`);
  const c = Object.fromEntries(rows.map((r) => [r.status, Number(r.n)]));
  const [calm] = await q<{ n: string }>(`select count(*) n from calm_videos where status = 'queued' or (status = 'rendering' and claimed_at < now() - interval '3 hours')`).catch(() => [{ n: "0" }]);
  return json({ planning: c.planning || 0, queued: (c.queued || 0) + (c.rendering || 0), calm: Number(calm?.n || 0) });
}
