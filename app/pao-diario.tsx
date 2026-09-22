import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAccessibility } from "@/lib/accessibility-provider";
import { PAO_DIARIO_DAYS, type DevotionalDay } from "@/shared/pao-diario-data";

const READ_KEY = "projeto-sementes.pao-diario.read";
const NOTES_KEY = "projeto-sementes.pao-diario.notes";
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
const themeFor = (day: DevotionalDay) => {
  const text = normalize(`${day.title} ${day.reflection}`);
  if (/orac|intercess|clamor/.test(text)) return "Oração e intercessão";
  if (/discipul|palavra|biblia|escritura/.test(text)) return "Palavra e discipulado";
  if (/lider|equipe|formacao|trein/.test(text)) return "Liderança e formação";
  if (/acolh|relacion|amizade|famil/.test(text)) return "Acolhimento e relacionamentos";
  if (/cuidado|servi|comunidade/.test(text)) return "Cuidado e serviço";
  return "Missão e testemunho";
};

export default function PaoDiarioScreen() {
  const colors = useColors();
  const router = useRouter();
  const { textScale } = useAccessibility();
  const [dayNumber, setDayNumber] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [readDays, setReadDays] = useState<number[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [menuQuery, setMenuQuery] = useState("");
  const day: DevotionalDay = PAO_DIARIO_DAYS[dayNumber - 1];
  const progress = Math.round((readDays.length / PAO_DIARIO_DAYS.length) * 100);
  const filteredDays = useMemo(() => {
    const query = normalize(menuQuery.trim());
    if (!query) return PAO_DIARIO_DAYS;
    return PAO_DIARIO_DAYS.filter((item) => String(item.day).includes(query) || normalize(item.title).includes(query) || normalize(themeFor(item)).includes(query));
  }, [menuQuery]);

  useEffect(() => {
    void Promise.all([AsyncStorage.getItem(READ_KEY), AsyncStorage.getItem(NOTES_KEY)]).then(([read, savedNotes]) => {
      if (read) setReadDays(JSON.parse(read));
      if (savedNotes) setNotes(JSON.parse(savedNotes));
    });
  }, []);

  function selectDay(number: number) {
    setDayNumber(number);
    setMenuOpen(false);
  }
  function toggleRead() {
    const next = readDays.includes(day.day) ? readDays.filter((item) => item !== day.day) : [...readDays, day.day];
    setReadDays(next);
    void AsyncStorage.setItem(READ_KEY, JSON.stringify(next));
  }
  function updateNote(value: string) {
    const next = { ...notes, [String(day.day)]: value };
    setNotes(next);
    void AsyncStorage.setItem(NOTES_KEY, JSON.stringify(next));
  }

  return <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
    <View style={styles.header}><Pressable onPress={() => router.replace("/")} style={[styles.homeButton, { borderColor: colors.border, backgroundColor: colors.surface }]}><Text style={[styles.menuButtonText, { color: colors.primary }]}>‹ Início</Text></Pressable><View style={styles.headerTitle}><Text style={[styles.kicker, { color: colors.primary }]}>DEVOCIONAIS NA PALAVRA</Text><Text numberOfLines={1} style={[styles.title, { color: colors.foreground, fontSize: 28 * textScale }]}>Pão Diário</Text></View><Pressable onPress={() => setMenuOpen(true)} style={[styles.menuButton, { borderColor: colors.border, backgroundColor: colors.surface }]}><Text style={[styles.menuButtonText, { color: colors.primary }]}>☰ Dias</Text></Pressable></View>
    <Text style={[styles.subtitle, { color: colors.muted, fontSize: 14 * textScale }]}>Aproveite Cada Dia!</Text>
    <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.progressTop}><Text style={[styles.progressLabel, { color: colors.foreground }]}>Progresso da leitura</Text><Text style={[styles.progressPercent, { color: colors.primary }]}>{progress}%</Text></View><View style={[styles.progressTrack, { backgroundColor: colors.border }]}><View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.primary }]} /></View><Text style={[styles.progressHint, { color: colors.muted }]}>{readDays.length} de 365 dias concluídos</Text></View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      <View key={`day-${day.day}`} style={[styles.dayCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text key={`label-${day.day}`} style={[styles.dayLabel, { color: colors.primary }]}>DIA {day.day}</Text><Text style={[styles.dayTitle, { color: colors.foreground, fontSize: 22 * textScale }]}>{day.title}</Text><Text style={[styles.themeLabel, { color: colors.primary }]}>Tema: {themeFor(day)}</Text>
        <Text style={[styles.sectionLabel, { color: colors.primary }]}>PALAVRA DE DEUS</Text><Text selectable style={[styles.reading, { color: colors.foreground, backgroundColor: colors.primary + "12", fontSize: 14 * textScale, lineHeight: 22 * textScale }]}>{day.reading}</Text>
        <Text style={[styles.sectionLabel, { color: colors.primary }]}>REFLEXÃO</Text><Text selectable style={[styles.body, { color: colors.foreground, fontSize: 15 * textScale, lineHeight: 24 * textScale }]}>{day.reflection}</Text>
        <Text style={[styles.sectionLabel, { color: colors.primary }]}>PONTO DE ORAÇÃO</Text><Text selectable style={[styles.body, { color: colors.foreground, fontSize: 15 * textScale, lineHeight: 24 * textScale }]}>{day.prayer}</Text>
        <Text style={[styles.sectionLabel, { color: colors.primary }]}>DESAFIO / AÇÃO</Text><Text selectable style={[styles.action, { color: colors.foreground, backgroundColor: colors.primary + "12", fontSize: 15 * textScale, lineHeight: 24 * textScale }]}>{day.action}</Text>
        <Text style={[styles.sectionLabel, { color: colors.primary }]}>MINHAS ANOTAÇÕES</Text><TextInput multiline value={notes[String(day.day)] ?? ""} onChangeText={updateNote} placeholder="Escreva uma breve anotação sobre este dia..." placeholderTextColor={colors.muted} style={[styles.notes, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background, fontSize: 14 * textScale, lineHeight: 22 * textScale }]} textAlignVertical="top" />
        <Pressable onPress={toggleRead} style={[styles.readButton, { backgroundColor: readDays.includes(day.day) ? colors.surface : colors.primary, borderColor: colors.primary }]}><Text style={{ color: readDays.includes(day.day) ? colors.primary : "#FFFFFF", fontWeight: "800" }}>{readDays.includes(day.day) ? "✓ Dia concluído" : "Marcar dia como lido"}</Text></Pressable>
      </View>
      <View style={styles.navigation}><Pressable disabled={day.day === 1} onPress={() => selectDay(day.day - 1)} style={[styles.navButton, { borderColor: colors.border, opacity: day.day === 1 ? 0.4 : 1 }]}><Text style={{ color: colors.primary, fontWeight: "800" }}>‹ Anterior</Text></Pressable><Pressable disabled={day.day === 365} onPress={() => selectDay(day.day + 1)} style={[styles.navButton, { borderColor: colors.primary, opacity: day.day === 365 ? 0.4 : 1 }]}><Text style={{ color: colors.primary, fontWeight: "800" }}>Próximo ›</Text></Pressable></View>
    </ScrollView>
    <Modal visible={menuOpen} animationType="slide" transparent onRequestClose={() => setMenuOpen(false)}><View style={styles.modalBackdrop}><View style={[styles.menuPanel, { backgroundColor: colors.background }]}><View style={styles.menuHeader}><Text style={[styles.menuTitle, { color: colors.foreground }]}>Escolher dia ou tema</Text><Pressable onPress={() => setMenuOpen(false)}><Text style={[styles.close, { color: colors.primary }]}>Fechar</Text></Pressable></View><TextInput value={menuQuery} onChangeText={setMenuQuery} placeholder="Buscar número, tema ou título..." placeholderTextColor={colors.muted} style={[styles.search, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]} /><ScrollView>{filteredDays.map((item) => <Pressable key={item.day} onPress={() => selectDay(item.day)} style={[styles.menuRow, { borderBottomColor: colors.border }]}><View style={[styles.menuNumber, { backgroundColor: colors.primary + "18" }]}><Text style={{ color: colors.primary, fontWeight: "900" }}>{item.day}</Text></View><View style={{ flex: 1 }}><Text style={[styles.menuDayTitle, { color: colors.foreground }]}>{item.title}</Text><Text style={[styles.menuStatus, { color: colors.muted }]}>{themeFor(item)} · {readDays.includes(item.day) ? "Concluído" : "Não lido"}</Text></View></Pressable>)}</ScrollView></View></View></Modal>
  </ScreenContainer>;
}

