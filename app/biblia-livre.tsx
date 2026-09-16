import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAccessibility } from "@/lib/accessibility-provider";
import { useColors } from "@/hooks/use-colors";

const API = "https://bible.helloao.org/api/por_blj";
const BOOKS = [["GEN", "Gênesis", 50], ["EXO", "Êxodo", 40], ["LEV", "Levítico", 27], ["NUM", "Números", 36], ["DEU", "Deuteronômio", 34], ["JOS", "Josué", 24], ["JDG", "Juízes", 21], ["RUT", "Rute", 4], ["1SA", "1 Samuel", 31], ["2SA", "2 Samuel", 24], ["1KI", "1 Reis", 22], ["2KI", "2 Reis", 25], ["1CH", "1 Crônicas", 29], ["2CH", "2 Crônicas", 36], ["EZR", "Esdras", 10], ["NEH", "Neemias", 13], ["EST", "Ester", 10], ["JOB", "Jó", 42], ["PSA", "Salmos", 150], ["PRO", "Provérbios", 31], ["ECC", "Eclesiastes", 12], ["SNG", "Cânticos", 8], ["ISA", "Isaías", 66], ["JER", "Jeremias", 52], ["LAM", "Lamentações", 5], ["EZK", "Ezequiel", 48], ["DAN", "Daniel", 12], ["HOS", "Oséias", 14], ["JOL", "Joel", 3], ["AMO", "Amós", 9], ["OBA", "Obadias", 1], ["JON", "Jonas", 4], ["MIC", "Miqueias", 7], ["NAM", "Naum", 3], ["HAB", "Habacuque", 3], ["ZEP", "Sofonias", 3], ["HAG", "Ageu", 2], ["ZEC", "Zacarias", 14], ["MAL", "Malaquias", 4], ["MAT", "Mateus", 28], ["MRK", "Marcos", 16], ["LUK", "Lucas", 24], ["JHN", "João", 21], ["ACT", "Atos", 28], ["ROM", "Romanos", 16], ["1CO", "1 Coríntios", 16], ["2CO", "2 Coríntios", 13], ["GAL", "Gálatas", 6], ["EPH", "Efésios", 6], ["PHP", "Filipenses", 4], ["COL", "Colossenses", 4], ["1TH", "1 Tessalonicenses", 5], ["2TH", "2 Tessalonicenses", 3], ["1TI", "1 Timóteo", 6], ["2TI", "2 Timóteo", 4], ["TIT", "Tito", 3], ["PHM", "Filemom", 1], ["HEB", "Hebreus", 13], ["JAS", "Tiago", 5], ["1PE", "1 Pedro", 5], ["2PE", "2 Pedro", 3], ["1JN", "1 João", 5], ["2JN", "2 João", 1], ["3JN", "3 João", 1], ["JUD", "Judas", 1], ["REV", "Apocalipse", 22]] as const;
type Book = typeof BOOKS[number];
type Verse = { type: string; number: number; content: string[] };
type ChapterResponse = { book: { name: string }; chapter: { number: number; content: Verse[] }; numberOfVerses: number };

