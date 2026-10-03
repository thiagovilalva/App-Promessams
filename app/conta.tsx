import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { startOAuthLogin } from "@/constants/oauth";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";

export default function AccountScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [historyCount, setHistoryCount] = useState(0);
  const history = trpc.history.list.useQuery(undefined, { enabled: Boolean(user), retry: false });
  useEffect(() => { AsyncStorage.getItem("sementes:chat").then((value) => { if (value) setHistoryCount(JSON.parse(value).filter((item: { role: string }) => item.role === "user").length); }); }, [user]);

  return <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={[styles.kicker, { color: colors.primary }]}>SUA JORNADA</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>Conta e histórico</Text>
      <Text style={[styles.body, { color: colors.muted }]}>Entre com sua conta Manus para guardar suas conversas e continuar sua jornada em outro acesso.</Text>
      {loading ? <ActivityIndicator color={colors.primary} /> : user ? <>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.welcome, { color: colors.foreground }]}>Olá, {user.name || user.email || "participante"}.</Text><Text style={[styles.body, { color: colors.muted }]}>Este dispositivo tem {historyCount} pergunta(s) guardada(s). O histórico sincronizado aparece abaixo.</Text><Pressable onPress={() => void logout()} style={[styles.button, { backgroundColor: colors.border }]}><Text style={[styles.buttonText, { color: colors.foreground }]}>Sair da conta</Text></Pressable></View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Conversas salvas</Text>
        {history.isLoading && <ActivityIndicator color={colors.primary} />}
        {!history.isLoading && !history.data?.length && <Text style={[styles.body, { color: colors.muted }]}>Sua próxima conversa aparecerá aqui.</Text>}
        {history.data?.map((conversation) => <View key={conversation.id} style={[styles.historyItem, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.historyTitle, { color: colors.foreground }]}>{conversation.title}</Text><Text style={[styles.historyDate, { color: colors.muted }]}>{new Date(conversation.updatedAt).toLocaleDateString("pt-BR")}</Text></View>)}
        <Pressable onPress={() => router.push("/admin")} style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}><Text style={[styles.buttonText, { color: colors.foreground }]}>Área da equipe</Text></Pressable>
      </> : <View style={styles.accountChoices}><Pressable onPress={() => void startOAuthLogin()} style={[styles.button, { backgroundColor: colors.primary }]}><Text style={styles.buttonTextLight}>Entrar — já tenho conta</Text></Pressable><Pressable onPress={() => void Linking.openURL("https://manus.im/invitation/L6X1HAEPGOFARG?")} style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.primary, borderWidth: 1 }]}><Text style={[styles.buttonText, { color: colors.primary }]}>Criar conta na Manus</Text></Pressable></View>}
      {!user && <View style={[styles.note, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.noteTitle, { color: colors.foreground }]}>Acesso seguro</Text><Text style={[styles.body, { color: colors.muted }]}>O login abre a autenticação oficial da Manus. A criação de conta abre o link oficial em uma nova página.</Text></View>}
      <Pressable onPress={() => router.push("/politica-privacidade")} style={styles.privacyLink} accessibilityRole="link"><Text style={[styles.privacyText, { color: colors.primary }]}>Política de Privacidade</Text><Text style={[styles.privacyHint, { color: colors.muted }]}>Leia como seus dados são tratados</Text></Pressable>
    </ScrollView>
  </ScreenContainer>;
}

const styles = StyleSheet.create({ content: { paddingTop: 24, paddingBottom: 40, gap: 14 }, kicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2 }, title: { fontSize: 29, lineHeight: 36, fontWeight: "800" }, body: { fontSize: 14, lineHeight: 21 }, card: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 12 }, welcome: { fontSize: 17, fontWeight: "800" }, accountChoices: { gap: 8 }, button: { alignItems: "center", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18, marginTop: 6 }, buttonText: { fontWeight: "800" }, buttonTextLight: { color: "#FFFFFF", fontWeight: "800" }, sectionTitle: { fontSize: 18, fontWeight: "800", marginTop: 12 }, historyItem: { borderWidth: 1, borderRadius: 14, padding: 13, gap: 4 }, historyTitle: { fontWeight: "800", fontSize: 13 }, historyDate: { fontSize: 11 }, note: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 8, marginTop: 10 }, noteTitle: { fontWeight: "800", fontSize: 15 }, privacyLink: { alignItems: "center", marginTop: 8, padding: 6 }, privacyText: { fontSize: 12, fontWeight: "800" }, privacyHint: { fontSize: 10, marginTop: 3 } });
