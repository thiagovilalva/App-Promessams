import type { CookieOptions, Request } from "express";

function isSecureRequest(req: Request) {
  if (req.protocol === "https" || req.hostname?.endsWith(".manus.space")) return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const list = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return list.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(req: Request): Pick<CookieOptions, "httpOnly" | "path" | "sameSite" | "secure"> {
  const secure = isSecureRequest(req);
  // Host-only cookies: never share users' sessions with other manus.space sites.
  // Keep secure iframe preview support without relying on a shared parent cookie.
  const sameSite = req.hostname?.endsWith(".manus.space") || !secure ? "lax" : "none";
  return { httpOnly: true, path: "/", sameSite, secure };
}
