import { q } from "@/lib/db";
import { json } from "@/lib/http";
import { verifyGithubRun } from "@/lib/oidc";
import { uploadToken } from "@/lib/youtube";

export const dynamic = "force-dynamic";
/** The video maker takes the next video waiting to go to YouTube, with a 1-hour upload token. */
export async function POST(req: Request) {
  const v = await verifyGithubRun(req); if (!v.ok) return json({ error: v.error }, 401);
  const [s] = await q<{ id: string; video_url: string; yt_meta: unknown }>(`update calm_videos set yt_state = 'uploading', yt_claimed_at = now(), updated_at = now()
     where id = (select id from calm_videos where yt_state = 'queued' or (yt_state = 'uploading' and yt_claimed_at < now() - interval '2 hours') order by updated_at limit 1 for update skip locked)
     returning id, video_url, yt_meta`);
  if (!s) return json({ idle: true });
  try { return json({ ...s, access_token: await uploadToken() }); }
  catch (e) {
    await q(`update calm_videos set yt_state = 'failed', yt_error = $2 where id = $1`, [s.id, e instanceof Error ? e.message : "Couldn't get a YouTube upload token"]);
    return json({ idle: true });
  }
}
