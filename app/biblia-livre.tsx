import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAccessibility } from "@/lib/accessibility-provider";
import { useColors } from "@/hooks/use-colors";

const API = "https://bible.helloao.org/api/por_blj";
const BOOKS = [
  ["GEN", "Gênesis", 50], ["EXO", "Êxodo", 40], ["LEV", "Levítico", 27], ["NUM", "Números", 36], ["DEU", "Deuteronômio", 34], ["JOS", "Josué", 24], ["JDG", "Juízes", 21], ["RUT", "Rute", 4], ["1SA", "1 Samuel", 31], ["2SA", "2 Samuel", 24], ["1KI", "1 Reis", 22], ["2KI", "2 Reis", 25], ["1CH", "1 Crônicas", 29], ["2CH", "2 Crônicas", 36], ["EZR", "Esdras", 10], ["NEH", "Neemias", 13], ["EST", "Ester", 10], ["JOB", "Jó", 42], ["PSA", "Salmos", 150], ["PRO", "Provérbios", 31], ["ECC", "Eclesiastes", 12], ["SNG", "Cânticos", 8], ["ISA", "Isaías", 66], ["JER", "Jeremias", 52], ["LAM", "Lamentações", 5], ["EZK", "Ezequiel", 48], ["DAN", "Daniel", 12], ["HOS", "Oséias", 14], ["JOL", "Joel", 3], ["AMO", "Amós", 9], ["OBA", "Obadias", 1], ["JON", "Jonas", 4], ["MIC", "Miqueias", 7], ["NAM", "Naum", 3], ["HAB", "Habacuque", 3], ["ZEP", "Sofonias", 3], ["HAG", "Ageu", 2], ["ZEC", "Zacarias", 14], ["MAL", "Malaquias", 4], ["MAT", "Mateus", 28], ["MRK", "Marcos", 16], ["LUK", "Lucas", 24], ["JHN", "João", 21], ["ACT", "Atos", 28], ["ROM", "Romanos", 16], ["1CO", "1 Coríntios", 16], ["2CO", "2 Coríntios", 13], ["GAL", "Gálatas", 6], ["EPH", "Efésios", 6], ["PHP", "Filipenses", 4], ["COL", "Colossenses", 4], ["1TH", "1 Tessalonicenses", 5], ["2TH", "2 Tessalonicenses", 3], ["1TI", "1 Timóteo", 6], ["2TI", "2 Timóteo", 4], ["TIT", "Tito", 3], ["PHM", "Filemom", 1], ["HEB", "Hebreus", 13], ["JAS", "Tiago", 5], ["1PE", "1 Pedro", 5], ["2PE", "2 Pedro", 3], ["1JN", "1 João", 5], ["2JN", "2 João", 1], ["3JN", "3 João", 1], ["JUD", "Judas", 1], ["REV", "Apocalipse", 22],
] as const;

type Verse = { type: string; number: number; content: string[] };
type ChapterResponse = { book: { name: string }; chapter: { number: number; content: Verse[] }; numberOfVerses: number };

