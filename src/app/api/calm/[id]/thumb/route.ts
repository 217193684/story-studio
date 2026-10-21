import { z } from "zod";
import { q } from "@/lib/db";
import { json } from "@/lib/http";

const body = z.object({ style: z.enum(["big", "badge", "promise", "clean"]), title: z.string().max(40), hook: z.string().max(60), badge: z.string().max(20), sub: z.string().max(40) });
/** Put a (new) thumbnail on a video that is already on YouTube. The video maker does it on its next run. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = body.safeParse(await req.json().catch(() => null)); if (!p.success) return json({ error: "Pick a thumbnail design" }, 400);
  const r = await q(`update calm_videos set options = coalesce(options, '{}'::jsonb) || jsonb_build_object('thumb', $2::jsonb), yt_state = 'thumb', yt_error = null, updated_at = now()
                     where id = $1 and yt_video_id is not null and options ? 'clip' returning id`, [(await params).id, JSON.stringify(p.data)]);
  return r.length ? json({ ok: true }) : json({ error: "This video isn't on YouTube yet" }, 400);
}
