import { z } from "zod";
import { q } from "@/lib/db";
import { json } from "@/lib/http";
import { CALM_SCENES, LENGTHS } from "@/lib/calm";

export const dynamic = "force-dynamic";
export type CalmRow = { id: string; scene: string; weather: string; minutes: number; status: string; progress: { note?: string; pct?: number }; video_url: string | null; error: string | null; created_at: string };

export async function GET() {
  const rows = await q<CalmRow>(`select id, scene, weather, minutes, status, progress, video_url, error, created_at from calm_videos order by created_at desc limit 60`);
  return json(rows);
}

const body = z.object({ scene: z.enum(Object.keys(CALM_SCENES) as [string, ...string[]]), weather: z.string(), minutes: z.number().int() });
export async function POST(req: Request) {
  const p = body.safeParse(await req.json().catch(() => null)); if (!p.success) return json({ error: "Pick a scene, weather and length" }, 400);
  const S = CALM_SCENES[p.data.scene as keyof typeof CALM_SCENES];
  if (!(S.weathers as readonly string[]).includes(p.data.weather)) return json({ error: "That weather isn't available for this scene" }, 400);
  if (!(LENGTHS as readonly number[]).includes(p.data.minutes)) return json({ error: "Pick one of the lengths" }, 400);
  const [r] = await q<{ id: string }>(`insert into calm_videos (scene, weather, minutes, progress) values ($1, $2, $3, '{"note":"Waiting for the video maker","pct":5}'::jsonb) returning id`, [p.data.scene, p.data.weather, p.data.minutes]);
  return json(r);
}
