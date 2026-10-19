import { q } from "@/lib/db";
import { json } from "@/lib/http";

/** Make the video again from the same plan (e.g. after a failure, or after the library got new parts). */
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const [s] = await q<{ id: string }>(`update stories set status = case when plan is null then 'planning' else 'queued' end, error = null, claimed_at = null,
     progress = jsonb_build_object('note', case when plan is null then 'Reading your story' else 'Waiting for the video maker' end), updated_at = now() where id = $1 returning id`, [id]);
  return s ? json({ ok: true }) : json({ error: "Not found" }, 404);
}
