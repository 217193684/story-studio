import { q } from "@/lib/db";
import { json } from "@/lib/http";
import { getStory } from "@/lib/stories";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const s = await getStory((await params).id);
  return s ? json(s) : json({ error: "Not found" }, 404);
}
export async function DELETE(_: Request, { params }: Ctx) {
  await q("delete from stories where id = $1", [(await params).id]);
  return json({ ok: true });
}
