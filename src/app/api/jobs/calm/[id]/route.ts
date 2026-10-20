import { z } from "zod";
import { q } from "@/lib/db";
import { json } from "@/lib/http";
import { verifyGithubRun } from "@/lib/oidc";

const body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("progress"), note: z.string().max(200), pct: z.number().min(0).max(100) }),
  z.object({ action: z.literal("done"), video_url: z.string().url().startsWith("https://github.com/") }),
  z.object({ action: z.literal("fail"), error: z.string().max(900) }),
]);
/** Progress, done and failed reports from the video maker for one calm video. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const v = await verifyGithubRun(req); if (!v.ok) return json({ error: v.error }, 401);
  const p = body.safeParse(await req.json().catch(() => null)); if (!p.success) return json({ error: "bad request" }, 400);
  const id = (await params).id, d = p.data;
  if (d.action === "progress") await q(`update calm_videos set progress = jsonb_build_object('note', $2::text, 'pct', $3::real), updated_at = now() where id = $1 and status = 'rendering'`, [id, d.note, d.pct]);
  if (d.action === "done") await q(`update calm_videos set status = 'done', video_url = $2, error = null, progress = '{"note":"Done","pct":100}'::jsonb, updated_at = now() where id = $1`, [id, d.video_url]);
  if (d.action === "fail") await q(`update calm_videos set status = 'failed', error = $2, updated_at = now() where id = $1`, [id, d.error]);
  return json({ ok: true });
}
