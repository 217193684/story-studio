import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

export const GITHUB_ISSUER = "https://token.actions.githubusercontent.com";
export const AUDIENCE = "story-studio";
export const REPO = process.env.GITHUB_REPO || "217193684/story-studio";
let jwks: JWTVerifyGetKey | null = null;

/** Accepts only a GitHub Actions run of this repo's main branch (no passwords needed between GitHub and the site). */
export async function verifyGithubRun(req: Request, opts: { getKey?: JWTVerifyGetKey } = {}) {
  const h = req.headers.get("authorization") || "";
  const tok = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!tok) return { ok: false as const, error: "missing token" };
  try {
    const getKey = opts.getKey || (jwks ||= createRemoteJWKSet(new URL(GITHUB_ISSUER + "/.well-known/jwks")));
    const { payload } = await jwtVerify(tok, getKey, { issuer: GITHUB_ISSUER, audience: AUDIENCE });
    if (payload.repository !== REPO) return { ok: false as const, error: "wrong repository" };
    if (payload.ref !== "refs/heads/main") return { ok: false as const, error: "wrong branch" };
    return { ok: true as const, run: String(payload.run_id || "") };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}
