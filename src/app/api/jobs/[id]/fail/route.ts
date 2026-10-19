import { q } from "@/lib/db";
import { json } from "@/lib/http";
import { verifyGithubRun } from "@/lib/oidc";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const v = await verifyGithubRun(req); if (!v.ok) return json({ error: v.error }, 401);
  const { error } = await req.json().catch(() => ({ error: "unknown error" }));
  await q(`update stories set status = 'failed', error = $2, updated_at = now() where id = $1`, [(await params).id, String(error).slice(0, 1000)]);
  return json({ ok: true });
}
