import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAccessibility } from "@/lib/accessibility-provider";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function AccessibilityScreen() {
  const colors = useColors();
  const { textScale, setTextScale } = useAccessibility();
  return <ScreenContainer className="px-5" edges={["top", "left", "right"]}><ScrollView contentContainerStyle={styles.content}>
    <Text style={[styles.kicker, { color: colors.primary }]}>ACESSIBILIDADE</Text>
    <Text style={[styles.title, { color: colors.foreground, fontSize: 30 * textScale }]}>Use o app do seu jeito</Text>
    <Text style={[styles.body, { color: colors.muted, fontSize: 15 * textScale }]}>Escolha um tamanho confortável. Os botões de copiar, compartilhar e ouvir também podem apoiar diferentes formas de acesso ao conteúdo.</Text>
    <Text style={[styles.label, { color: colors.foreground, fontSize: 15 * textScale }]}>Tamanho do texto</Text>
    <View style={styles.options}>{([1, 1.2, 1.4] as const).map((value) => <Pressable key={value} onPress={() => setTextScale(value)} accessibilityRole="radio" accessibilityState={{ selected: textScale === value }} style={[styles.option, { borderColor: textScale === value ? colors.primary : colors.border, backgroundColor: textScale === value ? colors.primary + "14" : colors.surface }]}><Text style={[styles.optionText, { color: colors.foreground, fontSize: 14 * value }]}>{value === 1 ? "Padrão" : value === 1.2 ? "Grande" : "Muito grande"}</Text></Pressable>)}</View>
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.cardTitle, { color: colors.foreground, fontSize: 17 * textScale }]}>Para pessoas surdas</Text><Text style={[styles.body, { color: colors.muted, fontSize: 14 * textScale }]}>As respostas ficam disponíveis em texto, podem ser copiadas e compartilhadas. Use o campo de anexos para enviar imagens ou materiais escritos.</Text></View>
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.cardTitle, { color: colors.foreground, fontSize: 17 * textScale }]}>Para pessoas cegas ou com baixa visão</Text><Text style={[styles.body, { color: colors.muted, fontSize: 14 * textScale }]}>Os controles principais têm rótulos para leitor de tela e cada resposta pode ser ouvida pelo botão “Ouvir”. O leitor de tela do seu celular continua controlando a navegação.</Text></View>
  </ScrollView></ScreenContainer>;
}
const styles = StyleSheet.create({ content: { paddingTop: 24, paddingBottom: 40, gap: 16 }, kicker: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2 }, title: { fontWeight: "800", lineHeight: 40 }, body: { lineHeight: 23 }, label: { fontWeight: "800", marginTop: 8 }, options: { flexDirection: "row", flexWrap: "wrap", gap: 9 }, option: { borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, paddingVertical: 11 }, optionText: { fontWeight: "800" }, card: { borderWidth: 1, borderRadius: 17, padding: 16, gap: 7 }, cardTitle: { fontWeight: "800" } });
