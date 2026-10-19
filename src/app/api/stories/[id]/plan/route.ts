import { q } from "@/lib/db";
import { json } from "@/lib/http";

/** Advanced: save a hand-edited plan and make the video from it. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id; const plan = await req.json().catch(() => null);
  if (!plan || !Array.isArray(plan.scenes) || !Array.isArray(plan.cast)) return json({ error: "A plan needs 'cast' and 'scenes' lists" }, 400);
  await q(`update stories set plan = $2, status = 'queued', error = null, claimed_at = null, progress = '{"note":"Waiting for the video maker"}'::jsonb, updated_at = now() where id = $1`, [id, JSON.stringify(plan)]);
  return json({ ok: true });
}
