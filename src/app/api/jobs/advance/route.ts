import { json } from "@/lib/http";
import { verifyGithubRun } from "@/lib/oidc";
import { advance, oldestPlanning } from "@/lib/stories";

export const dynamic = "force-dynamic";
export const maxDuration = 300;
/** The video maker keeps planning going even when nobody has the website open. */
export async function POST(req: Request) {
  const v = await verifyGithubRun(req); if (!v.ok) return json({ error: v.error }, 401);
  const id = await oldestPlanning(); if (!id) return json({ idle: true });
  const s = await advance(id);
  return json({ id, status: s?.status, progress: s?.progress });
}
