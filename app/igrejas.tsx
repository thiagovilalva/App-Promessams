import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { REGIONAL_CHURCHES } from "@/shared/radio-community";
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function IgrejasScreen() {
  const colors = useColors();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const churches = useMemo(() => REGIONAL_CHURCHES.filter(item => normalize(`${item.name} ${item.city} ${item.address}`).includes(normalize(search.trim()))), [search]);
  return <ScreenContainer className="px-4" edges={["top", "left", "right"]}>
    <FlatList data={churches} keyExtractor={item => item.name} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} ListEmptyComponent={<Text style={[styles.description, { color: colors.muted }]}>Nenhuma igreja corresponde à busca.</Text>}
      ListHeaderComponent={<View style={styles.header}><Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/")} accessibilityRole="button" style={styles.back}><Text style={[styles.link, { color: colors.primary }]}>Voltar</Text></Pressable><Text style={[styles.title, { color: colors.foreground }]}>Igrejas</Text><Text style={[styles.description, { color: colors.muted }]}>Convenção Regional Sul-Mato-Grossense da Igreja Adventista da Promessa.</Text><TextInput value={search} onChangeText={setSearch} placeholder="Buscar igreja, cidade ou bairro" placeholderTextColor={colors.muted} accessibilityLabel="Buscar igrejas" style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]} /><Text style={[styles.count, { color: colors.muted }]}>{churches.length} igrejas encontradas</Text></View>}
      renderItem={({ item }) => <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.name, { color: colors.foreground }]}>{item.name}</Text><Text style={[styles.city, { color: colors.primary }]}>{item.city}</Text><Text style={[styles.address, { color: colors.muted }]}>{item.address}</Text><Pressable onPress={() => void Linking.openURL(item.mapUrl)} style={[styles.mapButton, { borderColor: colors.primary }]} accessibilityRole="link"><Text style={[styles.link, { color: colors.primary }]}>Abrir localização no mapa ↗</Text></Pressable></View>}
    />
  </ScreenContainer>;
}
const styles = StyleSheet.create({ header: { paddingTop: 16 }, back: { paddingVertical: 12, alignSelf: "flex-start" }, link: { fontSize: 15, lineHeight: 23, fontWeight: "800" }, title: { fontSize: 30, lineHeight: 38, fontWeight: "800" }, description: { fontSize: 16, lineHeight: 25, marginVertical: 12 }, input: { minHeight: 52, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontSize: 16 }, count: { fontSize: 13, marginVertical: 12 }, content: { paddingBottom: 40 }, card: { borderWidth: 1, borderRadius: 18, padding: 18, marginBottom: 14 }, name: { fontSize: 20, lineHeight: 28, fontWeight: "800" }, city: { fontSize: 15, lineHeight: 22, fontWeight: "700", marginTop: 6 }, address: { fontSize: 16, lineHeight: 25, marginTop: 6 }, mapButton: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 16 } });
