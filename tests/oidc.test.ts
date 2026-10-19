import { describe, expect, it } from "vitest";
import { exportJWK, generateKeyPair, SignJWT, createLocalJWKSet } from "jose";
import { verifyGithubRun, GITHUB_ISSUER, AUDIENCE } from "../src/lib/oidc";
import { parseJson } from "../src/lib/director";

describe("GitHub run token", () => {
  it("accepts only this repo's main branch, signed by GitHub, for our audience", async () => {
    const { publicKey, privateKey } = await generateKeyPair("RS256");
    const getKey = createLocalJWKSet({ keys: [{ ...(await exportJWK(publicKey)), kid: "k", alg: "RS256" }] });
    const sign = (c: Record<string, unknown>, aud = AUDIENCE) => new SignJWT(c).setProtectedHeader({ alg: "RS256", kid: "k" }).setIssuer(GITHUB_ISSUER).setAudience(aud).setIssuedAt().setExpirationTime("5m").sign(privateKey);
    const req = (t: string) => new Request("http://x", { headers: { authorization: `Bearer ${t}` } });
    expect(await verifyGithubRun(req(await sign({ repository: "217193684/story-studio", ref: "refs/heads/main", run_id: 7 })), { getKey })).toEqual({ ok: true, run: "7" });
    expect(await verifyGithubRun(req(await sign({ repository: "someone/else", ref: "refs/heads/main" })), { getKey })).toMatchObject({ ok: false });
    expect(await verifyGithubRun(req(await sign({ repository: "217193684/story-studio", ref: "refs/heads/dev" })), { getKey })).toMatchObject({ ok: false });
    expect(await verifyGithubRun(req(await sign({ repository: "217193684/story-studio", ref: "refs/heads/main" }, "pulse-sa")), { getKey })).toMatchObject({ ok: false });
    expect(await verifyGithubRun(new Request("http://x"), { getKey })).toMatchObject({ ok: false, error: "missing token" });
  });
});

describe("director output", () => {
  it("reads JSON even when wrapped in a code block or with extra words", () => {
    expect(parseJson('```json\n{"a": 1}\n```')).toEqual({ a: 1 });
    expect(parseJson('Here is the plan:\n{"scenes": []}\nDone.')).toEqual({ scenes: [] });
  });
});
