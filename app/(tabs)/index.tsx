import { useRouter } from "expo-router";
import { Linking, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useThemeContext } from "@/lib/theme-provider";
import { useRadio } from "@/lib/radio-provider";

const principles = [
  { id: "quem-nao-e-jesus", icon: "auto-stories", title: "Quem não é Jesus", text: "Estudo sobre as percepções erradas que as pessoas têm de Jesus.", route: "/quem-nao-e-jesus" },
  { id: "comunhao-e-cultos", icon: "groups", title: "Comunhão e Cultos", text: "Nossos encontros para adorar e caminhar juntos.", route: "/comunhao-e-cultos" },
];

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { colorScheme, setColorScheme } = useThemeContext();
  const { playing: radioPlaying, isBuffering: radioBuffering, toggle: toggleRadio } = useRadio();

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* Cabeçalho */}
        <View style={styles.topline}>
          <Image source={require("@/assets/images/projeto-sementes-logo.png")} style={styles.brandMark} resizeMode="contain" accessibilityLabel="Símbolo da Igreja" />
          <View><Text style={[styles.brandName, { color: colors.foreground }]}>PromessaMS</Text><Text style={[styles.brandCaption, { color: colors.muted }]}>Igreja viva no Modo Missão</Text></View>
          <View style={styles.topActions}><Pressable onPress={() => setColorScheme(colorScheme === "light" ? "dark" : "light")} style={[styles.themeButton, { borderColor: colors.border, backgroundColor: colors.surface }]} accessibilityLabel="Alternar modo claro e escuro"><Text style={[styles.themeButtonText, { color: colors.foreground }]}>{colorScheme === "light" ? "Escuro" : "Claro"}</Text></Pressable><Pressable onPress={() => router.push("/acessibilidade")} style={[styles.accessibilityButton, { borderColor: colors.border, backgroundColor: colors.surface }]} accessibilityRole="button" accessibilityLabel="Abrir acessibilidade"><IconSymbol name="accessibility" size={16} color={colors.foreground} /></Pressable></View>
        </View>

        {/* Hero Section */}
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <View style={styles.heroGlow} />
          <Text style={styles.heroEyebrow}>BEM-VINDO À IGREJA ADVENTISTA DA PROMESSA</Text>
          <Text style={styles.heroTitle}>Uma igreja viva e no Modo Missão.</Text>
          <Text style={styles.heroText}>Acompanhe nossos conteúdos, participe dos ministérios e conecte-se com a família promessista no Mato Grosso do Sul.</Text>
          <Pressable onPress={() => router.push("/projeto-sementes")} style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}>
            <Text style={[styles.heroButtonText, { color: colors.primary }]}>Conheça o Projeto Sementes</Text>
            <IconSymbol name="arrow.forward" size={18} color={colors.primary} />
          </Pressable>
        </View>

        {/* Acesso Rápido - 2 Colunas Proporcionais */}
        <View style={styles.sectionHeader}><View><Text style={[styles.kicker, { color: colors.primary }]}>ACESSO RÁPIDO</Text><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Nossos Recursos</Text></View></View>
        <View style={styles.quickGrid}>
          
          {/* Card da Bíblia */}
          <Pressable onPress={() => router.push("/biblia")} style={({ pressed }) => [styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}>
            <View style={[styles.iconBox, { backgroundColor: "#E9F7F0" }]}><IconSymbol name="book.closed.fill" size={22} color="#167C55" /></View>
            <Text style={[styles.quickTitle, { color: colors.foreground }]}>Bíblia</Text>
            <Text style={[styles.quickText, { color: colors.muted }]}>Leitura e devocionais.</Text>
          </Pressable>

          {/* Card da Rádio (Ajustado para formato vertical proporcional) */}
          <Pressable onPress={toggleRadio} style={({ pressed }) => [styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Ouvir Rádio da Promessa">
            <View style={styles.radioCardHeader}>
              <Image source={require("@/assets/images/radio-da-promessa-correta.jpg")} style={styles.radioIconVertical} accessibilityLabel="Rádio" />
              <View style={[styles.miniPlayBadge, { backgroundColor: colors.primary }]}>
                <IconSymbol name={radioPlaying ? "stop.fill" : "play.fill"} size={12} color="#FFFFFF" />
              </View>
            </View>
            <Text style={[styles.quickTitle, { color: colors.foreground }]}>Rádio da Promessa</Text>
            <Text style={[styles.quickText, { color: colors.muted }]} numberOfLines={2}>
              {radioBuffering ? "Conectando..." : radioPlaying ? "Ao vivo agora" : "Toque para ouvir"}
            </Text>
          </Pressable>

        </View>

        {/* O Que Nos Guia */}
        <Text style={[styles.kicker, { color: colors.primary, marginTop: 26 }]}>O QUE NOS GUIA</Text>
        {principles.map((item) => (
          <Pressable key={item.id} onPress={() => router.push(item.route as any)} style={({ pressed }) => [styles.principle, { borderBottomColor: colors.border }, pressed && styles.pressed]}>
            <View style={[styles.smallIcon, { backgroundColor: colors.primary + "18" }]}><IconSymbol name={item.icon as any} size={20} color={colors.primary} /></View>
            <View style={styles.principleBody}><Text style={[styles.principleTitle, { color: colors.foreground }]}>{item.title}</Text><Text style={[styles.principleText, { color: colors.muted }]}>{item.text}</Text></View>
            <IconSymbol name="chevron.right" size={18} color={colors.primary} />
          </Pressable>
        ))}

      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 18, paddingBottom: 36 },
  topline: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 18 },
  topActions: { marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 7 },
  themeButton: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  accessibilityButton: { width: 32, height: 32, borderWidth: 1, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  themeButtonText: { fontSize: 10, fontWeight: "800" },
  brandMark: { width: 38, height: 38, borderRadius: 13 },
  brandName: { fontSize: 17, fontWeight: "800", letterSpacing: -0.2 },
  brandCaption: { fontSize: 11, marginTop: 1 },
  hero: { padding: 24, borderRadius: 28, overflow: "hidden", marginBottom: 26 },
  heroGlow: { position: "absolute", width: 180, height: 180, borderRadius: 100, right: -65, top: -70, backgroundColor: "#FFFFFF20" },
  heroEyebrow: { color: "#D7F4E6", fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 10 },
  heroTitle: { color: "#FFFFFF", fontSize: 30, lineHeight: 35, fontWeight: "800", maxWidth: 310, letterSpacing: -0.7 },
  heroText: { color: "#E8FAF2", fontSize: 14, lineHeight: 21, marginTop: 12, maxWidth: 315 },
  heroButton: { backgroundColor: "#FFFFFF", borderRadius: 14, paddingVertical: 13, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 22, maxWidth: 210 },
  heroButtonText: { fontWeight: "800", fontSize: 13 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 },
  kicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1.3, marginBottom: 5 },
  sectionTitle: { fontSize: 22, fontWeight: "800", letterSpacing: -0.4 },
  quickGrid: { flexDirection: "row", gap: 12 },
  quickCard: { flex: 1, borderRadius: 18, borderWidth: 1, padding: 14, minHeight: 146, justifyContent: "space-between" },
  iconBox: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 13 },
  quickTitle: { fontSize: 15, fontWeight: "800", marginBottom: 3 },
  quickText: { fontSize: 12, lineHeight: 17 },
  radioCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 13 },
  radioIconVertical: { width: 42, height: 42, borderRadius: 12 },
  miniPlayBadge: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  principle: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  smallIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  principleBody: { flex: 1 },
  principleTitle: { fontSize: 14, fontWeight: "800", marginBottom: 4 },
  principleText: { fontSize: 12, lineHeight: 18 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
});