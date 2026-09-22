import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useMemo, useEffect, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAccessibility } from "@/lib/accessibility-provider";
import { HBJ_COMPARISON, HBJ_HYMNS, HBJ_THEMES, type HbjHymn } from "@/shared/hbj-data";

type Panel = "hymns" | "themes" | "comparison" | "favorites";
const FAVORITES_KEY = "projeto-sementes.hbj.favorites";
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");

export default function HinarioScreen() {
  const colors = useColors();
  const router = useRouter();
  const { textScale } = useAccessibility();
  const [panel, setPanel] = useState<Panel>("hymns");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<HbjHymn | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [fontScale, setFontScale] = useState(1);
  const [readingBackground, setReadingBackground] = useState<"light" | "cream" | "dark">("light");
  const [openTheme, setOpenTheme] = useState<string | null>(null);

  useEffect(() => {
    void AsyncStorage.getItem(FAVORITES_KEY).then((value) => {
      if (value) setFavorites(JSON.parse(value));
    });
  }, []);

  const filteredHymns = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return HBJ_HYMNS;
    return HBJ_HYMNS.filter((hymn) => String(hymn.number).includes(q) || normalize(hymn.title).includes(q) || normalize(hymn.lyrics).includes(q));
  }, [query]);
  const favoriteHymns = useMemo(() => HBJ_HYMNS.filter((hymn) => favorites.includes(hymn.number)), [favorites]);
  const groupedThemes = useMemo(() => {
    const groups = new Map<string, Map<string, typeof HBJ_THEMES>>();
    HBJ_THEMES.forEach((entry) => {
      if (!groups.has(entry.group)) groups.set(entry.group, new Map());
      const topics = groups.get(entry.group)!;
      if (!topics.has(entry.topic)) topics.set(entry.topic, []);
      topics.get(entry.topic)!.push(entry);
    });
    return Array.from(groups.entries()).map(([group, topics]) => ({ group, topics: Array.from(topics.entries()) }));
  }, []);
  const toggleFavorite = (number: number) => {
    const next = favorites.includes(number) ? favorites.filter((item) => item !== number) : [...favorites, number];
    setFavorites(next);
    void AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  };

  if (selected) {
    const isFavorite = favorites.includes(selected.number);
    const readingColors = readingBackground === "dark" ? { background: "#18201C", text: "#F2F7F3", muted: "#B9C8BF" } : readingBackground === "cream" ? { background: "#FFF8E8", text: "#332B1E", muted: "#75664E" } : { background: colors.background, text: colors.foreground, muted: colors.muted };
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]} containerClassName="bg-background">
        <View style={styles.reader}>
          <View style={styles.readerTop}>
            <Pressable onPress={() => setSelected(null)} style={styles.backButton} accessibilityRole="button"><Text style={[styles.back, { color: colors.primary }]}>‹ Voltar à lista</Text></Pressable>
            <Pressable onPress={() => toggleFavorite(selected.number)} style={[styles.favoriteButton, { borderColor: colors.border }]} accessibilityRole="button" accessibilityLabel={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}><Text style={{ fontSize: 22 }}>{isFavorite ? "★" : "☆"}</Text><Text style={[styles.favoriteText, { color: colors.foreground }]}>{isFavorite ? "Favorito" : "Favoritar"}</Text></Pressable>
          </View>
          <Text style={[styles.readerTitle, { color: colors.foreground, fontSize: 25 * textScale }]}>{selected.number}. {selected.title}</Text>
          <View style={[styles.readerTools, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Text style={[styles.toolLabel, { color: colors.muted }]}>Letra</Text>
            <Pressable onPress={() => setFontScale(Math.max(0.85, fontScale - 0.1))} style={styles.toolButton}><Text style={[styles.toolButtonText, { color: colors.foreground }]}>A−</Text></Pressable>
            <Pressable onPress={() => setFontScale(Math.min(1.6, fontScale + 0.1))} style={styles.toolButton}><Text style={[styles.toolButtonText, { color: colors.foreground }]}>A+</Text></Pressable>
            <Pressable onPress={() => setReadingBackground("light")} style={[styles.colorDot, { backgroundColor: "#FFFFFF", borderColor: colors.border }]} accessibilityLabel="Fundo claro" />
            <Pressable onPress={() => setReadingBackground("cream")} style={[styles.colorDot, { backgroundColor: "#FFF8E8", borderColor: colors.border }]} accessibilityLabel="Fundo creme" />
            <Pressable onPress={() => setReadingBackground("dark")} style={[styles.colorDot, { backgroundColor: "#18201C", borderColor: colors.border }]} accessibilityLabel="Fundo escuro" />
          </View>
          <ScrollView style={[styles.lyricsScroll, { backgroundColor: readingColors.background }]} contentContainerStyle={styles.lyricsContent}>
            <Text selectable style={[styles.lyrics, { color: readingColors.text, fontSize: 18 * textScale * fontScale, lineHeight: 29 * textScale * fontScale }]}>{selected.lyrics}</Text>
          </ScrollView>
        </View>
      </ScreenContainer>
    );
  }

  const shownHymns = panel === "favorites" ? favoriteHymns : filteredHymns;
  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <View style={styles.content}>
        <Pressable onPress={() => router.replace("/")} style={styles.homeLink} accessibilityRole="button"><Text style={[styles.back, { color: colors.primary }]}>‹ Voltar para Início</Text></Pressable>
        <Text style={[styles.kicker, { color: colors.primary }]}>BRADO DE JÚBILO</Text>
        <Text style={[styles.title, { color: colors.foreground, fontSize: 29 * textScale }]}>Hinário HBJ</Text>
        <Text style={[styles.subtitle, { color: colors.muted, fontSize: 14 * textScale }]}>HBJ Novo · leitura offline com busca por número, título ou palavra da letra.</Text>
        <View style={styles.tabs}>
          {([['hymns', 'Todos os hinos'], ['themes', 'Índice temático'], ['comparison', 'BJ antigo × HBJ'], ['favorites', `Favoritos (${favorites.length})`]] as [Panel, string][]).map(([value, label]) => <Pressable key={value} onPress={() => setPanel(value)} style={[styles.tab, { borderColor: panel === value ? colors.primary : colors.border, backgroundColor: panel === value ? colors.primary + "15" : colors.surface }]}><Text style={[styles.tabText, { color: panel === value ? colors.primary : colors.foreground }]}>{label}</Text></Pressable>)}
        </View>
        {panel === "hymns" || panel === "favorites" ? <>
          <TextInput value={query} onChangeText={setQuery} placeholder="Buscar por número, título ou palavra da letra..." placeholderTextColor={colors.muted} style={[styles.search, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border, fontSize: 15 * textScale }]} accessibilityLabel="Pesquisar no hinário" />
          <Text style={[styles.count, { color: colors.muted }]}>{shownHymns.length} hino(s)</Text>
          <FlatList data={shownHymns} keyExtractor={(item) => String(item.number)} contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled" renderItem={({ item }) => <Pressable onPress={() => setSelected(item)} style={({ pressed }) => [styles.hymnRow, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]} accessibilityRole="button"><View style={[styles.hymnNumber, { backgroundColor: colors.primary + "18" }]}><Text style={[styles.hymnNumberText, { color: colors.primary }]}>{item.number}</Text></View><Text style={[styles.hymnTitle, { color: colors.foreground, fontSize: 15 * textScale }]}>{item.title}</Text>{favorites.includes(item.number) ? <Text style={styles.star}>★</Text> : <Text style={[styles.chevron, { color: colors.primary }]}>›</Text>}</Pressable>} ListEmptyComponent={<Text style={[styles.empty, { color: colors.muted }]}>Nenhum hino encontrado.</Text>} />
        </> : panel === "themes" ? <ScrollView contentContainerStyle={styles.indexList}>{groupedThemes.map(({ group, topics }) => <View key={group}><Text style={[styles.themeGroup, { color: colors.primary }]}>{group}</Text>{topics.map(([topic, entries]) => { const key = `${group}-${topic}`; const isOpen = openTheme === key; return <View key={key} style={[styles.themeBlock, { borderColor: colors.border, backgroundColor: colors.surface }]}><Pressable onPress={() => setOpenTheme(isOpen ? null : key)} style={styles.themeHeader}><View style={styles.themeHeaderText}><Text numberOfLines={2} style={[styles.themeTopic, { color: colors.foreground }]}>{topic}</Text><Text style={[styles.themeCount, { color: colors.muted }]}>{entries.length} hino(s)</Text></View><Text style={[styles.themeChevron, { color: colors.primary }]}>{isOpen ? "⌃" : "⌄"}</Text></Pressable>{isOpen && entries.map((entry) => <Pressable key={`${key}-${entry.number}`} onPress={() => { const hymn = HBJ_HYMNS.find((item) => item.number === entry.number); if (hymn) setSelected(hymn); }} style={[styles.themeHymn, { borderTopColor: colors.border }]}><Text style={[styles.themeHymnNumber, { color: colors.primary }]}>{entry.number}</Text><Text style={[styles.indexTitle, { color: colors.foreground }]}>{entry.title}</Text></Pressable>)}</View>; })}</View>)}</ScrollView> : <ScrollView contentContainerStyle={styles.indexList}>{HBJ_COMPARISON.map((entry) => <Pressable key={`${entry.oldNumber}-${entry.newNumber}`} onPress={() => { const hymn = HBJ_HYMNS.find((item) => item.number === entry.newNumber); if (hymn) setSelected(hymn); }} style={[styles.indexRow, { borderBottomColor: colors.border }]}><Text style={[styles.indexMeta, { color: colors.primary }]}>BJ {entry.oldNumber} → HBJ Novo {entry.newNumber}</Text><Text style={[styles.indexTitle, { color: colors.foreground }]}>{entry.title}</Text></Pressable>)}</ScrollView>}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingTop: 22 }, homeLink: { paddingVertical: 4, marginBottom: 10 }, kicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1.3 }, title: { fontWeight: "800", marginTop: 4 }, subtitle: { lineHeight: 21, marginTop: 8, marginBottom: 14 }, tabs: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 12 }, tab: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 9 }, tabText: { fontSize: 11, fontWeight: "800" }, search: { minHeight: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 15 }, count: { fontSize: 12, fontWeight: "700", marginTop: 13, marginBottom: 6 }, list: { paddingBottom: 30, gap: 8 }, hymnRow: { minHeight: 58, borderRadius: 14, borderWidth: 1, padding: 10, flexDirection: "row", alignItems: "center", gap: 11 }, hymnNumber: { width: 40, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" }, hymnNumberText: { fontWeight: "900" }, hymnTitle: { flex: 1, fontWeight: "700" }, chevron: { fontSize: 27, lineHeight: 27 }, star: { color: "#C38716", fontSize: 20 }, empty: { paddingVertical: 30, textAlign: "center" }, reader: { flex: 1, paddingHorizontal: 16, paddingTop: 16 }, readerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, backButton: { paddingVertical: 8, paddingRight: 12 }, back: { fontWeight: "800", fontSize: 14 }, favoriteButton: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7 }, favoriteText: { fontSize: 12, fontWeight: "800" }, readerTitle: { fontWeight: "800", marginTop: 16, marginBottom: 12 }, readerTools: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 14, padding: 8, marginBottom: 10 }, toolLabel: { fontSize: 12, fontWeight: "700", marginRight: "auto" }, toolButton: { paddingHorizontal: 7, paddingVertical: 5 }, toolButtonText: { fontSize: 16, fontWeight: "800" }, colorDot: { width: 23, height: 23, borderRadius: 12, borderWidth: 1 }, lyricsScroll: { flex: 1, borderRadius: 14 }, lyricsContent: { padding: 18, paddingBottom: 40 }, lyrics: { fontWeight: "500" }, indexList: { paddingBottom: 40 }, indexRow: { paddingVertical: 12, borderBottomWidth: 1 }, indexMeta: { fontSize: 11, fontWeight: "800", marginBottom: 3 }, indexTitle: { fontSize: 15, fontWeight: "700" }, themeGroup: { fontSize: 17, fontWeight: "900", marginTop: 16, marginBottom: 8 }, themeBlock: { borderWidth: 1, borderRadius: 14, marginBottom: 8, overflow: "hidden" }, themeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 13 }, themeHeaderText: { flex: 1, minWidth: 0, paddingRight: 8 }, themeTopic: { fontSize: 15, fontWeight: "800", flexShrink: 1 }, themeCount: { fontSize: 11, marginTop: 3 }, themeChevron: { fontSize: 22, fontWeight: "800" }, themeHymn: { flexDirection: "row", gap: 10, alignItems: "center", borderTopWidth: 1, paddingHorizontal: 13, paddingVertical: 11 }, themeHymnNumber: { width: 34, fontWeight: "900" }, pressed: { opacity: 0.75, transform: [{ scale: 0.985 }] },
});
