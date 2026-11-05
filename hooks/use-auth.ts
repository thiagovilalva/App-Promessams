import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

type UseAuthOptions = { autoFetch?: boolean };
export function useAuth(options: UseAuthOptions = {}) {
  const { autoFetch = true } = options;
  const [user, setUser] = useState<Auth.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const fetchUser = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (Platform.OS === "web") {
        // Only the server's authenticated session is authoritative on the web.
        const data = await Api.getMe();
        if (data) {
          const info: Auth.User = { ...data, lastSignedIn: new Date(data.lastSignedIn) };
          setUser(info); await Auth.setUserInfo(info);
        } else { setUser(null); await Auth.clearUserInfo(); }
      } else {
        const token = await Auth.getSessionToken();
        // Preserve offline/native cached access, but never treat an orphaned
        // user-info cache without a session token as a successful login.
        setUser(token ? await Auth.getUserInfo() : null);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason : new Error("Não foi possível confirmar a sessão."));
      setUser(null);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => Auth.subscribeAuthChanges(() => { void fetchUser(); }), [fetchUser]);
  useEffect(() => { if (autoFetch) void fetchUser(); else setLoading(false); }, [autoFetch, fetchUser]);
  const logout = useCallback(async () => {
    try { await Api.logout(); }
    catch { /* Local sign-out must remain available offline. */ }
    finally { await Auth.removeSessionToken(); await Auth.clearUserInfo(); setUser(null); setError(null); }
  }, []);
  const isAuthenticated = useMemo(() => Boolean(user), [user]);
  return { user, loading, error, isAuthenticated, refresh: fetchUser, logout };
}
