import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import type { Request } from "express";
import type { AddressInfo } from "node:net";
import fs from "node:fs";
import { getSessionCookieOptions } from "../server/_core/cookies";
import { createWebOAuthAttempt, decodeRedirectState, getOAuthWebOrigin, OAUTH_STATE_COOKIE, validateNativeOAuthState } from "../server/oauth-policy";
import { OAUTH_APP_SCHEME, PUBLIC_SITE_ORIGIN } from "../shared/auth-config";

vi.mock("../server/_core/env", () => ({ ENV: { appId: "test-project-id" } }));
vi.mock("../server/_core/sdk", () => ({ sdk: {
  exchangeCodeForToken: vi.fn(), getUserInfo: vi.fn(), createSessionToken: vi.fn(), authenticateRequest: vi.fn(),
} }));
vi.mock("../server/db", () => ({ getUserByOpenId: vi.fn(), upsertUser: vi.fn() }));
import { sdk } from "../server/_core/sdk";
import { getUserByOpenId, upsertUser } from "../server/db";
import { registerOAuthRoutes } from "../server/_core/oauth";

const user = { id: 123, openId: "synthetic-open-id", name: "Pessoa de Teste", email: "test@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
function request(host = "sementesapp-8jp8nwu7.manus.space"): Request {
  return { hostname: host, protocol: "https", headers: { host }, query: {}, get: (key: string) => key.toLowerCase() === "host" ? host : undefined } as unknown as Request;
}
async function withServer(work: (base: string) => Promise<void>) {
  const app = express(); app.use(express.json()); registerOAuthRoutes(app);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  try { await work(`http://127.0.0.1:${(server.address() as AddressInfo).port}`); }
  finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
}
const hostHeaders = { Host: "sementesapp-8jp8nwu7.manus.space", "X-Forwarded-Proto": "https" };
function callbackParams(redirect: URL, state: string, code = "synthetic-code") {
  return new URLSearchParams({ code, state });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NODE_ENV", "production");
  vi.mocked(sdk.exchangeCodeForToken).mockResolvedValue({ accessToken: "synthetic-provider-token" } as any);
  vi.mocked(sdk.getUserInfo).mockResolvedValue(user as any);
  vi.mocked(sdk.createSessionToken).mockResolvedValue("synthetic-session-token");
  vi.mocked(sdk.authenticateRequest).mockResolvedValue(user as any);
  vi.mocked(getUserByOpenId).mockResolvedValue(user as any);
  vi.mocked(upsertUser).mockResolvedValue(undefined);
});
afterEach(() => { vi.unstubAllEnvs(); });

