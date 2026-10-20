import { json } from "@/lib/http";
import { channel, configured, disconnect } from "@/lib/youtube";

export const dynamic = "force-dynamic";
export async function GET() {
  if (!configured()) return json({ setup: false });
  const c = await channel().catch(() => null);
  return json({ setup: true, connected: !!c, channel: c?.channel_title || null, channelId: c?.channel_id || null });
}
/** Disconnect the channel (Story Studio forgets its Google sign-in). */
export async function DELETE() { await disconnect(); return json({ ok: true }); }
