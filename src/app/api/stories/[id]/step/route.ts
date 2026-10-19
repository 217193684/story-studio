import { json } from "@/lib/http";
import { advance } from "@/lib/stories";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** The story page calls this repeatedly while a story is being planned (one outline or scene per call). */
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await advance((await params).id);
  return s ? json({ status: s.status, progress: s.progress, error: s.error }) : json({ error: "Not found" }, 404);
}
