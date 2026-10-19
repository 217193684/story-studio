import { q } from "@/lib/db";
import { json } from "@/lib/http";
import { verifyGithubRun } from "@/lib/oidc";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const v = await verifyGithubRun(req); if (!v.ok) return json({ error: v.error }, 401);
  const { note } = await req.json().catch(() => ({ note: "" }));
  await q(`update stories set progress = jsonb_build_object('note', $2::text), updated_at = now() where id = $1 and status = 'rendering'`, [(await params).id, String(note).slice(0, 200)]);
  return json({ ok: true });
}
