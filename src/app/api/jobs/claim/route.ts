import { q } from "@/lib/db";
import { json } from "@/lib/http";
import { verifyGithubRun } from "@/lib/oidc";

export const dynamic = "force-dynamic";
/** The video maker takes the oldest story that is ready (or one stuck for 3+ hours). */
export async function POST(req: Request) {
  const v = await verifyGithubRun(req); if (!v.ok) return json({ error: v.error }, 401);
  const [s] = await q<{ id: string; plan: unknown; title: string }>(`update stories set status = 'rendering', claimed_at = now(), run_id = $1, progress = '{"note":"Making voices and music"}'::jsonb, updated_at = now()
     where id = (select id from stories where status = 'queued' or (status = 'rendering' and claimed_at < now() - interval '3 hours') order by created_at limit 1 for update skip locked)
     returning id, plan, title`, [v.run]);
  return s ? json(s) : json({ idle: true });
}
