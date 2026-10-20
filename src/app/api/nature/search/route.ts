import { json } from "@/lib/http";
import { ENVIRONMENTS, type Clip } from "@/lib/nature";

export const dynamic = "force-dynamic";
// leave out clips whose tags say there are people or animals in them (calm, empty nature only)
// and editing material (rain on a black/green background) that looks empty on its own
const EDITING = /\b(overlay|green ?screen|chroma|black background|alpha|transition|vfx|effect)\b/i;
const LIVING = /\b(people|person|man|woman|girl|boy|child|kid|family|couple|human|hand|tourist|hiker|animal|dog|cat|bird|birds|horse|cow|deer|duck|swan|fish|insect|bee|butterfly)\b/i;

type Hit = { id: number; pageURL: string; tags: string; duration: number; user: string; videos: Record<string, { url: string; width: number; height: number; thumbnail?: string }> };

/** Finds real nature videos on Pixabay (free to use, also commercially) for one environment, or for your own search words. */
export async function GET(req: Request) {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) return json({ error: "The nature video search needs a free Pixabay key. Add it in Vercel (Settings → Environment Variables) as PIXABAY_API_KEY, then redeploy." }, 503);
  const u = new URL(req.url), env = u.searchParams.get("env") || "rain", own = (u.searchParams.get("q") || "").trim().slice(0, 80), page = Math.max(1, Math.min(5, Number(u.searchParams.get("page")) || 1));
  const words = own || ENVIRONMENTS[env]?.search || "nature";
  const api = `https://pixabay.com/api/videos/?key=${encodeURIComponent(key)}&q=${encodeURIComponent(words)}&video_type=film&safesearch=true&order=popular&per_page=40&page=${page}`;
  const r = await fetch(api, { next: { revalidate: 86400 } });   // Pixabay asks for results to be cached for 24 hours
  if (r.status === 429) return json({ error: "Pixabay says too many searches — wait a minute and try again." }, 429);
  if (!r.ok) return json({ error: `Pixabay search failed (${r.status}). Check the PIXABAY_API_KEY in Vercel.` }, 502);
  const d = (await r.json()) as { hits: Hit[] };
  const clips: Clip[] = d.hits
    .filter((h) => h.duration >= 8 && !LIVING.test(h.tags) && !EDITING.test(h.tags) && h.videos?.medium?.url)
    .map((h) => {
      const big = h.videos.large?.url && h.videos.large.width <= 1920 ? h.videos.large : h.videos.medium;
      return { id: h.id, url: big.url, page: h.pageURL, user: h.user, thumb: h.videos.medium.thumbnail || h.videos.tiny?.thumbnail || "", preview: h.videos.tiny?.url || h.videos.small?.url || h.videos.medium.url, duration: h.duration, width: big.width, tags: h.tags };
    })
    .slice(0, 24);
  return json({ clips, words });
}
