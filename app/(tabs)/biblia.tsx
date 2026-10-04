import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, Pressable, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function BibliaScreen() {
  const router = useRouter();
  const colors = useColors();

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* Cabeçalho da Aba */}
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: colors.foreground }]}>Bíblia e Conteúdos</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Alimento espiritual diário para a sua caminhada</Text>
        </View>

        {/* 1. Devocional Diário (Topo) */}
        <View style={[styles.devotionalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.badgeRow}>
            <View style={[styles.tagBox, { backgroundColor: colors.primary + "18" }]}>
              <IconSymbol name="sparkles" size={14} color={colors.primary} />
              <Text style={[styles.tagText, { color: colors.primary }]}>DEVOCIONAL DIÁRIO</Text>
            </View>
            <Text style={[styles.dateText, { color: colors.muted }]}>Hoje</Text>
          </View>
          <Text style={[styles.devotionalTitle, { color: colors.foreground }]}>Caminhando na Direção certa</Text>
          <Text style={[styles.devotionalVerse, { color: colors.muted }]} numberOfLines={3}>
            "Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho." - Salmos 119:105
          </Text>
          <Pressable 
            onPress={() => router.push("/pao-diario" as any)} 
            style={({ pressed }) => [styles.devotionalButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}
          >
            <Text style={styles.devotionalButtonText}>Ler Devocional Completo</Text>
            <IconSymbol name="arrow.forward" size={16} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* 2. Plano de Leitura Anual (Meio) */}
        <Pressable 
          onPress={() => router.push("/plano-biblico" as any)}
          style={({ pressed }) => [styles.planCard, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}
        >
          <View style={[styles.iconBox, { backgroundColor: "#E9F7F0" }]}>
            <IconSymbol name="book.closed.fill" size={22} color="#167C55" />
          </View>
          <View style={styles.planContent}>
            <Text style={[styles.kicker, { color: colors.primary }]}>PLANO DE LEITURA</Text>
            <Text style={[styles.planTitle, { color: colors.foreground }]}>Leitura Anual da Bíblia</Text>
            <Text style={[styles.planDesc, { color: colors.muted }]}>Acompanhe o cronograma de leitura diária e fortaleça sua fé.</Text>
          </View>
          <IconSymbol name="chevron.right" size={18} color={colors.primary} />
        </Pressable>

        {/* 3. Botão para Acessar a Bíblia Livre (Base) */}
        <Pressable 
          onPress={() => router.push("/biblia-livre" as any)}
          style={({ pressed }) => [styles.bibleButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}
        >
          <View style={styles.bibleButtonInner}>
            <IconSymbol name="book.closed.fill" size={22} color="#FFFFFF" />
            <View style={styles.bibleButtonTextContainer}>
              <Text style={styles.bibleButtonTitle}>Acessar Bíblia Livre</Text>
              <Text style={styles.bibleButtonSubtitle}>Navegue por livros, capítulos e versículos</Text>
            </View>
          </View>
          <IconSymbol name="arrow.forward" size={18} color="#FFFFFF" />
        </Pressable>

      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 24, paddingBottom: 36 },
  headerContainer: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 4 },
  
  // Devocional
  devotionalCard: { borderWidth: 1, borderRadius: 20, padding: 18, marginBottom: 16 },
  badgeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  tagBox: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  dateText: { fontSize: 12, fontWeight: "600" },
  devotionalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 6 },
  devotionalVerse: { fontSize: 13, lineHeight: 20, marginBottom: 16 },
  devotionalButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12 },
  devotionalButtonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 13 },

  // Plano de Leitura
  planCard: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 16, gap: 14 },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  planContent: { flex: 1 },
  kicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2, marginBottom: 2 },
  planTitle: { fontSize: 15, fontWeight: "800", marginBottom: 3 },
  planDesc: { fontSize: 12, lineHeight: 17 },

  // Botão Bíblia Livre
  bibleButton: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 18, padding: 18, marginTop: 4 },
  bibleButtonInner: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  bibleButtonTextContainer: { flex: 1 },
  bibleButtonTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "800", marginBottom: 2 },
  bibleButtonSubtitle: { color: "#E8FAF2", fontSize: 12 },

  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
});