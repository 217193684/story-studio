import { COOKIE, token } from "@/lib/auth";
import { json } from "@/lib/http";

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  const pw = process.env.APP_PASSWORD;
  if (!pw || password !== pw) { await new Promise((r) => setTimeout(r, 800)); return json({ error: "Wrong password" }, 401); }
  const res = json({ ok: true });
  res.headers.append("set-cookie", `${COOKIE}=${await token(pw)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 90}`);
  return res;
}
