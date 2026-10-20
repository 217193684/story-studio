import { z } from "zod";
import { q } from "@/lib/db";
import { json } from "@/lib/http";
import { channel } from "@/lib/youtube";

const body = z.object({ title: z.string().min(1).max(100), description: z.string().max(4900), tags: z.array(z.string().max(60)).max(30), privacy: z.enum(["private", "unlisted", "public"]) });
/** Ask the video maker to put this finished video on your YouTube channel. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = body.safeParse(await req.json().catch(() => null)); if (!p.success) return json({ error: "Title, description and privacy are needed" }, 400);
  if (!(await channel().catch(() => null))) return json({ error: "Connect your YouTube channel first" }, 400);
  const tags: string[] = []; let n = 0; for (const t of p.data.tags) { if (n + t.length + 1 > 480) break; tags.push(t); n += t.length + 1; }   // YouTube allows ~500 characters of tags
  const r = await q(`update calm_videos set yt_state = 'queued', yt_error = null, yt_meta = $2::jsonb, updated_at = now() where id = $1 and status = 'done' and video_url is not null returning id`, [(await params).id, JSON.stringify({ ...p.data, tags })]);
  return r.length ? json({ ok: true }) : json({ error: "The video isn't finished yet" }, 400);
}
