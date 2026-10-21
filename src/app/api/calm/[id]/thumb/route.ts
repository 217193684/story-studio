import { z } from "zod";
import { q } from "@/lib/db";
import { json } from "@/lib/http";
import { setThumbnail } from "@/lib/youtube";
import { videoName, notify } from "@/lib/notify";

export const maxDuration = 60;
const spec = z.object({ style: z.enum(["big", "badge", "promise", "clean"]), title: z.string().max(40), hook: z.string().max(60), badge: z.string().max(20), sub: z.string().max(40) });

/** Put a (new) thumbnail on a video that is already on YouTube.
 *  With an image (form upload from the page): sent to YouTube straight away. JSON only: the video maker draws and sends it on its next run. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const [row] = await q<{ yt_video_id: string | null; scene: string; minutes: number; options: { env?: string; sound?: string } | null }>(`select yt_video_id, scene, minutes, options from calm_videos where id = $1`, [id]);
  if (!row?.yt_video_id) return json({ error: "This video isn't on YouTube yet" }, 400);
  if ((req.headers.get("content-type") || "").startsWith("multipart/form-data")) {
    const f = await req.formData(); const img = f.get("image"); const s = spec.safeParse(JSON.parse(String(f.get("spec") || "null")));
    if (!(img instanceof Blob) || !s.success) return json({ error: "Pick a thumbnail design" }, 400);
    if (img.size > 2_000_000) return json({ error: "The picture is too big for YouTube (over 2 MB)" }, 400);
    const r = await setThumbnail(row.yt_video_id, await img.arrayBuffer(), img.type || "image/jpeg");
    if (!r.ok) return json({ error: r.error }, 502);
    await q(`update calm_videos set options = coalesce(options, '{}'::jsonb) || jsonb_build_object('thumb', $2::jsonb), yt_meta = yt_meta || '{"note":"Thumbnail added"}'::jsonb, updated_at = now() where id = $1`, [id, JSON.stringify(s.data)]);
    await notify("🖼️ Thumbnail updated", `Your ${videoName(row)}: the new thumbnail is on YouTube.`, `https://studio.youtube.com/video/${row.yt_video_id}/edit`);
    return json({ ok: true });
  }
  const p = spec.safeParse(await req.json().catch(() => null)); if (!p.success) return json({ error: "Pick a thumbnail design" }, 400);
  await q(`update calm_videos set options = coalesce(options, '{}'::jsonb) || jsonb_build_object('thumb', $2::jsonb), yt_state = 'thumb', yt_error = null, updated_at = now() where id = $1`, [id, JSON.stringify(p.data)]);
  return json({ ok: true, queued: true });
}
