import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";
import type { Express, Request, Response } from "express";
import { getUserByOpenId, upsertUser } from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";
import { createWebOAuthAttempt, getOAuthWebOrigin, OAUTH_STATE_COOKIE, OAUTH_STATE_TTL_MS, recoverWebOAuthState, validateWebOAuthAttempt, validateNativeOAuthState } from "../oauth-policy";
import { resolveHostedDestination } from "../../shared/hosted-pages";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

async function syncUser(userInfo: {
  openId?: string | null;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  platform?: string | null;
}) {
  if (!userInfo.openId) {
    throw new Error("openId missing from user info");
  }

  const lastSignedIn = new Date();
  await upsertUser({
    openId: userInfo.openId,
    name: userInfo.name || null,
    email: userInfo.email ?? null,
    loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
    lastSignedIn,
  });
  const saved = await getUserByOpenId(userInfo.openId);
  return (
    saved ?? {
      openId: userInfo.openId,
      name: userInfo.name,
      email: userInfo.email,
      loginMethod: userInfo.loginMethod ?? null,
      lastSignedIn,
    }
  );
}

function buildUserResponse(
  user:
    | Awaited<ReturnType<typeof getUserByOpenId>>
    | {
        openId: string;
        name?: string | null;
        email?: string | null;
        loginMethod?: string | null;
        lastSignedIn?: Date | null;
      },
) {
  return {
    id: (user as any)?.id ?? null,
    openId: user?.openId ?? null,
    name: user?.name ?? null,
    email: user?.email ?? null,
    loginMethod: user?.loginMethod ?? null,
    lastSignedIn: (user?.lastSignedIn ?? new Date()).toISOString(),
  };
}

export function registerOAuthRoutes(app: Express) {
  app.use(["/api/oauth", "/api/auth"], (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Referrer-Policy", "no-referrer");
    next();
  });
  app.get("/api/oauth/start", (req: Request, res: Response) => {
    if (!ENV.appId) {
      res.status(503).json({ error: "Login temporariamente indisponível." });
      return;
    }
    const attempt = createWebOAuthAttempt(req);
    res.cookie(OAUTH_STATE_COOKIE, attempt.cookieValue, { ...getSessionCookieOptions(req), sameSite: "lax", maxAge: OAUTH_STATE_TTL_MS });
    const url = new URL("https://manus.im/app-auth");
    url.searchParams.set("appId", ENV.appId);
    url.searchParams.set("redirectUri", attempt.redirectUri);
    url.searchParams.set("state", attempt.state);
    url.searchParams.set("type", "signIn");
    url.searchParams.set("responseType", "code");
    res.redirect(302, url.toString());
  });
  const callback = async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code") || (typeof req.body?.code === "string" ? req.body.code : undefined);
    const providedState = getQueryParam(req, "state") || (typeof req.body?.state === "string" ? req.body.state : undefined);
    const state = providedState || recoverWebOAuthState(req);

    if (getQueryParam(req, "error")) {
      res.clearCookie(OAUTH_STATE_COOKIE, getSessionCookieOptions(req));
      res.redirect(302, `${getOAuthWebOrigin(req)}/conta?login=cancelled`);
      return;
    }
    if (!code || !state) {
      res.redirect(302, `${getOAuthWebOrigin(req)}/conta?login=incomplete`);
      return;
    }
    if (!validateWebOAuthAttempt(req, state)) {
      res.redirect(302, `${getOAuthWebOrigin(req)}/conta?login=expired`);
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, getSessionCookieOptions(req));

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      await syncUser(userInfo);
      const sessionToken = await sdk.createSessionToken(userInfo.openId!, {
        name: userInfo.name || "Participante",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // The deployed frontend shares the callback host, not the Metro server.
      res.redirect(302, `${getOAuthWebOrigin(req)}/conta?login=success`);
    } catch (error) {
      console.error("[OAuth] Callback failed:", error instanceof Error ? error.name : "Unknown error");
      res.redirect(302, `${getOAuthWebOrigin(req)}/conta?login=failed`);
    }
  };
  app.get(["/api/oauth/callback", "/api/oauth/callback/:loginNonce"], callback);
  app.post(["/api/oauth/callback", "/api/oauth/callback/:loginNonce"], callback);

  app.get("/api/oauth/mobile", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    if (!validateNativeOAuthState(state)) {
      res.status(400).json({ error: "Retorno de login inválido. Atualize o PromessaMS para a versão mais recente." });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      const user = await syncUser(userInfo);

      const sessionToken = await sdk.createSessionToken(userInfo.openId!, {
        name: userInfo.name || "Participante",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({
        app_session_id: sessionToken,
        user: buildUserResponse(user),
      });
    } catch (error) {
      console.error("[OAuth] Mobile exchange failed:", error instanceof Error ? error.name : "Unknown error");
      res.status(500).json({ error: "OAuth mobile exchange failed" });
    }
  });

  app.get("/api/auth/open-page", async (req: Request, res: Response) => {
    const destination = resolveHostedDestination(req.query.destination);
    if (!destination) { res.status(400).json({ error: "Página não permitida." }); return; }
    const auth = req.headers.authorization;
    if (typeof auth !== "string" || !auth.startsWith("Bearer ")) { res.redirect(302, `${getOAuthWebOrigin(req)}/conta`); return; }
    try {
      await sdk.authenticateRequest(req);
      res.cookie(COOKIE_NAME, auth.slice(7).trim(), { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
      res.redirect(302, `${getOAuthWebOrigin(req)}${destination}`);
    } catch { res.redirect(302, `${getOAuthWebOrigin(req)}/conta?login=expired`); }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });

  // Get current authenticated user - works with both cookie (web) and Bearer token (mobile)
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({ user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] /api/auth/me failed:", error);
      res.status(401).json({ error: "Not authenticated", user: null });
    }
  });

  // Establish session cookie from Bearer token
  // Used by iframe preview: frontend receives token via postMessage, then calls this endpoint
  // to get a proper Set-Cookie response from the backend (3000-xxx domain)
  app.post("/api/auth/session", async (req: Request, res: Response) => {
    try {
      // Authenticate using Bearer token from Authorization header
      const user = await sdk.authenticateRequest(req);

      // Get the token from the Authorization header to set as cookie
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
        res.status(400).json({ error: "Bearer token required" });
        return;
      }
      const token = authHeader.slice("Bearer ".length).trim();

      // Set cookie for this domain (3000-xxx)
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ success: true, user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] /api/auth/session failed:", error);
      res.status(401).json({ error: "Invalid token" });
    }
  });
}
