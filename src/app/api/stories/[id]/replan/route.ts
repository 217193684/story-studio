import { q } from "@/lib/db";
import { json } from "@/lib/http";

/** Ask the director to plan the whole story again from scratch. */
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  await q(`update stories set status = 'planning', outline = null, plan = null, error = null, video_url = null, claimed_at = null,
     progress = '{"step":0,"total":1,"note":"Reading your story"}'::jsonb, updated_at = now() where id = $1`, [id]);
  return json({ ok: true });
}