describe("PromessaMS OAuth production regressions", () => {
  it("ignores localhost/preview environment redirects for the published host", () => {
    vi.stubEnv("EXPO_WEB_PREVIEW_URL", "http://localhost:8081");
    expect(getOAuthWebOrigin(request())).toBe(PUBLIC_SITE_ORIGIN);
    expect(getOAuthWebOrigin(request("evil.example"))).toBe(PUBLIC_SITE_ORIGIN);
    vi.unstubAllEnvs();
  });
  it("uses a secure host-only production cookie and never a parent manus.space cookie", () => {
    const options = getSessionCookieOptions(request());
    expect(options).toEqual({ httpOnly: true, path: "/", sameSite: "lax", secure: true });
    expect(options).not.toHaveProperty("domain");
  });
  it("requires the exact supported native scheme/path and rejects web or legacy state", () => {
    const state = (uri: string) => Buffer.from(uri).toString("base64");
    expect(validateNativeOAuthState(state(`${OAUTH_APP_SCHEME}:///oauth/callback`))).toBe(true);
    for (const uri of ["promessams:///oauth/callback", `${OAUTH_APP_SCHEME}://oauth/callback`, "https://evil.example/oauth/callback", `${OAUTH_APP_SCHEME}:///admin`]) expect(validateNativeOAuthState(state(uri))).toBe(false);
    expect(() => decodeRedirectState("not base64 !")).toThrow();
  });
  it("starts web OAuth with a unique public callback, expiring state cookie and no tokens in URL", async () => {
    await withServer(async base => {
      const response = await fetch(`${base}/api/oauth/start`, { headers: hostHeaders, redirect: "manual" });
      expect(response.status).toBe(302);
      const portal = new URL(response.headers.get("location")!);
      expect(portal.origin).toBe("https://manus.im");
      expect(portal.searchParams.get("appId")).toBe("test-project-id");
      const redirect = new URL(portal.searchParams.get("redirectUri")!);
      expect(redirect.origin).toBe(PUBLIC_SITE_ORIGIN);
      expect(redirect.pathname).toMatch(/^\/api\/oauth\/callback\/[A-Za-z0-9_-]{43}$/);
      expect(redirect.search).toBe("");
      expect(portal.searchParams.get("responseType")).toBe("code");
      const cookie = response.headers.get("set-cookie")!;
      expect(cookie).toContain(OAUTH_STATE_COOKIE); expect(cookie).toContain("HttpOnly"); expect(cookie).toContain("Secure"); expect(cookie).not.toContain("Domain=");
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(vi.mocked(sdk.exchangeCodeForToken)).not.toHaveBeenCalled();
    });
  });
  it("completes web login with one exchange, a valid session, and a public return instead of localhost", async () => {
    await withServer(async base => {
      const attempt = createWebOAuthAttempt(request());
      const redirect = new URL(attempt.redirectUri);
      const cookie = `${OAUTH_STATE_COOKIE}=${attempt.cookieValue}`;
      const response = await fetch(`${base}${redirect.pathname}?${callbackParams(redirect, attempt.state)}`, { headers: { ...hostHeaders, Cookie: cookie }, redirect: "manual" });
      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toBe(`${PUBLIC_SITE_ORIGIN}/conta?login=success`);
      expect(response.headers.get("location")).not.toContain("localhost");
      expect(response.headers.get("set-cookie")).toContain("app_session_id=synthetic-session-token");
      expect(response.headers.get("set-cookie")).not.toContain("Domain=");
      expect(sdk.exchangeCodeForToken).toHaveBeenCalledTimes(1);
      expect(sdk.exchangeCodeForToken).toHaveBeenCalledWith("synthetic-code", attempt.state);
      const authenticated = await fetch(`${base}/api/auth/me`, { headers: { ...hostHeaders, Cookie: "app_session_id=synthetic-session-token" } });
      expect((await authenticated.json()).user.openId).toBe(user.openId);
    });
  });
  it("recovers omitted state only with matching random path and HttpOnly cookie", async () => {
    await withServer(async base => {
      const attempt = createWebOAuthAttempt(request());
      const redirect = new URL(attempt.redirectUri);
      const good = await fetch(`${base}${redirect.pathname}?code=synthetic-code`, { headers: { ...hostHeaders, Cookie: `${OAUTH_STATE_COOKIE}=${attempt.cookieValue}` }, redirect: "manual" });
      expect(good.status).toBe(302); expect(good.headers.get("location")).toContain("login=success");
      expect(sdk.exchangeCodeForToken).toHaveBeenCalledWith("synthetic-code", attempt.state);
      vi.mocked(sdk.exchangeCodeForToken).mockClear();
      const bad = await fetch(`${base}${redirect.pathname}?code=synthetic-code`, { headers: hostHeaders, redirect: "manual" });
      expect(bad.headers.get("location")).toContain("login=incomplete");
      expect(sdk.exchangeCodeForToken).not.toHaveBeenCalled();
    });
  });
  it("opens only allowlisted hosted pages and never includes bearer tokens in redirects", async () => {
    await withServer(async base => {
      const good = await fetch(`${base}/api/auth/open-page?destination=%2Frelatorios`, { headers: { ...hostHeaders, Authorization: "Bearer synthetic-session-token" }, redirect: "manual" });
      expect(good.headers.get("location")).toBe(`${PUBLIC_SITE_ORIGIN}/relatorios`);
      expect(good.headers.get("set-cookie")).toContain("app_session_id=synthetic-session-token");
      const bad = await fetch(`${base}/api/auth/open-page?destination=https%3A%2F%2Fevil.example`, { headers: hostHeaders, redirect: "manual" });
      expect(bad.status).toBe(400);
    });
  });
  it("rejects missing/tampered state without contacting the provider", async () => {
    await withServer(async base => {
      const attempt = createWebOAuthAttempt(request());
      const redirect = new URL(attempt.redirectUri);
      const params = callbackParams(redirect, attempt.state);
      for (const cookie of ["", `${OAUTH_STATE_COOKIE}=wrong`]) {
        const r = await fetch(`${base}${redirect.pathname}?${params}`, { headers: { ...hostHeaders, Cookie: cookie }, redirect: "manual" });
        expect(r.status).toBe(302);
        expect(r.headers.get("location")).toContain("login=expired");
      }
      expect(sdk.exchangeCodeForToken).not.toHaveBeenCalled();
    });
  });
  it("returns cancelled web logins safely without creating a session", async () => {
    await withServer(async base => {
      const r = await fetch(`${base}/api/oauth/callback?error=access_denied`, { headers: hostHeaders, redirect: "manual" });
      expect(r.headers.get("location")).toBe(`${PUBLIC_SITE_ORIGIN}/conta?login=cancelled`);
      expect(sdk.createSessionToken).not.toHaveBeenCalled();
    });
  });
  it("exchanges native login once and supports accounts without a display name", async () => {
    vi.mocked(sdk.getUserInfo).mockResolvedValue({ ...user, name: null } as any);
    await withServer(async base => {
      const state = Buffer.from(`${OAUTH_APP_SCHEME}:///oauth/callback`).toString("base64");
      const r = await fetch(`${base}/api/oauth/mobile?${new URLSearchParams({ code: "synthetic-native-code", state })}`, { headers: hostHeaders });
      expect(r.status).toBe(200); expect((await r.json()).app_session_id).toBe("synthetic-session-token");
      expect(sdk.createSessionToken).toHaveBeenCalledWith(user.openId, expect.objectContaining({ name: "Participante" }));
      const bad = await fetch(`${base}/api/oauth/mobile?${new URLSearchParams({ code: "other-code", state: Buffer.from("promessams:///oauth/callback").toString("base64") })}`, { headers: hostHeaders });
      expect(bad.status).toBe(400); expect(sdk.exchangeCodeForToken).toHaveBeenCalledTimes(1);
    });
  });
  it("preserves package, API origin, architecture and legacy deep links in build 19", () => {
    const config = fs.readFileSync("app.config.ts", "utf8");
    expect(config).toContain("versionCode: 19"); expect(config).toContain('const rawBundleId = "promessams"');
    expect(config).toContain('const scheme = "promessams"'); expect(config).toContain(`const OAUTH_APP_SCHEME = "${OAUTH_APP_SCHEME}"`);
    expect(config).toContain("scheme: [scheme, OAUTH_APP_SCHEME]"); expect(config).toContain("newArchEnabled: true");
    expect(fs.readFileSync("eas.json", "utf8")).toContain(PUBLIC_SITE_ORIGIN);
    const callback = fs.readFileSync("app/oauth/callback.tsx", "utf8");
    expect(callback).toContain("exchangeOAuthCodeOnce"); expect(callback).not.toContain("console.log");
    expect(callback).toContain('router.replace("/conta")');
  });
});
