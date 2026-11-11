import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function ReportsScreen() {
  const colors = useColors(); const router = useRouter(); const { user, loading } = useAuth();
  const reports = trpc.reports.list.useQuery(undefined, { enabled: !!user, retry: false });
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  useEffect(() => { if (!loading && !user) router.replace("/conta"); }, [loading, user, router]);
  return <ScreenContainer className="px-5" edges={["top", "bottom", "left", "right"]}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.nav}><Pressable onPress={() => router.replace("/conta")} accessibilityRole="button" style={styles.back}><Text style={[styles.link, { color: colors.primary }]}>Voltar</Text></Pressable><Pressable onPress={() => router.replace("/")} accessibilityRole="button" style={styles.back}><Text style={[styles.link, { color: colors.primary }]}>Início</Text></Pressable></View>
      <Text style={[styles.title, { color: colors.foreground }]}>Relatórios</Text>
      {loading || reports.isLoading ? <ActivityIndicator color={colors.primary} /> : user && <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.subtitle, { color: colors.foreground }]}>Assuntos pesquisados</Text>
        <Text style={[styles.body, { color: colors.muted }]}>Dados agregados dos chats, sem exibir perguntas, respostas, nomes ou históricos individuais.</Text>
        {!!reports.data && <><Text style={[styles.total, { color: colors.primary }]}>Total de conversas: {reports.data.totalConversations}</Text>{reports.data.topics.length ? reports.data.topics.map((item) => <View key={item.topic}><Pressable onPress={() => setSelectedTopic(selectedTopic === item.topic ? null : item.topic)} style={[styles.topic, { borderColor: colors.border }]} accessibilityRole="button"><Text style={[styles.topicName, { color: colors.foreground }]}>{item.topic}</Text><Text style={[styles.topicCount, { color: colors.primary }]}>{item.count} ›</Text></Pressable>{selectedTopic === item.topic && <View style={[styles.subjects, { backgroundColor: colors.background, borderColor: colors.border }]}><Text style={[styles.subjectTitle, { color: colors.foreground }]}>Principais assuntos pesquisados</Text>{item.subjects.length ? item.subjects.map((subject) => <View key={subject.subject} style={styles.subjectRow}><Text style={[styles.subjectName, { color: colors.muted }]}>{subject.subject}</Text><Text style={[styles.subjectCount, { color: colors.primary }]}>{subject.count}</Text></View>) : <Text style={[styles.body, { color: colors.muted }]}>Não há assuntos classificados neste chat.</Text>}</View>}</View>) : <Text style={[styles.body, { color: colors.muted }]}>Ainda não há conversas suficientes para gerar estatísticas.</Text>}</>}
        {!!reports.error && <Text style={[styles.body, { color: colors.error }]}>Não foi possível verificar a disponibilidade. Tente novamente em instantes.</Text>}
      </View>}
    </ScrollView>
  </ScreenContainer>;
}
const styles = StyleSheet.create({ content: { paddingTop: 18, paddingBottom: 32, gap: 18 }, nav: { flexDirection: "row", justifyContent: "space-between" }, back: { paddingVertical: 10 }, link: { fontSize: 16, lineHeight: 24, fontWeight: "800" }, title: { fontSize: 30, lineHeight: 38, fontWeight: "800" }, card: { borderWidth: 1, borderRadius: 18, padding: 20, gap: 12 }, subtitle: { fontSize: 20, lineHeight: 28, fontWeight: "800" }, body: { fontSize: 16, lineHeight: 25 }, total: { fontSize: 17, fontWeight: "800" }, topic: { borderBottomWidth: 1, paddingVertical: 12, flexDirection: "row", justifyContent: "space-between" }, topicName: { fontSize: 15, fontWeight: "700" }, topicCount: { fontSize: 16, fontWeight: "800" }, subjects: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 8, gap: 8 }, subjectTitle: { fontSize: 14, fontWeight: "800" }, subjectRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 }, subjectName: { fontSize: 13 }, subjectCount: { fontSize: 13, fontWeight: "800" } });
