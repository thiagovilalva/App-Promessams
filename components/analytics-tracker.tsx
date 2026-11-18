import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePathname } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";

import { trpc } from "@/lib/trpc";

const STORAGE_KEY = "promessams.analytics.identity.v1";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const HEARTBEAT_MS = 60 * 1000;

type AnalyticsIdentity = {
  visitorId: string;
  sessionId: string;
  sessionStartedAt: number;
  lastActivityAt: number;
};

type AnalyticsEvent = "session_start" | "page_view" | "heartbeat" | "session_end";

function createId(prefix: string) {
  const random = typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${random}`.slice(0, 64);
}

export function analyticsFeatureForPath(pathname: string) {
  const path = pathname || "/";
  if (path === "/") return "Página inicial";
  if (path.startsWith("/chat")) return "Chat Geral";
  if (path.startsWith("/biblia-livre")) return "Bíblia Livre";
  if (path.startsWith("/hinario")) return "Hinário HBJ";
  if (path.startsWith("/pao-diario")) return "Pão Diário 365";
  if (path.startsWith("/plano-biblico")) return "Devocionais";
  if (path.startsWith("/conteudos")) return "Conteúdos e downloads";
  if (path.startsWith("/radio-promessa")) return "Programas & Comunidade";
  if (path.startsWith("/igrejas")) return "Igrejas e endereços";
  if (path.startsWith("/ofertas")) return "Ofertas missionárias";
  if (path.startsWith("/conta")) return "Conta e histórico";
  if (path.startsWith("/relatorios")) return "Relatórios";
  if (path.startsWith("/admin")) return "Área da equipe";
  if (path.startsWith("/politica-privacidade")) return "Política de privacidade";
  return path.replace(/^\//, "").replace(/[-_]/g, " ") || "Página não identificada";
}

function getReferrerOrigin() {
  if (Platform.OS !== "web" || typeof document === "undefined" || !document.referrer) return undefined;
  try {
    return new URL(document.referrer).origin.slice(0, 255);
  } catch {
    return undefined;
  }
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const track = trpc.analytics.track.useMutation();
  const identityRef = useRef<AnalyticsIdentity | null>(null);
  const [ready, setReady] = useState(false);
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void AsyncStorage.getItem(STORAGE_KEY).then(async (raw) => {
      if (cancelled) return;
      let saved: Partial<AnalyticsIdentity> = {};
      try {
        saved = raw ? JSON.parse(raw) as Partial<AnalyticsIdentity> : {};
      } catch {
        saved = {};
      }
      const now = Date.now();
      const visitorId = saved.visitorId || createId("visitor");
      const shouldStartNewSession = !saved.sessionId || !saved.lastActivityAt || now - saved.lastActivityAt > SESSION_TIMEOUT_MS;
      const identity: AnalyticsIdentity = {
        visitorId,
        sessionId: shouldStartNewSession ? createId("session") : saved.sessionId!,
        sessionStartedAt: shouldStartNewSession ? now : saved.sessionStartedAt || now,
        lastActivityAt: now,
      };
      identityRef.current = identity;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !identityRef.current || !pathname || lastPathRef.current === pathname) return;
    const identity = identityRef.current;
    const now = Date.now();
    const isFirstEvent = lastPathRef.current === null;
    lastPathRef.current = pathname;
    identity.lastActivityAt = now;
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
    const send = (eventType: AnalyticsEvent) => {
      track.mutate({
        eventType,
        visitorId: identity.visitorId,
        sessionId: identity.sessionId,
        platform: Platform.OS === "web" ? "web" : "app",
        path: pathname.slice(0, 255),
        feature: analyticsFeatureForPath(pathname).slice(0, 80),
        durationSeconds: Math.max(0, Math.round((now - identity.sessionStartedAt) / 1000)),
        referrer: getReferrerOrigin(),
      });
    };
    if (isFirstEvent) send("session_start");
    send("page_view");
  }, [pathname, ready, track]);

  useEffect(() => {
    if (!ready) return;
    const sendHeartbeat = (eventType: "heartbeat" | "session_end") => {
      const identity = identityRef.current;
      const path = lastPathRef.current;
      if (!identity || !path) return;
      const now = Date.now();
      identity.lastActivityAt = now;
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
      track.mutate({
        eventType,
        visitorId: identity.visitorId,
        sessionId: identity.sessionId,
        platform: Platform.OS === "web" ? "web" : "app",
        path: path.slice(0, 255),
        feature: analyticsFeatureForPath(path).slice(0, 80),
        durationSeconds: Math.max(0, Math.round((now - identity.sessionStartedAt) / 1000)),
        referrer: getReferrerOrigin(),
      });
    };
    const interval = setInterval(() => sendHeartbeat("heartbeat"), HEARTBEAT_MS);
    const appStateSubscription = Platform.OS === "web" ? null : AppState.addEventListener("change", (state) => {
      if (state !== "active") sendHeartbeat("session_end");
    });
    let visibilityHandler: (() => void) | undefined;
    if (Platform.OS === "web" && typeof document !== "undefined") {
      visibilityHandler = () => {
        if (document.visibilityState !== "visible") sendHeartbeat("session_end");
      };
      document.addEventListener("visibilitychange", visibilityHandler);
    }
    return () => {
      clearInterval(interval);
      appStateSubscription?.remove();
      if (visibilityHandler) document.removeEventListener("visibilitychange", visibilityHandler);
    };
  }, [ready, track]);

  return null;
}
