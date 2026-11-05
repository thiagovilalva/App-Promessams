import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getRedirectUri } from "@/constants/oauth";
import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import { exchangeOAuthCodeOnce } from "@/lib/oauth-exchange";

function first(value: string | string[] | undefined): string | undefined { return Array.isArray(value) ? value[0] : value; }
export default function OAuthCallback() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{ code?: string | string[]; state?: string | string[]; error?: string | string[] }>();
  const code = first(params.code); const state = first(params.state); const error = first(params.error);
  const [message, setMessage] = useState<string | null>(null);
  const latest = useRef<string>("");
  useEffect(() => {
    const key = `${code || ""}\u0000${state || ""}\u0000${error || ""}`;
    latest.current = key;
    let active = true;
    const handle = async () => {
      try {
        if (error) throw new Error("O login foi cancelado ou recusado. Volte e tente novamente.");
        if (Platform.OS === "web") {
          // Web OAuth exchanges in the server, never a second time in the client.
          const user = await Api.getMe();
          if (!user) throw new Error("Não foi possível confirmar a sessão. Volte ao site e entre novamente.");
        } else {
          if (!code || !state) throw new Error("O retorno do login está incompleto. Volte e tente novamente.");
          let redirect: string;
          try { redirect = atob(state); } catch { throw new Error("O retorno do login é inválido."); }
          if (redirect !== getRedirectUri()) throw new Error("Este retorno não pertence ao PromessaMS.");
          const result = await exchangeOAuthCodeOnce(code, state);
          if (!result.sessionToken || !result.user?.openId) throw new Error("Não foi possível concluir a autenticação.");
          if (!active || latest.current !== key) return;
          await Auth.setSessionToken(result.sessionToken);
          await Auth.setUserInfo({ ...result.user, lastSignedIn: new Date(result.user.lastSignedIn) });
        }
        if (active && latest.current === key) router.replace("/conta");
      } catch (reason) {
        if (active && latest.current === key) setMessage(reason instanceof Error ? reason.message : "Não foi possível concluir o login.");
      }
    };
    void handle();
    return () => { active = false; };
  }, [code, state, error, router]);
  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>{message ? "Login não concluído" : "Concluindo seu login"}</Text>
        {message ? <>
          <Text style={[styles.message, { color: colors.muted }]}>{message}</Text>
          <Pressable accessibilityRole="button" onPress={() => router.replace("/conta")} style={[styles.button, { backgroundColor: colors.primary }]}><Text style={styles.buttonText}>Voltar para entrar</Text></Pressable>
        </> : <><ActivityIndicator color={colors.primary} /><Text style={[styles.message, { color: colors.muted }]}>Aguarde enquanto confirmamos sua sessão.</Text></>}
      </View>
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({ content: { flex: 1, justifyContent: "center", padding: 24, gap: 18 }, title: { fontSize: 24, lineHeight: 32, fontWeight: "800", textAlign: "center" }, message: { fontSize: 16, lineHeight: 24, textAlign: "center" }, button: { padding: 16, borderRadius: 14, alignItems: "center" }, buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" } });
