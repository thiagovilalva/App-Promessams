import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, BackHandler, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView, type WebViewNavigation } from "react-native-webview";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getSessionToken } from "@/lib/_core/auth";
import { PUBLIC_SITE_ORIGIN } from "@/shared/auth-config";
import { HOSTED_PAGES, isHostedPageKey } from "@/shared/hosted-pages";

export default function HostedPageScreen() {
  const colors = useColors(); const router = useRouter(); const { page } = useLocalSearchParams<{ page?: string }>();
  const definition = page && isHostedPageKey(page) ? HOSTED_PAGES[page] : undefined;
  const webview = useRef<WebView>(null);
  const [source, setSource] = useState<{ uri: string; headers?: Record<string, string> }>();
  const [error, setError] = useState(""); const [loading, setLoading] = useState(true); const [canGoBack, setCanGoBack] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    let active = true; setError(""); setLoading(true);
    void (async () => {
      if (!definition) { setError("Página indisponível."); setLoading(false); return; }
      if (Platform.OS === "web") { router.replace(definition.path as never); return; }
      const token = await getSessionToken();
      if (!active) return;
      if (definition.requiresAuth && !token) { router.replace("/conta"); return; }
      // A session cookie is established by the same-origin server, then the
      // WebView follows its redirect. Tokens never appear in URLs or injected JS.
      setSource(token && definition.requiresAuth ? {
        uri: `${PUBLIC_SITE_ORIGIN}/api/auth/open-page?destination=${encodeURIComponent(definition.path)}`,
        headers: { Authorization: `Bearer ${token}` },
      } : { uri: `${PUBLIC_SITE_ORIGIN}${definition.path}` });
    })();
    return () => { active = false; };
  }, [definition, router, reloadKey]);
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => { if (canGoBack) webview.current?.goBack(); else router.back(); return true; });
    return () => sub.remove();
  }, [canGoBack, router]);
  const navigation = (event: WebViewNavigation) => { setCanGoBack(event.canGoBack); };
  return <ScreenContainer edges={["top", "bottom", "left", "right"]}>
    <View style={[styles.header, { borderColor: colors.border }]}>
      <Pressable accessibilityRole="button" onPress={() => router.replace(page === "relatorios" ? "/conta" : "/radio-promessa")} style={styles.back}><Text style={[styles.link, { color: colors.primary }]}>Voltar</Text></Pressable>
      <Text style={[styles.title, { color: colors.foreground }]}>{definition?.title || "Página online"}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Voltar à tela inicial" onPress={() => router.replace("/")} style={styles.back}><Text style={[styles.link, { color: colors.primary }]}>Início</Text></Pressable>
    </View>
    {loading && !error && <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={[styles.body, { color: colors.muted }]}>Carregando página online...</Text></View>}
    {error ? <View style={styles.error}><Text style={[styles.body, { color: colors.foreground }]}>{error}</Text><Pressable onPress={() => { setSource(undefined); setReloadKey(value => value + 1); }} style={styles.back}><Text style={[styles.link, { color: colors.primary }]}>Tentar novamente</Text></Pressable></View> : source && Platform.OS !== "web" && <WebView key={reloadKey} ref={webview} source={source} style={styles.webview} javaScriptEnabled domStorageEnabled sharedCookiesEnabled thirdPartyCookiesEnabled={false} originWhitelist={[PUBLIC_SITE_ORIGIN]} mixedContentMode="never" allowFileAccess={false} onNavigationStateChange={navigation}
      onLoadEnd={() => setLoading(false)} onError={() => { setError("Não foi possível abrir a página. Verifique sua conexão e tente novamente."); setLoading(false); }}
      onShouldStartLoadWithRequest={request => {
        if (request.url === "about:blank" || request.url.startsWith(`${PUBLIC_SITE_ORIGIN}/`)) return true;
        if (/^(https?:|mailto:|tel:|whatsapp:)/i.test(request.url)) void Linking.openURL(request.url).catch(() => undefined);
        return false;
      }} />}
  </ScreenContainer>;
}
const styles = StyleSheet.create({ header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, borderBottomWidth: 1, gap: 12 }, title: { fontSize: 18, lineHeight: 26, fontWeight: "800", flex: 1, textAlign: "center" }, back: { paddingVertical: 15 }, link: { fontSize: 16, lineHeight: 24, fontWeight: "800" }, webview: { flex: 1 }, loading: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 }, error: { padding: 24 }, body: { fontSize: 16, lineHeight: 24 } });
