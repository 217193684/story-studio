import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, isAuthed } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;
  if (p.startsWith("/login") || p === "/privacy" || p === "/stamp.png" || p.startsWith("/api/login") || p.startsWith("/api/jobs") || p.startsWith("/engine/") || p.startsWith("/_next") || p === "/favicon.ico") return NextResponse.next();
  if (await isAuthed(req.cookies.get(COOKIE)?.value)) return NextResponse.next();
  if (p.startsWith("/api/")) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  const u = req.nextUrl.clone(); u.pathname = "/login"; u.search = ""; return NextResponse.redirect(u);
}
export const config = { matcher: ["/((?!_next/static|_next/image).*)"] };
