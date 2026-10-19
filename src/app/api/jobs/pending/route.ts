import { q } from "@/lib/db";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";
/** Lets the video maker skip quickly when there is nothing to do (counts only, no story content). */
export async function GET() {
  const rows = await q<{ status: string; n: string }>(`select status, count(*) n from stories where status in ('planning','queued') or (status = 'rendering' and claimed_at < now() - interval '3 hours') group by status`);
  const c = Object.fromEntries(rows.map((r) => [r.status, Number(r.n)]));
  return json({ planning: c.planning || 0, queued: (c.queued || 0) + (c.rendering || 0) });
}
