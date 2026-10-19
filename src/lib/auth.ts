/** One shared password (APP_PASSWORD) protects the site; the cookie is an HMAC of it so it can't be forged. Edge-safe. */
const enc = new TextEncoder();
export const COOKIE = "ss_auth";
export async function token(password: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode("story-studio-session-v1")));
  let s = ""; sig.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export async function isAuthed(cookieValue: string | undefined) {
  const pw = process.env.APP_PASSWORD;
  if (!pw) return true; // no password set yet: open (the home page warns about it)
  return !!cookieValue && cookieValue === (await token(pw));
}
