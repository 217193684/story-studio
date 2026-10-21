/** WhatsApp messages to your own phone (free, via CallMeBot) when a video is ready or is on YouTube.
 *  Needs WHATSAPP_PHONE (e.g. 27641234567) and WHATSAPP_APIKEY (from CallMeBot) in Vercel. Never blocks or breaks a job. */
import { ENVIRONMENTS } from "@/lib/nature";
import { CALM_SCENES } from "@/lib/calm";

export const SITE = "https://story-studio-kappa-one.vercel.app";
export const notifyReady = () => !!(process.env.WHATSAPP_PHONE && process.env.WHATSAPP_APIKEY);

export async function whatsapp(text: string) {
  if (!notifyReady()) return { ok: false, error: "WhatsApp alerts aren't set up (WHATSAPP_PHONE / WHATSAPP_APIKEY missing in Vercel)" };
  const phone = process.env.WHATSAPP_PHONE!.replace(/[^\d]/g, "");
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(process.env.WHATSAPP_APIKEY!)}`;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(10000), cache: "no-store" });
    const body = await r.text();
    if (!r.ok || !/queued|sent/i.test(body)) return { ok: false, error: `CallMeBot said: ${body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160)}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Couldn't reach CallMeBot: ${(e as Error).message}` };
  }
}

type Row = { scene: string; minutes: number; options?: { env?: string; sound?: string } | null };
export function videoName(r: Row) {
  const len = r.minutes >= 60 && r.minutes % 60 === 0 ? `${r.minutes / 60} hour` : `${r.minutes} min`;
  if (r.scene === "nature" && r.options?.env) {
    const E = ENVIRONMENTS[r.options.env]; const S = E?.sounds[r.options.sound || ""];
    return `${len} ${E?.emoji || ""} ${E?.label || "nature"}${S ? ` (${S.label})` : ""} video`.replace(/\s+/g, " ");
  }
  const C = (CALM_SCENES as Record<string, { label?: string }>)[r.scene];
  return `${len} ${C?.label || "story"} video`;
}
