import { cookies } from "next/headers";
import { connect, REDIRECT } from "@/lib/youtube";

export const dynamic = "force-dynamic";
/** Google sends you back here after you allow access. */
export async function GET(req: Request) {
  const u = new URL(req.url), back = (msg: string) => Response.redirect(`${new URL(REDIRECT).origin}/calm?yt=${encodeURIComponent(msg)}`, 302);
  const jar = await cookies(), state = jar.get("yt_state")?.value; jar.delete("yt_state");
  if (u.searchParams.get("error")) return back("You cancelled the Google sign-in");
  if (!state || state !== u.searchParams.get("state")) return back("The sign-in expired — try Connect again");
  try { const title = await connect(u.searchParams.get("code") || ""); return back(`connected:${title}`); }
  catch (e) { return back(e instanceof Error ? e.message : "Google sign-in failed"); }
}
