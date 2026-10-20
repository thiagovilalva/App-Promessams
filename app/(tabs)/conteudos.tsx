import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { useEffect, useMemo, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAccessibility } from "@/lib/accessibility-provider";
import { trpc } from "@/lib/trpc";
import { getApiBaseUrl } from "@/constants/oauth";
import { CONTENT_MODULES, type ContentModule } from "@/shared/knowledge";
import { mergeRemoteMaterials, REMOTE_MATERIALS_CACHE_KEY, REMOTE_MATERIALS_SYNC_KEY, type RemoteMaterial } from "@/shared/remote-content";

export default function ConteudosScreen() {
  const colors = useColors();
  const { textScale } = useAccessibility();
  const [selected, setSelected] = useState<ContentModule | null>(null);
  const [section, setSection] = useState<"filosofia" | "projeto" | "ministerios">("filosofia");
  const [saved, setSaved] = useState(false);
  const [cachedMaterials, setCachedMaterials] = useState<RemoteMaterial[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const materialsQuery = trpc.materials.list.useQuery();
  const manifestQuery = trpc.materials.manifest.useQuery(undefined, { retry: false });
  const remoteMaterials = useMemo(() => mergeRemoteMaterials(materialsQuery.data as RemoteMaterial[] | undefined, cachedMaterials), [materialsQuery.data, cachedMaterials]);
  const assetUrl = (url: string) => url.startsWith("/") ? `${getApiBaseUrl()}${url}` : url;

  useEffect(() => {
    AsyncStorage.multiGet([REMOTE_MATERIALS_CACHE_KEY, REMOTE_MATERIALS_SYNC_KEY]).then(([materialsEntry, syncEntry]) => {
      try {
        if (materialsEntry[1]) setCachedMaterials(JSON.parse(materialsEntry[1]) as RemoteMaterial[]);
      } catch { /* cache corrompido: o catálogo local continua disponível */ }
      if (syncEntry[1]) setLastSyncedAt(syncEntry[1]);
    });
  }, []);

  useEffect(() => {
    if (!materialsQuery.data) return;
    const now = new Date().toISOString();
    setCachedMaterials(materialsQuery.data as RemoteMaterial[]);
    setLastSyncedAt(now);
    void AsyncStorage.multiSet([[REMOTE_MATERIALS_CACHE_KEY, JSON.stringify(materialsQuery.data)], [REMOTE_MATERIALS_SYNC_KEY, now]]);
  }, [materialsQuery.data]);
  const visibleModules = useMemo(() => CONTENT_MODULES.filter((item) => section === "filosofia" ? ["filosofia", "distincao", "principios", "lideranca", "filosofia-cristocentrismo", "filosofia-palavra", "filosofia-oracao", "filosofia-relacionamentos", "filosofia-todos-enviados", "filosofia-multiplicacao", "filosofia-contextualizacao", "documento-integral"].includes(item.id) : section === "projeto" ? ["projeto-acolhimento", "jornada", "projeto-discipulados", "projeto-equipes", "igreja-viva", "projeto-cuidado", "projeto-integracao", "projeto-formacao", "projeto-avaliacao", "projeto-multiplicacao", "projeto-territorio", "projeto-documento-integral"].includes(item.id) : ["ministerios-fundamento", "ministerios-alinhamento", "ministerios-principios", "ministerios-governanca", "ministerios-ciclo", "ministerios-areas", "ministerios-capacitacao", "ministerios-mentoria", "ministerios-seguranca", "ministerios-indicadores", "ministerios-apresentacao-integral", "ministerios-documento-integral"].includes(item.id)), [section]);

  async function saveForOffline() {
    await AsyncStorage.setItem("sementes:conteudos", JSON.stringify(CONTENT_MODULES));
    setSaved(true);
    if (selected) Alert.alert("Conteúdo salvo", "Este material já está disponível dentro do app, mesmo sem internet.");
  }

  async function copyText(text: string) {
    await Clipboard.setStringAsync(text);
    Alert.alert("Texto copiado", "O conteúdo foi copiado para a área de transferência.");
  }

  async function shareText(text: string) {
    try { await Share.share({ message: text, title: "Projeto Sementes" }); } catch (error) { console.warn("[Conteúdos] share cancelled", error); }
  }

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={[styles.kicker, { color: colors.primary }]}>BIBLIOTECA SEMENTES</Text>
        <Text style={[styles.title, { color: colors.foreground, fontSize: 29 * textScale, lineHeight: 35 * textScale }]}>Aprenda no seu ritmo.</Text>
        <Text style={[styles.subtitle, { color: colors.muted, fontSize: 14 * textScale, lineHeight: 21 * textScale }]}>Conteúdos essenciais para compreender a visão, praticar o cuidado e formar discípulos.</Text>
        <View style={[styles.sectionChooser, { borderColor: colors.border, backgroundColor: colors.surface }]}><Pressable onPress={() => { setSection("filosofia"); setSelected(null); }} style={[styles.sectionTab, section === "filosofia" && { backgroundColor: colors.primary }]} accessibilityRole="tab" accessibilityState={{ selected: section === "filosofia" }}><Text style={[styles.sectionTabText, { color: section === "filosofia" ? "#FFFFFF" : colors.foreground, fontSize: 13 * textScale }]}>Filosofia da Semente</Text></Pressable><Pressable onPress={() => { setSection("projeto"); setSelected(null); }} style={[styles.sectionTab, section === "projeto" && { backgroundColor: colors.primary }]} accessibilityRole="tab" accessibilityState={{ selected: section === "projeto" }}><Text style={[styles.sectionTabText, { color: section === "projeto" ? "#FFFFFF" : colors.foreground, fontSize: 13 * textScale }]}>Projeto Sementes</Text></Pressable><Pressable onPress={() => { setSection("ministerios"); setSelected(null); }} style={[styles.sectionTab, section === "ministerios" && { backgroundColor: colors.primary }]} accessibilityRole="tab" accessibilityState={{ selected: section === "ministerios" }}><Text style={[styles.sectionTabText, { color: section === "ministerios" ? "#FFFFFF" : colors.foreground, fontSize: 13 * textScale }]}>Ministérios Regionais</Text></Pressable></View>
        <View style={styles.syncRow}><Pressable onPress={saveForOffline} style={({ pressed }) => [styles.offlineButton, { backgroundColor: saved ? "#E9F7F0" : colors.surface, borderColor: saved ? "#B6E6CF" : colors.border }, pressed && styles.pressed]}>
          <IconSymbol name={saved ? "checkmark.circle.fill" : "arrow.down.circle.fill"} size={19} color={saved ? "#167C55" : colors.primary} />
          <Text style={[styles.offlineText, { color: saved ? "#167C55" : colors.foreground }]}>{saved ? "Salvo para leitura offline" : "Salvar biblioteca no dispositivo"}</Text>
        </Pressable><Text style={[styles.syncText, { color: colors.muted }]}>{materialsQuery.isFetching ? "Atualizando conteúdo online…" : lastSyncedAt ? `Última atualização: ${new Date(lastSyncedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}` : "Conteúdo local disponível"}</Text></View>
        <View style={styles.list}>
          {visibleModules.map((item, index) => {
            const isOpen = selected?.id === item.id;
            return (
              <Pressable key={item.id} onPress={() => setSelected(isOpen ? null : item)} style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: isOpen ? colors.primary + "70" : colors.border }, isOpen && styles.openCard, pressed && styles.pressed]}>
                <View style={styles.cardTop}><View style={[styles.number, { backgroundColor: index === 0 ? "#E9F7F0" : "#F4F0FF" }]}><Text style={[styles.numberText, { color: index === 0 ? "#167C55" : "#7055AA" }]}>{String(index + 1).padStart(2, "0")}</Text></View><Text style={[styles.eyebrow, { color: colors.primary }]}>{item.eyebrow}</Text><Text style={[styles.duration, { color: colors.muted }]}>{item.duration}</Text></View>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text><Text style={[styles.cardSummary, { color: colors.muted }]}>{item.summary}</Text>
                <View style={styles.cardFooter}><Text style={[styles.readMore, { color: colors.primary }]}>{isOpen ? "Fechar leitura" : "Abrir conteúdo"}</Text><IconSymbol name={isOpen ? "chevron.up" : "chevron.right"} size={18} color={colors.primary} /></View>
                {isOpen && <View style={[styles.expanded, { borderTopColor: colors.border }]}><Text style={[styles.body, { color: colors.foreground }]}>{item.body}</Text><View style={[styles.scripture, { backgroundColor: colors.primary + "12" }]}><Text style={[styles.scriptureLabel, { color: colors.primary }]}>LEITURA DE APOIO</Text><Text style={[styles.scriptureText, { color: colors.foreground }]}>{item.scripture}</Text></View><Text style={[styles.practiceLabel, { color: colors.primary }]}>PRÓXIMO PASSO</Text><Text style={[styles.practice, { color: colors.muted }]}>{item.practice}</Text><View style={styles.contentActions}><Pressable onPress={() => void copyText(`${item.title}\n\n${item.body}\n\nLeitura de apoio: ${item.scripture}\n\nPróximo passo: ${item.practice}`)} style={[styles.contentAction, { borderColor: colors.border }]}><IconSymbol name="doc.on.doc.fill" size={16} color={colors.primary} /><Text style={[styles.contentActionText, { color: colors.primary }]}>Copiar</Text></Pressable><Pressable onPress={() => void shareText(`${item.title}\n\n${item.body}\n\nLeitura de apoio: ${item.scripture}\n\nPróximo passo: ${item.practice}`)} style={[styles.contentAction, { borderColor: colors.border }]}><IconSymbol name="share" size={16} color={colors.primary} /><Text style={[styles.contentActionText, { color: colors.primary }]}>Compartilhar</Text></Pressable></View></View>}
              </Pressable>
            );
          })}
        </View>
        {!!remoteMaterials.length && <>
          <Text style={[styles.extraKicker, { color: colors.primary }]}>ADICIONADOS PELA EQUIPE</Text>
          {remoteMaterials.map((material) => <View key={material.id} style={[styles.material, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.materialTop}><IconSymbol name="doc.on.doc.fill" size={17} color={colors.primary} /><Text style={[styles.materialSource, { color: colors.primary }]}>{material.source || "Material publicado"}</Text><Text style={[styles.materialVersion, { color: colors.muted }]}>v{material.version}</Text></View><Text style={[styles.materialTitle, { color: colors.foreground }]}>{material.title}</Text><Text style={[styles.materialCategory, { color: colors.primary }]}>{material.category === "pao-diario" ? "Pão Diário" : material.category === "hbj" ? "Hinário HBJ" : material.category === "ministerios" ? "Ministérios Regionais" : material.category === "filosofia" ? "Filosofia da Semente" : material.category === "projeto" ? "Projeto Sementes" : "Outros"}</Text><Text style={[styles.materialSummary, { color: colors.muted }]}>{material.summary || material.content.slice(0, 180)}</Text>{material.assetUrl && material.assetMimeType?.startsWith("image/") && <Image source={{ uri: assetUrl(material.assetUrl) }} style={styles.materialImage} contentFit="cover" cachePolicy="memory-disk" transition={150} accessibilityLabel={material.assetName || material.title} />}{material.assetUrl && !material.assetMimeType?.startsWith("image/") && <Pressable onPress={() => void Linking.openURL(assetUrl(material.assetUrl!))} style={[styles.attachmentLink, { borderColor: colors.border }]}><IconSymbol name="paperclip" size={15} color={colors.primary} /><Text style={[styles.attachmentLinkText, { color: colors.primary }]}>Abrir anexo {material.assetName ? `· ${material.assetName}` : ""}</Text></Pressable>}</View>)}
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
  syncRow: { gap: 6, marginTop: 18 },
  syncText: { fontSize: 10, lineHeight: 15 },
  sectionChooser: { flexDirection: "row", borderWidth: 1, borderRadius: 15, padding: 4, gap: 4, marginTop: 20 },
  sectionTab: { flex: 1, borderRadius: 11, paddingHorizontal: 8, paddingVertical: 11, alignItems: "center", justifyContent: "center" },
  sectionTabText: { fontWeight: "800", textAlign: "center" },
  list: { gap: 12, marginTop: 16 },
  card: { borderRadius: 20, borderWidth: 1, padding: 16 },
  openCard: { shadowColor: "#167C55", shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  number: { width: 29, height: 29, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  numberText: { fontSize: 11, fontWeight: "800" },
  eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  duration: { fontSize: 11, marginLeft: "auto" },
  cardTitle: { fontSize: 20, fontWeight: "800", marginTop: 14 },
  cardSummary: { fontSize: 14, lineHeight: 21, marginTop: 5 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16 },
  readMore: { fontSize: 14, fontWeight: "800" },
  expanded: { borderTopWidth: 1, marginTop: 15, paddingTop: 15 },
  body: { fontSize: 15, lineHeight: 24 },
  contentActions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  contentAction: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 11, paddingHorizontal: 11, paddingVertical: 8 },
  contentActionText: { fontSize: 13, fontWeight: "800" },
  scripture: { borderRadius: 13, padding: 12, marginTop: 15 },
  scriptureLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 1, marginBottom: 4 },
  scriptureText: { fontSize: 12, fontWeight: "700" },
  practiceLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 1, marginTop: 16, marginBottom: 4 },
  practice: { fontSize: 14, lineHeight: 21 },
  pressed: { opacity: 0.8 },
  extraKicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1.3, marginTop: 28, marginBottom: 10 },
  material: { borderRadius: 18, borderWidth: 1, padding: 14, marginBottom: 10 },
  materialTop: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 9 },
  materialSource: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5, flex: 1 },
  materialVersion: { fontSize: 10, fontWeight: "800" },
  materialTitle: { fontSize: 15, fontWeight: "800" },
  materialCategory: { fontSize: 10, fontWeight: "800", marginTop: 5 },
  materialSummary: { fontSize: 12, lineHeight: 18, marginTop: 5 },
  materialImage: { width: "100%", height: 160, borderRadius: 12, marginTop: 12 },
  attachmentLink: { flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, marginTop: 12 },
  attachmentLinkText: { flex: 1, fontSize: 11, fontWeight: "800" },
});
