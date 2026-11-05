import { Platform } from "react-native";
import { getApiBaseUrl } from "@/constants/oauth";
import * as Auth from "./auth";

export async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...((options.headers as Record<string, string>) || {}) };
  if (Platform.OS !== "web") {
    const token = await Auth.getSessionToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const base = getApiBaseUrl().replace(/\/$/, "");
  const url = `${base}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(url, { ...options, headers, credentials: "include", signal: options.signal || controller.signal });
    if (!response.ok) {
      let message = `Não foi possível concluir a solicitação (${response.status}).`;
      try { const error = await response.json(); if (typeof error.error === "string") message = error.error; } catch { /* Do not display arbitrary provider HTML. */ }
      throw new Error(message);
    }
    const text = await response.text();
    return (text ? JSON.parse(text) : {}) as T;
  } finally { clearTimeout(timeout); }
}

export type OAuthExchangeResult = { sessionToken: string; user: { id: number; openId: string; name: string | null; email: string | null; loginMethod: string | null; lastSignedIn: string } };
export async function exchangeOAuthCode(code: string, state: string): Promise<OAuthExchangeResult> {
  const params = new URLSearchParams({ code, state });
  const result = await apiCall<{ app_session_id: string; user: OAuthExchangeResult["user"] }>(`/api/oauth/mobile?${params.toString()}`);
  return { sessionToken: result.app_session_id, user: result.user };
}

export async function logout(): Promise<void> {
  await apiCall<void>("/api/auth/logout", { method: "POST" });
}

export async function getMe(): Promise<OAuthExchangeResult["user"] | null> {
  try { const result = await apiCall<{ user: OAuthExchangeResult["user"] }>("/api/auth/me"); return result.user || null; }
  catch { return null; }
}

export async function establishSession(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/auth/session`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, credentials: "include",
    });
    return response.ok;
  } catch { return false; }
}
