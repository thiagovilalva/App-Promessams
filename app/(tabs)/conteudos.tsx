import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { CONTENT_MODULES, type ContentModule } from "@/shared/knowledge";

export default function ConteudosScreen() {
  const colors = useColors();
  const [selected, setSelected] = useState<ContentModule | null>(null);
  const [saved, setSaved] = useState(false);
  const materialsQuery = trpc.materials.list.useQuery();

  async function saveForOffline() {
    await AsyncStorage.setItem("sementes:conteudos", JSON.stringify(CONTENT_MODULES));
    setSaved(true);
    if (selected) Alert.alert("Conteúdo salvo", "Este material já está disponível dentro do app, mesmo sem internet.");
  }

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={[styles.kicker, { color: colors.primary }]}>BIBLIOTECA SEMENTES</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Aprenda no seu ritmo.</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Conteúdos essenciais para compreender a visão, praticar o cuidado e formar discípulos.</Text>
        <Pressable onPress={saveForOffline} style={({ pressed }) => [styles.offlineButton, { backgroundColor: saved ? "#E9F7F0" : colors.surface, borderColor: saved ? "#B6E6CF" : colors.border }, pressed && styles.pressed]}>
          <IconSymbol name={saved ? "checkmark.circle.fill" : "arrow.down.circle.fill"} size={19} color={saved ? "#167C55" : colors.primary} />
          <Text style={[styles.offlineText, { color: saved ? "#167C55" : colors.foreground }]}>{saved ? "Salvo para leitura offline" : "Salvar biblioteca no dispositivo"}</Text>
        </Pressable>
        <View style={styles.list}>
          {CONTENT_MODULES.map((item, index) => {
            const isOpen = selected?.id === item.id;
            return (
              <Pressable key={item.id} onPress={() => setSelected(isOpen ? null : item)} style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: isOpen ? colors.primary + "70" : colors.border }, isOpen && styles.openCard, pressed && styles.pressed]}>
                <View style={styles.cardTop}><View style={[styles.number, { backgroundColor: index === 0 ? "#E9F7F0" : "#F4F0FF" }]}><Text style={[styles.numberText, { color: index === 0 ? "#167C55" : "#7055AA" }]}>{String(index + 1).padStart(2, "0")}</Text></View><Text style={[styles.eyebrow, { color: colors.primary }]}>{item.eyebrow}</Text><Text style={[styles.duration, { color: colors.muted }]}>{item.duration}</Text></View>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text><Text style={[styles.cardSummary, { color: colors.muted }]}>{item.summary}</Text>
                <View style={styles.cardFooter}><Text style={[styles.readMore, { color: colors.primary }]}>{isOpen ? "Fechar leitura" : "Abrir conteúdo"}</Text><IconSymbol name={isOpen ? "chevron.up" : "chevron.right"} size={18} color={colors.primary} /></View>
                {isOpen && <View style={[styles.expanded, { borderTopColor: colors.border }]}><Text style={[styles.body, { color: colors.foreground }]}>{item.body}</Text><View style={[styles.scripture, { backgroundColor: colors.primary + "12" }]}><Text style={[styles.scriptureLabel, { color: colors.primary }]}>LEITURA DE APOIO</Text><Text style={[styles.scriptureText, { color: colors.foreground }]}>{item.scripture}</Text></View><Text style={[styles.practiceLabel, { color: colors.primary }]}>PRÓXIMO PASSO</Text><Text style={[styles.practice, { color: colors.muted }]}>{item.practice}</Text></View>}
              </Pressable>
            );
          })}
        </View>
        {!!materialsQuery.data?.length && <>
          <Text style={[styles.extraKicker, { color: colors.primary }]}>ADICIONADOS PELA EQUIPE</Text>
          {materialsQuery.data.map((material) => <View key={material.id} style={[styles.material, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.materialTop}><IconSymbol name="doc.on.doc.fill" size={17} color={colors.primary} /><Text style={[styles.materialSource, { color: colors.primary }]}>{material.source || "Material publicado"}</Text></View><Text style={[styles.materialTitle, { color: colors.foreground }]}>{material.title}</Text><Text style={[styles.materialSummary, { color: colors.muted }]}>{material.summary || material.content.slice(0, 180)}</Text></View>)}
        </>}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 22, paddingBottom: 36 },
  kicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1.3, marginBottom: 8 },
  title: { fontSize: 29, fontWeight: "800", letterSpacing: -0.6 },
  subtitle: { fontSize: 14, lineHeight: 21, marginTop: 9, maxWidth: 360 },
  offlineButton: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", paddingHorizontal: 13, paddingVertical: 10, borderRadius: 13, borderWidth: 1, marginTop: 18 },
  offlineText: { fontSize: 12, fontWeight: "700" },
  list: { gap: 12, marginTop: 22 },
  card: { borderRadius: 20, borderWidth: 1, padding: 16 },
  openCard: { shadowColor: "#167C55", shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  number: { width: 29, height: 29, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  numberText: { fontSize: 11, fontWeight: "800" },
  eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  duration: { fontSize: 11, marginLeft: "auto" },
  cardTitle: { fontSize: 18, fontWeight: "800", marginTop: 14 },
  cardSummary: { fontSize: 12, lineHeight: 18, marginTop: 5 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16 },
  readMore: { fontSize: 12, fontWeight: "800" },
  expanded: { borderTopWidth: 1, marginTop: 15, paddingTop: 15 },
  body: { fontSize: 13, lineHeight: 21 },
  scripture: { borderRadius: 13, padding: 12, marginTop: 15 },
  scriptureLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 1, marginBottom: 4 },
  scriptureText: { fontSize: 12, fontWeight: "700" },
  practiceLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 1, marginTop: 16, marginBottom: 4 },
  practice: { fontSize: 12, lineHeight: 18 },
  pressed: { opacity: 0.8 },
  extraKicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1.3, marginTop: 28, marginBottom: 10 },
  material: { borderRadius: 18, borderWidth: 1, padding: 14, marginBottom: 10 },
  materialTop: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 9 },
  materialSource: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  materialTitle: { fontSize: 15, fontWeight: "800" },
  materialSummary: { fontSize: 12, lineHeight: 18, marginTop: 5 },
});