export default function BibliaLivreScreen() {
  const colors = useColors();
  const { textScale } = useAccessibility();
  const [bookIndex, setBookIndex] = useState(0);
  const [chapter, setChapter] = useState(1);
  const [verse, setVerse] = useState(1);
  const [data, setData] = useState<ChapterResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookMenu, setBookMenu] = useState(false);
  const selectedBook = BOOKS[bookIndex];
  const chapterOptions = useMemo(() => Array.from({ length: selectedBook[2] }, (_, index) => index + 1), [selectedBook]);

  async function loadChapter(nextBook: Book = selectedBook, nextChapter = chapter) {
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API}/${nextBook[0]}/${nextChapter}.json`);
      if (!response.ok) throw new Error("request");
      const result = await response.json() as ChapterResponse;
      setData(result); setVerse(1);
      await AsyncStorage.setItem(`blivre:${nextBook[0]}:${nextChapter}`, JSON.stringify(result));
    } catch {
      const cached = await AsyncStorage.getItem(`blivre:${nextBook[0]}:${nextChapter}`);
      if (cached) { setData(JSON.parse(cached)); setVerse(1); }
      else setError("Sem conexão e este capítulo ainda não foi salvo no dispositivo.");
    } finally { setLoading(false); }
  }
  useEffect(() => { void loadChapter(BOOKS[0], 1); }, []);
  const chooseBook = (index: number) => { const next = BOOKS[index]; setBookIndex(index); setChapter(1); setBookMenu(false); void loadChapter(next, 1); };
  const chooseChapter = (value: number) => { setChapter(value); void loadChapter(selectedBook, value); };
  return <ScreenContainer className="px-4" edges={["top", "left", "right"]}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Text style={[styles.kicker, { color: colors.primary }]}>BÍBLIA LIVRE · BLIVRE</Text>
    <Text style={[styles.title, { color: colors.foreground, fontSize: 29 * textScale, lineHeight: 36 * textScale }]}>Leia a Bíblia</Text>
    <Text style={[styles.subtitle, { color: colors.muted, fontSize: 14 * textScale, lineHeight: 21 * textScale }]}>Selecione um livro e deslize os capítulos. O capítulo escolhido aparece imediatamente abaixo.</Text>
    <Text style={[styles.label, { color: colors.foreground }]}>Livro</Text>
    <Pressable onPress={() => setBookMenu((value) => !value)} style={[styles.select, { backgroundColor: colors.surface, borderColor: colors.border }]} accessibilityRole="button"><Text style={[styles.selectText, { color: colors.foreground }]}>{selectedBook[1]}</Text><Text style={{ color: colors.primary, fontSize: 18 }}>{bookMenu ? "▲" : "▼"}</Text></Pressable>
    {bookMenu && <View style={[styles.bookPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}><ScrollView nestedScrollEnabled showsVerticalScrollIndicator style={styles.bookScroll}>{BOOKS.map((book, index) => <Pressable key={book[0]} onPress={() => chooseBook(index)} style={[styles.bookItem, index === bookIndex && { backgroundColor: colors.primary + "20" }]}><Text style={[styles.bookText, { color: colors.foreground, fontSize: 15 * textScale }]}>{book[1]}</Text><Text style={{ color: colors.muted }}>{index < 39 ? "AT" : "NT"}</Text></Pressable>)}</ScrollView></View>}
    <Text style={[styles.label, { color: colors.foreground }]}>Capítulo <Text style={{ color: colors.primary }}>— deslize para o lado</Text></Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chapterOptions}>{chapterOptions.map((value) => <Pressable key={value} onPress={() => chooseChapter(value)} style={[styles.chapterButton, { borderColor: chapter === value ? colors.primary : colors.border, backgroundColor: chapter === value ? colors.primary : colors.surface }]}><Text style={{ color: chapter === value ? "#FFFFFF" : colors.foreground, fontWeight: "800", fontSize: 15 }}>{value}</Text></Pressable>)}</ScrollView>
    {!!data && <View style={styles.versePicker}><Text style={[styles.label, { color: colors.foreground }]}>Versículo — deslize para o lado</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chapterOptions}>{data.chapter.content.filter((item) => item.type === "verse").map((item) => <Pressable key={item.number} onPress={() => setVerse(item.number)} style={[styles.verseButton, { borderColor: verse === item.number ? colors.primary : colors.border, backgroundColor: verse === item.number ? colors.primary : colors.surface }]}><Text style={{ color: verse === item.number ? "#FFFFFF" : colors.foreground, fontWeight: "800" }}>{item.number}</Text></Pressable>)}</ScrollView></View>}
    {loading && <ActivityIndicator color={colors.primary} size="large" style={styles.loading} />}
    {!!error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
    {!!data && <View style={[styles.chapterCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.chapterTitle, { color: colors.foreground, fontSize: 22 * textScale }]}>{data.book.name} {data.chapter.number}</Text>{data.chapter.content.filter((item) => item.type === "verse").map((item) => <Text key={item.number} style={[styles.verseText, { color: colors.foreground, fontSize: 16 * textScale, lineHeight: 27 * textScale, backgroundColor: verse === item.number ? colors.primary + "18" : "transparent" }]}><Text style={{ color: colors.primary, fontWeight: "800" }}>{item.number} </Text>{item.content.join(" ")}</Text>)}</View>}
    <Pressable onPress={() => void Linking.openURL("https://blivre.org/")} style={[styles.source, { borderColor: colors.primary }]}><Text style={[styles.sourceText, { color: colors.primary }]}>Fonte e licença da Bíblia Livre</Text></Pressable>
  </ScrollView></ScreenContainer>;
}
const styles = StyleSheet.create({ content: { paddingTop: 22, paddingBottom: 45, gap: 10 }, kicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2 }, title: { fontWeight: "800", marginTop: 3 }, subtitle: { marginBottom: 4 }, label: { fontSize: 13, fontWeight: "800", marginTop: 7 }, select: { minHeight: 50, borderWidth: 1, borderRadius: 13, paddingHorizontal: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, selectText: { fontWeight: "800", fontSize: 16 }, bookPanel: { height: 285, borderWidth: 1, borderRadius: 13, overflow: "hidden" }, bookScroll: { flex: 1 }, bookItem: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#9CAAA3", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, bookText: { fontWeight: "700" }, chapterOptions: { gap: 8, paddingVertical: 3 }, chapterButton: { minWidth: 48, height: 44, borderWidth: 1, borderRadius: 11, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 }, versePicker: { marginTop: 2 }, verseButton: { minWidth: 42, height: 38, borderWidth: 1, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 }, loading: { marginVertical: 14 }, error: { padding: 12, lineHeight: 20 }, chapterCard: { borderWidth: 1, borderRadius: 17, padding: 16, marginTop: 8 }, chapterTitle: { fontWeight: "800", marginBottom: 12 }, verseText: { paddingVertical: 6, paddingHorizontal: 5, borderRadius: 7 }, source: { alignSelf: "flex-start", borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 10, marginTop: 4 }, sourceText: { fontWeight: "800", fontSize: 13 } });
