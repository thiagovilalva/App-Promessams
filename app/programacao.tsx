import { useRouter } from "expo-router";
import { FlatList, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { RADIO_PROGRAMS } from "@/shared/radio-community";

export default function ProgramacaoScreen() {
  const colors = useColors();
  const router = useRouter();
  return <ScreenContainer className="px-4" edges={["top", "left", "right"]}>
    <FlatList data={RADIO_PROGRAMS} keyExtractor={item => item.name} contentContainerStyle={styles.content}
      ListHeaderComponent={<View><Pressable accessibilityRole="button" onPress={() => router.replace("/radio-promessa")} style={styles.back}><Text style={[styles.link, { color: colors.primary }]}>Voltar</Text></Pressable><Text style={[styles.title, { color: colors.foreground }]}>Programação</Text><Text style={[styles.description, { color: colors.muted }]}>Acompanhe os programas da semana e participe. Horários conforme a programação informada pela rádio; sujeitos a alterações.</Text></View>}
      renderItem={({ item }) => <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.schedule, { color: colors.primary }]}>{item.schedule}</Text><Text style={[styles.name, { color: colors.foreground }]}>{item.name}</Text><Text style={[styles.host, { color: colors.muted }]}>{item.host}</Text><Pressable onPress={() => void Linking.openURL(item.contactUrl)} accessibilityRole="link" style={[styles.contact, { borderColor: colors.primary }]}><Text style={[styles.link, { color: colors.primary }]}>Falar com o apresentador pelo WhatsApp ↗</Text></Pressable></View>}
    />
  </ScreenContainer>;
}
const styles = StyleSheet.create({ content: { paddingTop: 16, paddingBottom: 40 }, back: { paddingVertical: 12, alignSelf: "flex-start" }, link: { fontSize: 15, lineHeight: 23, fontWeight: "800" }, title: { fontSize: 30, lineHeight: 38, fontWeight: "800" }, description: { fontSize: 16, lineHeight: 25, marginVertical: 16 }, card: { borderWidth: 1, borderRadius: 18, padding: 18, marginBottom: 14 }, schedule: { fontSize: 14, lineHeight: 22, fontWeight: "800" }, name: { fontSize: 22, lineHeight: 30, fontWeight: "800", marginTop: 8 }, host: { fontSize: 16, lineHeight: 24, marginTop: 4 }, contact: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 16 } });