export default function BibliaLivreScreen() {
  const colors = useColors();
  const { textScale } = useAccessibility();
  const [bookIndex, setBookIndex] = useState(0);
  const [chapter, setChapter] = useState(1);
  const [verse, setVerse] = useState<number | null>(null);
  const [data, setData] = useState<ChapterResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookMenu, setBookMenu] = useState(false);
  const [chapterMenu, setChapterMenu] = useState(false);
  const selectedBook = BOOKS[bookIndex];

  async function loadChapter(nextBook = selectedBook, nextChapter = chapter) {
    setLoading(true); setError("");
    const url = `${API}/${nextBook[0]}/${nextChapter}.json`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Não foi possível carregar o capítulo.");
      const result = await response.json() as ChapterResponse;
      setData(result); setVerse(null);
      await AsyncStorage.setItem(`blivre:${nextBook[0]}:${nextChapter}`, JSON.stringify(result));
    } catch {
      const cached = await AsyncStorage.getItem(`blivre:${nextBook[0]}:${nextChapter}`);
      if (cached) setData(JSON.parse(cached)); else setError("Sem conexão e este capítulo ainda não foi salvo no dispositivo.");
    } finally { setLoading(false); }
  }
  useEffect(() => { void loadChapter(); }, []);
  const chapterOptions = useMemo(() => Array.from({ length: selectedBook[2] }, (_, index) => index + 1), [selectedBook]);
  return <ScreenContainer className="px-5" edges={["top", "left", "right"]}><ScrollView contentContainerStyle={styles.content}>
    <Text style={[styles.kicker, { color: colors.primary }]}>BÍBLIA LIVRE · BLIVRE</Text>
    <Text style={[styles.title, { color: colors.foreground, fontSize: 30 * textScale }]}>Leia a Bíblia</Text>
    <Text style={[styles.subtitle, { color: colors.muted, fontSize: 14 * textScale }]}>Escolha livro, capítulo e versículo. O capítulo completo é carregado da API pública da Bíblia Livre e fica disponível em cache para releitura offline.</Text>
    <Text style={[styles.label, { color: colors.foreground }]}>Livro</Text>
    <Pressable onPress={() => setBookMenu(!bookMenu)} style={[styles.select, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.selectText, { color: colors.foreground }]}>{selectedBook[1]}</Text><Text style={{ color: colors.primary }}>▼</Text></Pressable>
    {bookMenu && <View style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.border }]}>{BOOKS.map((book, index) => <Pressable key={book[0]} onPress={() => { setBookIndex(index); setChapter(1); setBookMenu(false); void loadChapter(book, 1); }} style={styles.menuItem}><Text style={[styles.menuText, { color: colors.foreground, fontSize: 14 * textScale }]}>{book[1]}</Text></Pressable>)}</View>}
    <Text style={[styles.label, { color: colors.foreground }]}>Capítulo</Text>
    <Pressable onPress={() => setChapterMenu(!chapterMenu)} style={[styles.select, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.selectText, { color: colors.foreground }]}>{chapter}</Text><Text style={{ color: colors.primary }}>▼</Text></Pressable>
    {chapterMenu && <View style={[styles.chapterMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>{chapterOptions.map((value) => <Pressable key={value} onPress={() => { setChapter(value); setChapterMenu(false); void loadChapter(selectedBook, value); }} style={styles.chapterItem}><Text style={[styles.menuText, { color: colors.foreground }]}>{value}</Text></Pressable>)}</View>}
    {!!data && <View style={styles.versePicker}><Text style={[styles.label, { color: colors.foreground }]}>Ir para o versículo</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.verseOptions}>{data.chapter.content.filter((item) => item.type === "verse").map((item) => <Pressable key={item.number} onPress={() => setVerse(item.number)} style={[styles.verseButton, { borderColor: verse === item.number ? colors.primary : colors.border, backgroundColor: verse === item.number ? colors.primary + "18" : colors.surface }]}><Text style={{ color: colors.foreground, fontWeight: "800" }}>{item.number}</Text></Pressable>)}</ScrollView></View>}
    {loading && <ActivityIndicator color={colors.primary} size="large" />}
    {!!error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
    {!!data && <View style={[styles.chapterCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.chapterTitle, { color: colors.foreground, fontSize: 21 * textScale }]}>{data.book.name} {data.chapter.number}</Text>{data.chapter.content.filter((item) => item.type === "verse").map((item) => <Text key={item.number} style={[styles.verse, { color: colors.foreground, fontSize: 16 * textScale, lineHeight: 27 * textScale, backgroundColor: verse === item.number ? colors.primary + "18" : "transparent" }]}><Text style={{ color: colors.primary, fontWeight: "800" }}>{item.number} </Text>{item.content.join(" ")}</Text>)}</View>}
    <Pressable onPress={() => void Linking.openURL("https://blivre.org/")} style={[styles.source, { borderColor: colors.primary }]}><Text style={[styles.sourceText, { color: colors.primary }]}>Sobre a licença e a fonte da BLivre</Text></Pressable>
  </ScrollView></ScreenContainer>;
}
const styles = StyleSheet.create({ content: { paddingTop: 24, paddingBottom: 45, gap: 12 }, kicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2 }, title: { fontWeight: "800", marginTop: 4 }, subtitle: { lineHeight: 22, marginBottom: 7 }, label: { fontSize: 13, fontWeight: "800", marginTop: 4 }, select: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, selectText: { fontWeight: "800", fontSize: 15 }, menu: { maxHeight: 260, borderWidth: 1, borderRadius: 12, overflow: "hidden" }, menuItem: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#CBD5D1" }, menuText: { fontWeight: "700" }, chapterMenu: { maxHeight: 180, borderWidth: 1, borderRadius: 12, flexDirection: "row", flexWrap: "wrap", padding: 7, gap: 6 }, chapterItem: { width: 42, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 9, backgroundColor: "#EAF4EF" }, versePicker: { gap: 5 }, verseOptions: { gap: 6 }, verseButton: { minWidth: 38, height: 34, borderWidth: 1, borderRadius: 9, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 }, chapterCard: { borderWidth: 1, borderRadius: 17, padding: 16, marginTop: 4 }, chapterTitle: { fontWeight: "800", marginBottom: 10 }, verse: { paddingVertical: 5, paddingHorizontal: 4, borderRadius: 6 }, error: { padding: 12, lineHeight: 20 }, source: { alignSelf: "flex-start", borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 10 }, sourceText: { fontWeight: "800", fontSize: 13 } });
