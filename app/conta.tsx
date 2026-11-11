import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { startOAuthLogin } from "@/constants/oauth";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";

export default function AccountScreen() {
  const colors = useColors();
  const router = useRouter();
  const { login } = useLocalSearchParams<{ login?: string }>();
  const { user, loading, logout } = useAuth();
  const [historyCount, setHistoryCount] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const history = trpc.history.list.useQuery(undefined, { enabled: Boolean(user), retry: false });
  const deleteConversation = trpc.history.delete.useMutation({ onSuccess: () => { setExpandedId(null); void history.refetch(); } });
  const deleteAllConversations = trpc.history.deleteAll.useMutation({ onSuccess: () => void history.refetch() });
  function confirmDeleteAll() {
    const remove = () => deleteAllConversations.mutate(undefined, { onError: (error) => Alert.alert("Não foi possível apagar", error.message) });
    if (Platform.OS === "web" && typeof globalThis.confirm === "function") { if (globalThis.confirm("Todas as suas conversas serão apagadas da sua conta. Deseja continuar?")) remove(); return; }
    Alert.alert("Apagar histórico", "Todas as suas conversas serão apagadas da sua conta.", [{ text: "Cancelar", style: "cancel" }, { text: "Apagar", style: "destructive", onPress: remove }]);
  }
  function confirmDeleteOne(conversationId: number) {
    const remove = () => deleteConversation.mutate({ conversationId }, { onError: (error) => Alert.alert("Não foi possível apagar", error.message) });
    if (Platform.OS === "web" && typeof globalThis.confirm === "function") { if (globalThis.confirm("Esta conversa será removida da sua conta. Deseja continuar?")) remove(); return; }
    Alert.alert("Apagar conversa", "Esta conversa será removida da sua conta.", [{ text: "Cancelar", style: "cancel" }, { text: "Apagar", style: "destructive", onPress: remove }]);
  }
  useEffect(() => { AsyncStorage.getItem("sementes:chat").then((value) => { if (value) setHistoryCount(JSON.parse(value).filter((item: { role: string }) => item.role === "user").length); }); }, [user]);

  return <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable accessibilityRole="button" accessibilityLabel="Voltar à tela inicial" onPress={() => router.replace("/")} style={styles.back}><Text style={[styles.backText, { color: colors.primary }]}>Voltar</Text></Pressable>
      <View style={styles.topline}><Text style={[styles.kicker, { color: colors.primary }]}>SUA JORNADA</Text></View>
      <Text style={[styles.title, { color: colors.foreground }]}>Conta e histórico</Text>
      <Text style={[styles.body, { color: colors.muted }]}>Entre com sua conta Manus para guardar suas conversas e continuar sua jornada em outro acesso.</Text>
      {login === "cancelled" && !user && <Text style={[styles.body, { color: colors.muted }]}>O login foi cancelado. Você pode tentar novamente pelo botão Entrar.</Text>}
      {["incomplete", "expired", "failed"].includes(login || "") && !user && <Text accessibilityRole="alert" style={[styles.body, { color: colors.error }]}>Não foi possível concluir este login. Clique em Entrar para iniciar uma nova tentativa; se necessário, use o mesmo navegador até concluir a autenticação.</Text>}
      {loading ? <ActivityIndicator color={colors.primary} /> : user ? <>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.welcome, { color: colors.foreground }]}>Olá, {user.name || user.email || "participante"}.</Text><Text style={[styles.body, { color: colors.muted }]}>Este dispositivo tem {historyCount} pergunta(s) guardada(s). O histórico sincronizado aparece abaixo.</Text><Pressable onPress={() => void logout()} style={[styles.button, { backgroundColor: colors.border }]}><Text style={[styles.buttonText, { color: colors.foreground }]}>Sair da conta</Text></Pressable></View>
        <View style={styles.historyHeader}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Histórico de conversas</Text>{!!history.data?.length && <Pressable onPress={confirmDeleteAll} disabled={deleteAllConversations.isPending} accessibilityRole="button"><Text style={[styles.clearHistory, { color: colors.error }]}>{deleteAllConversations.isPending ? "Apagando…" : "Apagar tudo"}</Text></Pressable>}</View>
        {history.isLoading && <ActivityIndicator color={colors.primary} />}
        {!history.isLoading && !history.data?.length && <Text style={[styles.body, { color: colors.muted }]}>Sua próxima conversa aparecerá aqui.</Text>}
        {history.data?.map((conversation) => { let saved: Array<{ role: string; content: string }> = []; try { saved = JSON.parse(conversation.messages); } catch { saved = []; } return <View key={conversation.id} style={[styles.historyItem, { backgroundColor: colors.surface, borderColor: colors.border }]}><Pressable onPress={() => setExpandedId(expandedId === conversation.id ? null : conversation.id)}><Text style={[styles.historyTitle, { color: colors.foreground }]}>{conversation.title}</Text><Text style={[styles.historyDate, { color: colors.muted }]}>{new Date(conversation.updatedAt).toLocaleDateString("pt-BR")} · {expandedId === conversation.id ? "Fechar" : "Abrir conversa"}</Text></Pressable>{expandedId === conversation.id && <View style={styles.transcript}>{saved.map((message, index) => <View key={index} style={[styles.transcriptMessage, { borderColor: colors.border }]}><Text style={[styles.transcriptRole, { color: colors.primary }]}>{message.role === "user" ? "Você" : "PromessaMS"}</Text><Text selectable style={[styles.transcriptText, { color: colors.foreground }]}>{message.content}</Text></View>)}<Pressable onPress={() => confirmDeleteOne(conversation.id)} disabled={deleteConversation.isPending} accessibilityRole="button"><Text style={[styles.clearHistory, { color: colors.error }]}>{deleteConversation.isPending ? "Apagando…" : "Apagar esta conversa"}</Text></Pressable></View>}</View>; })}
        <Pressable onPress={() => router.push("/admin")} style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}><Text style={[styles.buttonText, { color: colors.foreground }]}>Área da equipe</Text></Pressable>
      </> : <View style={styles.accountChoices}><Pressable onPress={() => void startOAuthLogin()} accessibilityRole="button" accessibilityLabel="Entrar, já tenho conta" style={({ pressed }) => [styles.button, { backgroundColor: colors.primary }, pressed && styles.pressed]}><Text style={styles.buttonTextLight}>Entrar — já tenho conta</Text></Pressable><Pressable onPress={() => void Linking.openURL("https://manus.im/invitation/L6X1HAEPGOFARG?")} accessibilityRole="button" style={({ pressed }) => [styles.button, { backgroundColor: colors.surface, borderColor: colors.primary, borderWidth: 1 }, pressed && styles.pressed]}><Text style={[styles.buttonText, { color: colors.primary }]}>Criar conta na Manus</Text></Pressable></View>}
      {!user && <View style={[styles.note, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.noteTitle, { color: colors.foreground }]}>Acesso seguro</Text><Text style={[styles.body, { color: colors.muted }]}>O login abre a autenticação oficial da Manus. A criação de conta abre o link oficial em uma nova página.</Text></View>}
      <Pressable onPress={() => router.push("/politica-privacidade")} style={styles.privacyLink} accessibilityRole="link"><Text style={[styles.privacyText, { color: colors.primary }]}>Política de Privacidade</Text><Text style={[styles.privacyHint, { color: colors.muted }]}>Leia como seus dados são tratados</Text></Pressable>
    </ScrollView>
  </ScreenContainer>;
}

  const styles = StyleSheet.create({ content: { paddingTop: 18, paddingBottom: 40, gap: 14 }, back: { alignSelf: "flex-start", paddingVertical: 10 }, backText: { fontSize: 16, fontWeight: "800" }, topline: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 }, reportsButton: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 }, kicker: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2 }, title: { fontSize: 29, lineHeight: 36, fontWeight: "800" }, body: { fontSize: 14, lineHeight: 21 }, card: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 12 }, welcome: { fontSize: 17, fontWeight: "800" }, accountChoices: { gap: 8 }, button: { alignItems: "center", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18, marginTop: 6 }, pressed: { opacity: 0.78 }, buttonText: { fontWeight: "800" }, buttonTextLight: { color: "#FFFFFF", fontWeight: "800" }, historyHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, sectionTitle: { fontSize: 18, fontWeight: "800", marginTop: 12 }, clearHistory: { fontSize: 12, fontWeight: "800" }, historyItem: { borderWidth: 1, borderRadius: 14, padding: 13, gap: 4 }, historyTitle: { fontWeight: "800", fontSize: 13 }, historyDate: { fontSize: 11 }, transcript: { marginTop: 10, gap: 9 }, transcriptMessage: { borderLeftWidth: 2, paddingLeft: 10 }, transcriptRole: { fontSize: 11, fontWeight: "800", marginBottom: 3 }, transcriptText: { fontSize: 13, lineHeight: 19 }, note: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 8, marginTop: 10 }, noteTitle: { fontWeight: "800", fontSize: 15 }, privacyLink: { alignItems: "center", marginTop: 8, padding: 6 }, privacyText: { fontSize: 12, fontWeight: "800" }, privacyHint: { fontSize: 10, marginTop: 3 } });
