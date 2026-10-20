import { cookies } from "next/headers";
import { configured, REDIRECT, SCOPES } from "@/lib/youtube";

export const dynamic = "force-dynamic";
/** Sends you to Google to sign in and allow Story Studio to upload to your channel. */
export async function GET() {
  if (!configured()) return Response.redirect(`${new URL(REDIRECT).origin}/calm?yt=setup`, 302);
  const state = crypto.randomUUID();
  (await cookies()).set("yt_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.search = new URLSearchParams({ client_id: process.env.YOUTUBE_CLIENT_ID!, redirect_uri: REDIRECT, response_type: "code", scope: SCOPES.join(" "), access_type: "offline", prompt: "consent", include_granted_scopes: "true", state }).toString();
  return Response.redirect(u.toString(), 302);
}
