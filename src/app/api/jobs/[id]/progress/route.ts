import { q } from "@/lib/db";
import { json } from "@/lib/http";
import { verifyGithubRun } from "@/lib/oidc";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const v = await verifyGithubRun(req); if (!v.ok) return json({ error: v.error }, 401);
  const { note, pct } = await req.json().catch(() => ({ note: "", pct: null }));
  const p = Number.isFinite(Number(pct)) ? Math.max(0, Math.min(100, Number(pct))) : null;
  await q(`update stories set progress = jsonb_build_object('note', $2::text, 'pct', $3::real), updated_at = now() where id = $1 and status = 'rendering'`,
    [(await params).id, String(note).slice(0, 200), p]);
  return json({ ok: true });
}
