import { json } from "@/lib/http";
import { SITE, notifyReady, notify } from "@/lib/notify";

export const dynamic = "force-dynamic";
/** Are phone alerts set up? */
export async function GET() { return json({ ready: notifyReady() }); }
/** Send yourself a test alert. */
export async function POST() {
  const r = await notify("👋 Story Studio", "Phone alerts are working. You'll get one when a video is ready and when it's on YouTube.", `${SITE}/calm`);
  return json(r, r.ok ? 200 : 400);
}
