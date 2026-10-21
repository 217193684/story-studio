/** Phone alerts when a video is ready or is on YouTube. Never blocks or breaks a job.
 *  - ntfy app (free, no account): NTFY_TOPIC in Vercel = the topic you subscribed to in the app
 *  - WhatsApp (free via CallMeBot, when they have space): WHATSAPP_PHONE (e.g. 27641234567) and WHATSAPP_APIKEY */
import { ENVIRONMENTS } from "@/lib/nature";
import { CALM_SCENES } from "@/lib/calm";

export const SITE = "https://story-studio-kappa-one.vercel.app";
const waReady = () => !!(process.env.WHATSAPP_PHONE && process.env.WHATSAPP_APIKEY);
const ntfyTopic = () => (process.env.NTFY_TOPIC || "").trim().replace(/^https?:\/\/ntfy\.sh\//, "");
export const notifyReady = () => waReady() || !!ntfyTopic();

/** Send to every alert that's set up. `link` opens when the notification is tapped. */
export async function notify(title: string, text: string, link?: string) {
  if (!notifyReady()) return { ok: false, error: "Phone alerts aren't set up yet (add NTFY_TOPIC in Vercel)" };
  const results = await Promise.all([ntfyTopic() ? ntfy(title, text, link) : null, waReady() ? whatsapp(`${title}\n${text}${link ? `\n${link}` : ""}`) : null]);
  const sent = results.filter((r) => r?.ok).length, errs = results.filter((r) => r && !r.ok).map((r) => r!.error);
  return sent ? { ok: true } : { ok: false, error: errs.join(" · ") };
}

async function ntfy(title: string, text: string, link?: string) {
  try {
    const r = await fetch("https://ntfy.sh/", { method: "POST", headers: { "content-type": "application/json" }, signal: AbortSignal.timeout(10000), cache: "no-store",
      body: JSON.stringify({ topic: ntfyTopic(), title, message: text, tags: ["film_frames"], ...(link ? { click: link } : {}) }) });
    return r.ok ? { ok: true } : { ok: false, error: `ntfy said ${r.status}` };
  } catch (e) {
    return { ok: false, error: `Couldn't reach ntfy: ${(e as Error).message}` };
  }
}

async function whatsapp(text: string) {
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
