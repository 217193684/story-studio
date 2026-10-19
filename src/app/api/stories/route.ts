import { z } from "zod";
import { q } from "@/lib/db";
import { json } from "@/lib/http";
import { STYLES } from "@/lib/stories";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await q("select id, title, style, status, progress, video_url, duration_sec, error, created_at, updated_at from stories order by created_at desc limit 100");
  return json({ stories: rows });
}

const body = z.object({ story: z.string().min(40, "The story is too short").max(60000, "The story is too long (max about 10,000 words)"), title: z.string().max(140).optional(),
  style: z.enum(STYLES).optional(), captions: z.boolean().optional(), subtitle: z.string().max(80).optional() });

export async function POST(req: Request) {
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) return json({ error: p.error.issues[0]?.message || "Bad request" }, 400);
  const d = p.data;
  const [row] = await q<{ id: string }>("insert into stories (title, story, style, options, progress) values ($1, $2, $3, $4, $5) returning id",
    [d.title?.trim() || "Untitled story", d.story.trim(), d.style || "drama", JSON.stringify({ captions: d.captions !== false, subtitle: d.subtitle || "" }), JSON.stringify({ step: 0, total: 1, note: "Reading your story" })]);
  return json({ id: row.id }, 201);
}
