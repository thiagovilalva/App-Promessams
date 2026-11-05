import { useEffect } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function ReportsScreen() {
  const colors = useColors(); const router = useRouter(); const { user, loading } = useAuth();
  const reports = trpc.reports.list.useQuery(undefined, { enabled: !!user, retry: false });
  useEffect(() => { if (!loading && !user) router.replace("/conta"); }, [loading, user, router]);
  return <ScreenContainer className="px-5" edges={["top", "bottom", "left", "right"]}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.nav}><Pressable onPress={() => router.replace("/conta")} accessibilityRole="button" style={styles.back}><Text style={[styles.link, { color: colors.primary }]}>Voltar</Text></Pressable><Pressable onPress={() => router.replace("/")} accessibilityRole="button" style={styles.back}><Text style={[styles.link, { color: colors.primary }]}>Início</Text></Pressable></View>
      <Text style={[styles.title, { color: colors.foreground }]}>Relatórios</Text>
      {loading || reports.isLoading ? <ActivityIndicator color={colors.primary} /> : user && <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.subtitle, { color: colors.foreground }]}>Nenhum relatório publicado</Text>
        <Text style={[styles.body, { color: colors.muted }]}>Esta área está preparada para receber relatórios da Convenção Regional. Quando forem publicados, você poderá consultá-los aqui após entrar na sua conta.</Text>
        {!!reports.error && <Text style={[styles.body, { color: colors.error }]}>Não foi possível verificar a disponibilidade. Tente novamente em instantes.</Text>}
      </View>}
    </ScrollView>
  </ScreenContainer>;
}
const styles = StyleSheet.create({ content: { paddingTop: 18, paddingBottom: 32, gap: 18 }, nav: { flexDirection: "row", justifyContent: "space-between" }, back: { paddingVertical: 10 }, link: { fontSize: 16, lineHeight: 24, fontWeight: "800" }, title: { fontSize: 30, lineHeight: 38, fontWeight: "800" }, card: { borderWidth: 1, borderRadius: 18, padding: 20, gap: 12 }, subtitle: { fontSize: 20, lineHeight: 28, fontWeight: "800" }, body: { fontSize: 16, lineHeight: 25 } });
