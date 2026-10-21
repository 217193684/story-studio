import { json } from "@/lib/http";
import { notifyReady, whatsapp } from "@/lib/notify";

export const dynamic = "force-dynamic";
/** Is WhatsApp set up? */
export async function GET() { return json({ ready: notifyReady() }); }
/** Send yourself a test WhatsApp message. */
export async function POST() {
  const r = await whatsapp("👋 Story Studio here — WhatsApp alerts are working. You'll get a message when a video is ready and when it's on YouTube.");
  return json(r, r.ok ? 200 : 400);
}
