import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function MenuScreen() {
  const router = useRouter();
  const colors = useColors();

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: colors.foreground }]}>Menu do App</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Acesse configurações e informações da igreja.</Text>

        <View style={styles.menuList}>
          <Pressable 
            onPress={() => router.push("/conta")} 
            style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <IconSymbol name="person.fill" size={20} color={colors.primary} />
            <Text style={[styles.menuText, { color: colors.foreground }]}>Minha Conta</Text>
            <IconSymbol name="chevron.right" size={16} color={colors.muted} />
          </Pressable>

          <Pressable 
            onPress={() => router.push("/politica-privacidade")} 
            style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <IconSymbol name="doc.text.fill" size={20} color={colors.primary} />
            <Text style={[styles.menuText, { color: colors.foreground }]}>Política de Privacidade</Text>
            <IconSymbol name="chevron.right" size={16} color={colors.muted} />
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 24, paddingBottom: 36 },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 6 },
  subtitle: { fontSize: 14, marginBottom: 24 },
  menuList: { gap: 12 },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16, borderWidth: 1, gap: 14 },
  menuText: { flex: 1, fontSize: 15, fontWeight: "700" },
});