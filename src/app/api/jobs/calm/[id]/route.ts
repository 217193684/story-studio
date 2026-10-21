import { z } from "zod";
import { q } from "@/lib/db";
import { json } from "@/lib/http";
import { verifyGithubRun } from "@/lib/oidc";
import { SITE, videoName, whatsapp } from "@/lib/notify";

const body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("progress"), note: z.string().max(200), pct: z.number().min(0).max(100) }),
  z.object({ action: z.literal("done"), video_url: z.string().url().startsWith("https://github.com/") }),
  z.object({ action: z.literal("fail"), error: z.string().max(900) }),
]);
type Row = { scene: string; minutes: number; options: { env?: string; sound?: string } | null; yt_state: string | null };
/** Progress, done and failed reports from the video maker for one calm video. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const v = await verifyGithubRun(req); if (!v.ok) return json({ error: v.error }, 401);
  const p = body.safeParse(await req.json().catch(() => null)); if (!p.success) return json({ error: "bad request" }, 400);
  const id = (await params).id, d = p.data;
  if (d.action === "progress") await q(`update calm_videos set progress = jsonb_build_object('note', $2::text, 'pct', $3::real), updated_at = now() where id = $1 and status = 'rendering'`, [id, d.note, d.pct]);
  if (d.action === "done") {
    const [r] = await q<Row>(`update calm_videos set status = 'done', video_url = $2, error = null, progress = '{"note":"Done","pct":100}'::jsonb, updated_at = now() where id = $1 returning scene, minutes, options, yt_state`, [id, d.video_url]);
    if (r) await whatsapp(`✅ Your ${videoName(r)} is ready!${r.yt_state === "queued" ? " Sending it to YouTube now." : ""}\nOpen Story Studio: ${SITE}/calm`);
  }
  if (d.action === "fail") {
    const [r] = await q<Row>(`update calm_videos set status = 'failed', error = $2, updated_at = now() where id = $1 returning scene, minutes, options, yt_state`, [id, d.error]);
    if (r) await whatsapp(`⚠️ Your ${videoName(r)} couldn't be made: ${d.error.slice(0, 200)}\n${SITE}/calm`);
  }
  return json({ ok: true });
}
