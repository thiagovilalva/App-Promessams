import { useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAccessibility } from "@/lib/accessibility-provider";
import { READING_PLAN } from "@/shared/reading-plan";

export default function PlanoBiblicoScreen() {
  const colors = useColors();
  const { textScale } = useAccessibility();
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  return <ScreenContainer className="px-5" edges={["top", "left", "right"]}><ScrollView contentContainerStyle={styles.scroll}>
    <Text style={[styles.kicker, { color: colors.primary }]}>BÍBLIA & DEVOCIONAIS</Text>
    <Text style={[styles.title, { color: colors.foreground, fontSize: 30 * textScale, lineHeight: 37 * textScale }]}>Bíblia & Devocionais</Text>
    <Text style={[styles.subtitle, { color: colors.muted, fontSize: 15 * textScale, lineHeight: 23 * textScale }]}>Quando mais próximos da Palavra ficamos, mais forte a prática missionária se torna.</Text>
    <View style={styles.actionRow}>
      <Pressable onPress={() => router.push("/biblia-livre")} style={[styles.bibleButton, { backgroundColor: colors.primary }]} accessibilityRole="button"><Text style={styles.bibleButtonText}>Abrir Bíblia Livre</Text></Pressable>
      <Pressable onPress={() => router.push("/pao-diario")} style={[styles.bibleButton, { backgroundColor: colors.surface, borderColor: colors.primary, borderWidth: 1 }]} accessibilityRole="button"><Text style={[styles.bibleButtonText, { color: colors.primary }]}>Pão Diário</Text></Pressable>
    </View>
    {READING_PLAN.map((item) => { const isOpen = open === item.id; return <View key={item.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: isOpen ? colors.primary : colors.border }]}>
      <Text style={[styles.reference, { color: colors.foreground, fontSize: 19 * textScale }]}>{item.reference}</Text>
      <Text style={[styles.cardTitle, { color: colors.foreground, fontSize: 15 * textScale }]}>{item.title}</Text>
      <Pressable onPress={() => setOpen(isOpen ? null : item.id)}><Text style={[styles.action, { color: colors.primary }]}>{isOpen ? "Fechar reflexão" : "Abrir reflexão"}</Text></Pressable>
      {isOpen && <View style={[styles.details, { borderTopColor: colors.border }]}><Text style={[styles.label, { color: colors.primary }]}>TEXTO BÍBLICO — BLIVRE</Text><Text style={[styles.readingText, { color: colors.foreground, backgroundColor: colors.primary + "10", fontSize: 13 * textScale, lineHeight: 20 * textScale }]}>{item.readingText.replace(/NAA/g, "BLivre")}</Text><Text style={[styles.label, { color: colors.primary }]}>LEITURA HERMENÊUTICA</Text><Text style={[styles.body, { color: colors.foreground, fontSize: 14 * textScale, lineHeight: 23 * textScale }]}>{item.hermeneutics}</Text><Text style={[styles.label, { color: colors.primary }]}>EM DIÁLOGO COM COMENTARISTAS</Text><Text style={[styles.body, { color: colors.muted, fontSize: 13 * textScale, lineHeight: 21 * textScale }]}>{item.dialogue}</Text><Text style={[styles.label, { color: colors.primary }]}>APLICAÇÃO MISSIONAL</Text><Text style={[styles.application, { color: colors.foreground, backgroundColor: colors.primary + "12", fontSize: 14 * textScale, lineHeight: 22 * textScale }]}>{item.application}</Text></View>}
    </View>; })}
  </ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({ scroll: { paddingTop: 24, paddingBottom: 40, gap: 13 }, kicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1.3 }, title: { fontWeight: "800", marginTop: 5 }, subtitle: { marginTop: 8, marginBottom: 10 }, actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginBottom: 2 }, bibleButton: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11 }, bibleButtonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 13 }, card: { borderWidth: 1, borderRadius: 18, padding: 16 }, reference: { fontWeight: "800", marginTop: 8 }, cardTitle: { marginTop: 4, fontWeight: "700" }, action: { fontWeight: "800", marginTop: 13 }, details: { borderTopWidth: 1, marginTop: 14, paddingTop: 14, gap: 7 }, label: { fontSize: 10, fontWeight: "800", letterSpacing: 1, marginTop: 3 }, readingText: { borderRadius: 12, padding: 12, marginBottom: 5 }, body: { marginBottom: 7 }, application: { borderRadius: 12, padding: 12, fontWeight: "700" } });
