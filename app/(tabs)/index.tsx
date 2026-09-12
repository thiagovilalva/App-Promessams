import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

const principles = [
  { icon: "auto-stories", title: "Palavra no centro", text: "A semente é a Palavra de Deus; ela é recebida, compreendida e praticada." },
  { icon: "groups", title: "Todos são enviados", text: "Cada discípulo pode orar, acolher, testemunhar, servir e discipular." },
  { icon: "spa", title: "Cuidado contínuo", text: "Acompanhamos pessoas até a maturidade, sem reduzir missão a números." },
];

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.topline}>
          <View style={styles.brandMark}><Text style={styles.brandSeed}>S</Text></View>
          <View><Text style={[styles.brandName, { color: colors.foreground }]}>Projeto Sementes</Text><Text style={[styles.brandCaption, { color: colors.muted }]}>Igreja viva no Modo Missão</Text></View>
        </View>

        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <View style={styles.heroGlow} />
          <Text style={styles.heroEyebrow}>MULTIPLICANDO VIDAS</Text>
          <Text style={styles.heroTitle}>Uma fé que cria raízes e dá fruto.</Text>
          <Text style={styles.heroText}>Aprenda, reflita e encontre próximos passos para viver a missão de Jesus na igreja local.</Text>
          <Pressable onPress={() => router.push("/chat")} style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}>
            <Text style={[styles.heroButtonText, { color: colors.primary }]}>Conversar com o guia</Text>
            <IconSymbol name="arrow.forward" size={18} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.sectionHeader}><View><Text style={[styles.kicker, { color: colors.primary }]}>COMECE POR AQUI</Text><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Uma jornada simples</Text></View><Pressable onPress={() => router.push("/conteudos")}><Text style={[styles.seeAll, { color: colors.primary }]}>Ver tudo</Text></Pressable></View>
        <View style={styles.quickGrid}>
          <Pressable onPress={() => router.push("/conteudos")} style={({ pressed }) => [styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}>
            <View style={[styles.iconBox, { backgroundColor: "#E9F7F0" }]}><IconSymbol name="book.closed.fill" size={22} color="#167C55" /></View>
            <Text style={[styles.quickTitle, { color: colors.foreground }]}>Ler conteúdos</Text><Text style={[styles.quickText, { color: colors.muted }]}>Base teológica e prática para a igreja local.</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/chat")} style={({ pressed }) => [styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}>
            <View style={[styles.iconBox, { backgroundColor: "#FFF1DE" }]}><IconSymbol name="bubble.left.and.bubble.right.fill" size={22} color="#B66A12" /></View>
            <Text style={[styles.quickTitle, { color: colors.foreground }]}>Perguntar</Text><Text style={[styles.quickText, { color: colors.muted }]}>Tire dúvidas e transforme ideias em ação.</Text>
          </Pressable>
        </View>

        <Text style={[styles.kicker, { color: colors.primary, marginTop: 26 }]}>O QUE NOS GUIA</Text>
        {principles.map((item) => (
          <View key={item.title} style={[styles.principle, { borderBottomColor: colors.border }]}>
            <View style={[styles.smallIcon, { backgroundColor: colors.primary + "18" }]}><IconSymbol name={item.icon as any} size={20} color={colors.primary} /></View>
            <View style={styles.principleBody}><Text style={[styles.principleTitle, { color: colors.foreground }]}>{item.title}</Text><Text style={[styles.principleText, { color: colors.muted }]}>{item.text}</Text></View>
          </View>
        ))}

        <Pressable onPress={() => router.push("/ofertas")} style={({ pressed }) => [styles.offerBanner, { backgroundColor: "#FFF7EA", borderColor: "#F3D9AF" }, pressed && styles.pressed]}>
          <View style={[styles.offerIcon, { backgroundColor: "#F8E3BF" }]}><IconSymbol name="heart.fill" size={20} color="#A76418" /></View>
          <View style={styles.offerCopy}><Text style={[styles.offerTitle, { color: colors.foreground }]}>Apoie o campo</Text><Text style={[styles.offerText, { color: colors.muted }]}>Conheça a chave PIX para apoiar a Convenção Regional Sul-Mato-Grossense.</Text></View><IconSymbol name="chevron.right" size={20} color="#A76418" />
        </Pressable>
        <Text style={[styles.footer, { color: colors.muted }]}>Conteúdo de trabalho da Convenção Regional Sul-Mato-Grossense</Text>
        <Pressable onPress={() => router.push("/admin")} style={styles.teamLink}><IconSymbol name="lock.fill" size={13} color={colors.muted} /><Text style={[styles.teamLinkText, { color: colors.muted }]}>Área da equipe</Text></Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 18, paddingBottom: 36 },
  topline: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 18 },
  brandMark: { width: 38, height: 38, borderRadius: 13, backgroundColor: "#E9F7F0", alignItems: "center", justifyContent: "center" },
  brandSeed: { color: "#167C55", fontSize: 20, fontWeight: "800" },
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
  seeAll: { fontSize: 13, fontWeight: "700", marginBottom: 3 },
  quickGrid: { flexDirection: "row", gap: 12 },
  quickCard: { flex: 1, borderRadius: 18, borderWidth: 1, padding: 14, minHeight: 146 },
  iconBox: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 13 },
  quickTitle: { fontSize: 15, fontWeight: "800", marginBottom: 5 },
  quickText: { fontSize: 12, lineHeight: 17 },
  principle: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  smallIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  principleBody: { flex: 1 },
  principleTitle: { fontSize: 14, fontWeight: "800", marginBottom: 4 },
  principleText: { fontSize: 12, lineHeight: 18 },
  offerBanner: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 18, padding: 14, marginTop: 22 },
  offerIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  offerCopy: { flex: 1 },
  offerTitle: { fontSize: 14, fontWeight: "800", marginBottom: 3 },
  offerText: { fontSize: 11, lineHeight: 16 },
  footer: { textAlign: "center", fontSize: 10, marginTop: 26, lineHeight: 15 },
  teamLink: { alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 5, marginTop: 12, padding: 5 },
  teamLinkText: { fontSize: 10, fontWeight: "700" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
});
