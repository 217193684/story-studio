import { z } from "zod";
import { q } from "@/lib/db";
import { json } from "@/lib/http";
import { verifyGithubRun } from "@/lib/oidc";
import { SITE, videoName, whatsapp } from "@/lib/notify";

type Row = { scene: string; minutes: number; options: { env?: string; sound?: string } | null; yt_meta: { privacy?: string } | null };

const body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("progress"), pct: z.number().min(0).max(100) }),
  z.object({ action: z.literal("done"), video_id: z.string().regex(/^[\w-]{6,20}$/) }),
  z.object({ action: z.literal("fail"), error: z.string().max(900) }),
]);
/** Upload progress / result from the video maker. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const v = await verifyGithubRun(req); if (!v.ok) return json({ error: v.error }, 401);
  const p = body.safeParse(await req.json().catch(() => null)); if (!p.success) return json({ error: "bad request" }, 400);
  const id = (await params).id, d = p.data;
  if (d.action === "progress") await q(`update calm_videos set yt_meta = yt_meta || jsonb_build_object('pct', $2::real) where id = $1`, [id, d.pct]);
  if (d.action === "done") {
    const [r] = await q<Row>(`update calm_videos set yt_state = 'done', yt_video_id = $2, yt_error = null, updated_at = now() where id = $1 returning scene, minutes, options, yt_meta`, [id, d.video_id]);
    if (r) await whatsapp(`▶️ Your ${videoName(r)} is on YouTube${r.yt_meta?.privacy ? ` (${r.yt_meta.privacy})` : ""}!\nOpen it in YouTube Studio: https://studio.youtube.com/video/${d.video_id}/edit`);
  }
  if (d.action === "fail") {
    const [r] = await q<Row>(`update calm_videos set yt_state = 'failed', yt_error = $2, updated_at = now() where id = $1 returning scene, minutes, options, yt_meta`, [id, d.error]);
    if (r) await whatsapp(`⚠️ Your ${videoName(r)} couldn't go to YouTube: ${d.error.slice(0, 200)}\nTap "Try YouTube again" on ${SITE}/calm`);
  }
  return json({ ok: true });
}
