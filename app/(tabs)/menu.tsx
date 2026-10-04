import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, Pressable, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function MenuScreen() {
  const router = useRouter();
  const colors = useColors();

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: colors.foreground }]}>Menu</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Opções e informações da Promessa MS</Text>

        <View style={styles.section}>
          <Pressable 
            onPress={() => router.push("/conta")} 
            style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[styles.iconBox, { backgroundColor: colors.primary + "18" }]}>
              <IconSymbol name="person.fill" size={20} color={colors.primary} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: colors.foreground }]}>Minha Conta</Text>
              <Text style={[styles.menuDesc, { color: colors.muted }]}>Gerencie seu perfil e histórico</Text>
            </View>
            <IconSymbol name="chevron.right" size={18} color={colors.muted} />
          </Pressable>

          <Pressable 
            onPress={() => router.push("/acessibilidade")} 
            style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[styles.iconBox, { backgroundColor: colors.primary + "18" }]}>
              <IconSymbol name="accessibility" size={20} color={colors.primary} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: colors.foreground }]}>Acessibilidade</Text>
              <Text style={[styles.menuDesc, { color: colors.muted }]}>Ajustes de visualização</Text>
            </View>
            <IconSymbol name="chevron.right" size={18} color={colors.muted} />
          </Pressable>

          <Pressable 
            onPress={() => router.push("/politica-privacidade")} 
            style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[styles.iconBox, { backgroundColor: colors.primary + "18" }]}>
              <IconSymbol name="doc.text.fill" size={20} color={colors.primary} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: colors.foreground }]}>Política de Privacidade</Text>
              <Text style={[styles.menuDesc, { color: colors.muted }]}>Como cuidamos dos seus dados</Text>
            </View>
            <IconSymbol name="chevron.right" size={18} color={colors.muted} />
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 24, paddingBottom: 36 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 4, marginBottom: 24 },
  section: { gap: 12 },
  menuItem: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 16, padding: 14, gap: 14 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: "700" },
  menuDesc: { fontSize: 12, marginTop: 2 },
});