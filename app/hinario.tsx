import { useMemo, useState } from "react";
import { FlatList, Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAccessibility } from "@/lib/accessibility-provider";
import { HYMN_INDEX, type HymnIndexItem } from "@/shared/hymn-index";

export default function HinarioScreen() {
  const colors = useColors();
  const { textScale } = useAccessibility();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<HymnIndexItem | null>(null);
  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    if (!normalized) return HYMN_INDEX.slice(0, 30);
    return HYMN_INDEX.filter(
      (hymn) =>
        String(hymn.number).includes(normalized) ||
        hymn.title.toLocaleLowerCase("pt-BR").includes(normalized),
    ).slice(0, 80);
  }, [query]);

  const openHymn = async (hymn: HymnIndexItem) => {
    setSelected(hymn);
    await Linking.openURL(hymn.url);
  };

  if (selected) {
    return (
      <ScreenContainer className="px-5" edges={["top", "left", "right", "bottom"]}>
        <View style={styles.reader}>
          <Pressable
            onPress={() => setSelected(null)}
            accessibilityRole="button"
            accessibilityLabel="Voltar para a busca do hinário"
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Text style={[styles.back, { color: colors.primary }]}>‹ Voltar ao hinário</Text>
          </Pressable>
          <Text
            style={[styles.readerTitle, { color: colors.foreground, fontSize: 22 * textScale }]}
          >
            {selected.number} · {selected.title}
          </Text>
          <Text style={[styles.readerText, { color: colors.muted, fontSize: 15 * textScale }]}
          >
            A letra completa foi aberta no navegador para garantir compatibilidade com celular e computador.
          </Text>
          <Pressable
            onPress={() => Linking.openURL(selected.url)}
            accessibilityRole="button"
            accessibilityLabel={`Abrir novamente a letra do hino ${selected.number}`}
            style={({ pressed }) => [
              styles.openButton,
              { backgroundColor: colors.primary },
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.openButtonText}>Abrir letra novamente</Text>
          </Pressable>
          <Text style={[styles.readerHint, { color: colors.muted, fontSize: 13 * textScale }]}
          >
            Use o botão voltar do navegador para retornar ao aplicativo.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <View style={styles.content}>
        <Text style={[styles.kicker, { color: colors.primary }]}>BRADO DE JÚBILO</Text>
        <Text style={[styles.title, { color: colors.foreground, fontSize: 29 * textScale }]}>Hinário Promessista</Text>
        <Text style={[styles.subtitle, { color: colors.muted, fontSize: 14 * textScale }]}>Pesquise por número ou título. Ao tocar em um hino, a letra completa será aberta no navegador do dispositivo.</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por número ou título..."
          placeholderTextColor={colors.muted}
          style={[styles.search, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border, fontSize: 15 * textScale }]}
          accessibilityLabel="Pesquisar hinos"
        />
        <Text style={[styles.count, { color: colors.muted }]}>{query ? `${results.length} resultado(s)` : "Hinos recentes e mais acessados"}</Text>
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.number)}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              onPress={() => void openHymn(item)}
              style={({ pressed }) => [styles.hymnRow, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Abrir hino ${item.number}, ${item.title}`}
            >
              <View style={[styles.hymnNumber, { backgroundColor: colors.primary + "18" }]}>
                <Text style={[styles.hymnNumberText, { color: colors.primary }]}>{item.number}</Text>
              </View>
              <Text style={[styles.hymnTitle, { color: colors.foreground, fontSize: 15 * textScale }]}>{item.title}</Text>
              <Text style={[styles.chevron, { color: colors.primary }]}>›</Text>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={[styles.empty, { color: colors.muted }]}>Nenhum hino encontrado. Tente outro número ou parte do título.</Text>}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingTop: 22 },
  kicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1.3 },
  title: { fontWeight: "800", marginTop: 4 },
  subtitle: { lineHeight: 21, marginTop: 8, marginBottom: 14 },
  search: { minHeight: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 15 },
  count: { fontSize: 12, fontWeight: "700", marginTop: 13, marginBottom: 6 },
  list: { paddingBottom: 30, gap: 8 },
  hymnRow: { minHeight: 58, borderRadius: 14, borderWidth: 1, padding: 10, flexDirection: "row", alignItems: "center", gap: 11 },
  hymnNumber: { width: 40, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  hymnNumberText: { fontWeight: "900" },
  hymnTitle: { flex: 1, fontWeight: "700" },
  chevron: { fontSize: 27, lineHeight: 27 },
  empty: { paddingVertical: 30, textAlign: "center", lineHeight: 21 },
  reader: { flex: 1, paddingTop: 22 },
  backButton: { alignSelf: "flex-start", paddingVertical: 7, paddingRight: 12 },
  back: { fontWeight: "800", fontSize: 14 },
  readerTitle: { fontWeight: "800", marginTop: 18 },
  readerText: { lineHeight: 23, marginTop: 16 },
  openButton: { alignSelf: "flex-start", borderRadius: 14, paddingHorizontal: 18, paddingVertical: 14, marginTop: 24 },
  openButtonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  readerHint: { lineHeight: 20, marginTop: 14 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.985 }] },
});
