import { z } from "zod";
import { q } from "@/lib/db";
import { json } from "@/lib/http";
import { verifyGithubRun } from "@/lib/oidc";

const body = z.object({ video_url: z.string().url().startsWith("https://github.com/"), duration: z.number().optional(), report: z.array(z.string()).optional() });
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const v = await verifyGithubRun(req); if (!v.ok) return json({ error: v.error }, 401);
  const p = body.safeParse(await req.json().catch(() => null)); if (!p.success) return json({ error: "bad request" }, 400);
  await q(`update stories set status = 'done', video_url = $2, duration_sec = $3, report = $4, error = null, progress = '{"note":"Done"}'::jsonb, updated_at = now() where id = $1`,
    [(await params).id, p.data.video_url, p.data.duration ?? null, JSON.stringify(p.data.report || [])]);
  return json({ ok: true });
}
