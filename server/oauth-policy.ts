import type { Request } from "express";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { parse } from "cookie";
import { OAUTH_APP_SCHEME, PUBLIC_SITE_ORIGIN } from "../shared/auth-config";

export const OAUTH_STATE_COOKIE = "promessams_oauth_state";
export const OAUTH_STATE_TTL_MS = 30 * 60 * 1000;

export function getOAuthWebOrigin(req: Request): string {
  // Production always stays on the existing published site, never a Metro URL.
  if (process.env.NODE_ENV === "production" || req.hostname.endsWith(".manus.space")) return PUBLIC_SITE_ORIGIN;
  if (req.hostname === "localhost" || req.hostname === "127.0.0.1") return "http://localhost:8081";
  // Only permit the exact sandbox preview counterpart of the backend host.
  if (req.hostname.startsWith("3000-") && req.hostname.endsWith(".manus.computer")) {
    return `https://${req.hostname.replace(/^3000-/, "8081-")}`;
  }
  return PUBLIC_SITE_ORIGIN;
}

export function getOAuthCallbackOrigin(req: Request): string {
  const webOrigin = getOAuthWebOrigin(req);
  if (webOrigin === PUBLIC_SITE_ORIGIN) return PUBLIC_SITE_ORIGIN;
  if (req.hostname === "localhost" || req.hostname === "127.0.0.1") return `http://${req.get("host") || "localhost:3000"}`;
  return `https://${req.hostname}`;
}

export function createWebOAuthAttempt(req: Request) {
  const nonce = randomBytes(32).toString("base64url");
  const uri = new URL(`/api/oauth/callback/${nonce}`, getOAuthCallbackOrigin(req));
  const state = Buffer.from(uri.toString(), "utf8").toString("base64");
  return { redirectUri: uri.toString(), state, cookieValue: createHash("sha256").update(state).digest("hex") };
}

export function decodeRedirectState(state: string): URL {
  if (!state || state.length > 4096 || !/^[A-Za-z0-9+/]+={0,2}$/.test(state)) throw new Error("Invalid OAuth state");
  const uri = new URL(Buffer.from(state, "base64").toString("utf8"));
  if (uri.username || uri.password || uri.hash) throw new Error("Invalid OAuth redirect");
  return uri;
}

export function validateWebOAuthAttempt(req: Request, state: string): boolean {
  try {
    const uri = decodeRedirectState(state);
    if (uri.origin !== getOAuthCallbackOrigin(req)) return false;
    const nonce = req.params.loginNonce;
    if (nonce) {
      if (!/^[A-Za-z0-9_-]{43}$/.test(nonce) || uri.pathname !== `/api/oauth/callback/${nonce}` || uri.search) return false;
    } else {
      // Allow in-progress attempts initiated before this correction was published.
      if (uri.pathname !== "/api/oauth/callback" || !uri.searchParams.get("loginNonce") || uri.searchParams.get("loginNonce") !== req.query.loginNonce) return false;
    }
    const cookies = parse(req.headers.cookie || "");
    const actual = cookies[OAUTH_STATE_COOKIE] || "";
    const expected = createHash("sha256").update(state).digest("hex");
    return actual.length === expected.length && timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
  } catch { return false; }
}

export function recoverWebOAuthState(req: Request): string | undefined {
  // Some provider returns omit state. Recover it only from a random callback
  // path AND the matching HttpOnly cookie, never from an untrusted redirect.
  const nonce = req.params.loginNonce;
  if (!nonce || !/^[A-Za-z0-9_-]{43}$/.test(nonce)) return undefined;
  const uri = new URL(`/api/oauth/callback/${nonce}`, getOAuthCallbackOrigin(req));
  const state = Buffer.from(uri.toString(), "utf8").toString("base64");
  return validateWebOAuthAttempt(req, state) ? state : undefined;
}

export function validateNativeOAuthState(state: string): boolean {
  try {
    const uri = decodeRedirectState(state);
    // Expo's triple-slash format makes oauth/callback a path, not a hostname.
    return uri.protocol === `${OAUTH_APP_SCHEME}:` && uri.hostname === "" && uri.pathname === "/oauth/callback" && uri.search === "";
  } catch { return false; }
}
