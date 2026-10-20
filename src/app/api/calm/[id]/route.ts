import { q } from "@/lib/db";
import { json } from "@/lib/http";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await q(`delete from calm_videos where id = $1`, [(await params).id]);
  return json({ ok: true });
}
/** Make it again (after a failure). */
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await q(`update calm_videos set status = 'queued', error = null, progress = '{"note":"Waiting for the video maker","pct":5}'::jsonb, updated_at = now() where id = $1`, [(await params).id]);
  return json({ ok: true });
}
