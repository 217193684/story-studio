/** Serves a Pixabay clip picture from our own site, so the browser can turn a drawn thumbnail into an image file. */
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const u = new URL(req.url).searchParams.get("u") || "";
  if (!/^https:\/\/cdn\.pixabay\.com\/[\w\-./]+\.(jpg|jpeg|png|webp)$/i.test(u)) return new Response("not allowed", { status: 400 });
  const r = await fetch(u, { next: { revalidate: 86400 } });
  if (!r.ok) return new Response("not found", { status: 404 });
  return new Response(r.body, { headers: { "content-type": r.headers.get("content-type") || "image/jpeg", "cache-control": "private, max-age=86400" } });
}
