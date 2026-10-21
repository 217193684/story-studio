/** Your YouTube channel, connected once with Google sign-in. The long-lived Google token is stored encrypted;
 *  the video maker only ever gets a short-lived (1 hour) upload token for each upload. */
import { q } from "@/lib/db";

export const REDIRECT = process.env.YOUTUBE_REDIRECT_URI || "https://story-studio-kappa-one.vercel.app/api/youtube/callback";
export const SCOPES = ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.readonly"];
export const configured = () => !!(process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET);

const enc = new TextEncoder(), dec = new TextDecoder();
const b64 = (u: Uint8Array) => Buffer.from(u).toString("base64");
const unb64 = (s: string) => new Uint8Array(Buffer.from(s, "base64"));
async function key() {
  const raw = await crypto.subtle.digest("SHA-256", enc.encode(`${process.env.YOUTUBE_CLIENT_SECRET}|story-studio-youtube-v1`));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}
async function seal(text: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(), enc.encode(text)));
  return `${b64(iv)}.${b64(ct)}`;
}
async function open(sealed: string) {
  const [iv, ct] = sealed.split(".");
  return dec.decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, await key(), unb64(ct)));
}

export async function ensureTable() {
  await q(`create table if not exists youtube_auth (id integer primary key default 1, token text not null, channel_id text, channel_title text, updated_at timestamptz not null default now())`);
}

async function google(url: string, body: Record<string, string>) {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error_description || d.error || `Google said ${r.status}`);
  return d;
}

/** After Google sign-in: swap the code for tokens, look up the channel, keep the long-lived token encrypted. */
export async function connect(code: string) {
  const t = await google("https://oauth2.googleapis.com/token", { code, client_id: process.env.YOUTUBE_CLIENT_ID!, client_secret: process.env.YOUTUBE_CLIENT_SECRET!, redirect_uri: REDIRECT, grant_type: "authorization_code" });
  if (!t.refresh_token) throw new Error("Google didn't give a lasting sign-in. Remove Story Studio at myaccount.google.com/permissions, then connect again.");
  const ch = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", { headers: { authorization: `Bearer ${t.access_token}` } }).then((r) => r.json());
  const c = ch.items?.[0];
  if (!c) throw new Error("That Google account has no YouTube channel. Sign in with the account that owns your channel.");
  await ensureTable();
  await q(`insert into youtube_auth (id, token, channel_id, channel_title, updated_at) values (1, $1, $2, $3, now())
           on conflict (id) do update set token = excluded.token, channel_id = excluded.channel_id, channel_title = excluded.channel_title, updated_at = now()`, [await seal(t.refresh_token), c.id, c.snippet?.title || "Your channel"]);
  return c.snippet?.title as string;
}

export async function channel() {
  await ensureTable();
  const [r] = await q<{ channel_id: string; channel_title: string }>(`select channel_id, channel_title from youtube_auth where id = 1`);
  return r || null;
}

export async function disconnect() { await ensureTable(); await q(`delete from youtube_auth where id = 1`); }

/** A fresh 1-hour upload token for the video maker. */
export async function uploadToken() {
  await ensureTable();
  const [r] = await q<{ token: string }>(`select token from youtube_auth where id = 1`);
  if (!r) throw new Error("YouTube isn't connected on the Calm videos page");
  const t = await google("https://oauth2.googleapis.com/token", { refresh_token: await open(r.token), client_id: process.env.YOUTUBE_CLIENT_ID!, client_secret: process.env.YOUTUBE_CLIENT_SECRET!, grant_type: "refresh_token" });
  return t.access_token as string;
}

/** Put a thumbnail (JPEG/PNG, under 2 MB) on a video. Returns a short note for the page. */
export async function setThumbnail(videoId: string, image: ArrayBuffer, type: string) {
  const tok = await uploadToken();
  const r = await fetch(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${encodeURIComponent(videoId)}&uploadType=media`, {
    method: "POST", headers: { authorization: `Bearer ${tok}`, "content-type": type }, body: image,
  });
  if (r.ok) return { ok: true as const };
  const d = await r.json().catch(() => ({}));
  const why = d?.error?.message || `YouTube said ${r.status}`;
  if (r.status === 403) return { ok: false as const, error: `YouTube didn't allow it: ${why}. Custom thumbnails need a phone-verified channel (youtube.com/verify).` };
  return { ok: false as const, error: why };
}