const styles = StyleSheet.create({ header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingTop: 20, gap: 6 }, headerTitle: { flex: 1, minWidth: 0 }, homeButton: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 9 }, kicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2 }, title: { fontWeight: "800", marginTop: 5 }, subtitle: { marginTop: 8, marginBottom: 12 }, menuButton: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 9 }, menuButtonText: { fontSize: 12, fontWeight: "800" }, progressCard: { borderWidth: 1, borderRadius: 16, padding: 13, marginBottom: 12 }, progressTop: { flexDirection: "row", justifyContent: "space-between" }, progressLabel: { fontSize: 13, fontWeight: "800" }, progressPercent: { fontSize: 15, fontWeight: "900" }, progressTrack: { height: 8, borderRadius: 4, overflow: "hidden", marginTop: 9 }, progressFill: { height: 8, borderRadius: 4 }, progressHint: { fontSize: 11, marginTop: 7 }, scroll: { paddingBottom: 34 }, dayCard: { borderWidth: 1, borderRadius: 20, padding: 16 }, dayLabel: { fontSize: 11, fontWeight: "900", letterSpacing: 1.4 }, dayTitle: { fontWeight: "800", marginTop: 6, marginBottom: 3 }, themeLabel: { fontSize: 12, fontWeight: "700", marginBottom: 5 }, sectionLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 1.1, marginTop: 17, marginBottom: 6 }, reading: { padding: 12, borderRadius: 12 }, body: { marginBottom: 3 }, action: { padding: 12, borderRadius: 12, fontWeight: "700" }, notes: { minHeight: 100, borderWidth: 1, borderRadius: 12, padding: 12 }, readButton: { alignItems: "center", borderWidth: 1, borderRadius: 12, paddingVertical: 12, marginTop: 18 }, navigation: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 }, navButton: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 }, modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }, menuPanel: { height: "85%", borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18 }, menuHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }, menuTitle: { fontSize: 20, fontWeight: "800" }, close: { fontWeight: "800" }, search: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11, marginBottom: 8 }, menuRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11, borderBottomWidth: 1 }, menuNumber: { width: 38, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" }, menuDayTitle: { fontWeight: "700" }, menuStatus: { fontSize: 11, marginTop: 2 } });
