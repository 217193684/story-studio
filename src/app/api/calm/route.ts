import { z } from "zod";
import { q } from "@/lib/db";
import { json } from "@/lib/http";
import { CALM_SCENES, LENGTHS } from "@/lib/calm";
import { ENVIRONMENTS, MUSIC, NATURE_LENGTHS } from "@/lib/nature";

export const dynamic = "force-dynamic";
export type CalmRow = { id: string; scene: string; weather: string; minutes: number; status: string; progress: { note?: string; pct?: number }; video_url: string | null; error: string | null; created_at: string; options: Record<string, unknown> };

export async function GET() {
  const rows = await q<CalmRow>(`select id, scene, weather, minutes, status, progress, video_url, error, created_at, options from calm_videos order by created_at desc limit 60`);
  return json(rows);
}

const body = z.object({ scene: z.enum(Object.keys(CALM_SCENES) as [string, ...string[]]), weather: z.string(), minutes: z.number().int() });
const clip = z.object({ id: z.number(), url: z.string().url().startsWith("https://cdn.pixabay.com/"), page: z.string().url(), user: z.string().max(100), thumb: z.string().max(500), preview: z.string().max(500), duration: z.number(), width: z.number(), tags: z.string().max(300) });
const nature = z.object({ scene: z.literal("nature"), env: z.string(), sound: z.string(), music: z.string(), minutes: z.number().int(), clip });

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  if (raw?.scene === "nature") {   // a real nature clip with nature sounds
    const n = nature.safeParse(raw); if (!n.success) return json({ error: "Pick a nature video, a sound and a length" }, 400);
    const E = ENVIRONMENTS[n.data.env], S = E?.sounds[n.data.sound];
    if (!E || !S) return json({ error: "Pick a place and a sound" }, 400);
    if (!MUSIC[n.data.music]) return json({ error: "Pick the music" }, 400);
    if (!(NATURE_LENGTHS as readonly number[]).includes(n.data.minutes)) return json({ error: "Pick one of the lengths" }, 400);
    const options = { env: n.data.env, sound: n.data.sound, music: n.data.music, clip: n.data.clip, beds: S.beds, thunder: !!S.thunder };
    const [r] = await q<{ id: string }>(`insert into calm_videos (scene, weather, minutes, options, progress) values ('nature', $1, $2, $3::jsonb, '{"note":"Waiting for the video maker","pct":5}'::jsonb) returning id`, [n.data.env, n.data.minutes, JSON.stringify(options)]);
    return json(r);
  }
  const p = body.safeParse(raw); if (!p.success) return json({ error: "Pick a scene, weather and length" }, 400);
  const S = CALM_SCENES[p.data.scene as keyof typeof CALM_SCENES];
  if (!(S.weathers as readonly string[]).includes(p.data.weather)) return json({ error: "That weather isn't available for this scene" }, 400);
  if (!(LENGTHS as readonly number[]).includes(p.data.minutes)) return json({ error: "Pick one of the lengths" }, 400);
  const [r] = await q<{ id: string }>(`insert into calm_videos (scene, weather, minutes, progress) values ($1, $2, $3, '{"note":"Waiting for the video maker","pct":5}'::jsonb) returning id`, [p.data.scene, p.data.weather, p.data.minutes]);
  return json(r);
}
