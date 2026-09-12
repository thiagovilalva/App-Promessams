import { useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

const PIX_KEY = "15760349000107";

export default function OfertasScreen() {
  const colors = useColors();
  const [copied, setCopied] = useState(false);

  async function copyKey() {
    if (Platform.OS === "web" && globalThis.navigator?.clipboard) {
      await globalThis.navigator.clipboard.writeText(PIX_KEY);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } else {
      Alert.alert("Chave PIX", PIX_KEY, [{ text: "Entendi" }]);
    }
  }

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={[styles.illustration, { backgroundColor: "#FFF7EA" }]}><View style={styles.sun} /><View style={styles.field}><View style={[styles.stem, { backgroundColor: "#3D9B70" }]} /><View style={[styles.leaf, styles.leftLeaf]} /><View style={[styles.leaf, styles.rightLeaf]} /></View></View>
        <Text style={[styles.kicker, { color: "#A76418" }]}>APOIE A MISSÃO</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Toda semente pode alcançar mais vidas.</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Sua oferta ajuda a Convenção Regional Sul-Mato-Grossense a manter, formar e investir no Projeto Sementes junto às igrejas locais.</Text>
        <View style={[styles.pixCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.pixHeader}><View style={styles.pixBadge}><Text style={styles.pixBadgeText}>PIX</Text></View><Text style={[styles.pixLabel, { color: colors.muted }]}>Chave CNPJ</Text></View><Text style={[styles.key, { color: colors.foreground }]}>{PIX_KEY}</Text><Pressable onPress={copyKey} style={({ pressed }) => [styles.copyButton, { backgroundColor: copied ? "#E9F7F0" : colors.primary }, pressed && styles.pressed]}><IconSymbol name={copied ? "checkmark" : "doc.on.doc.fill"} size={17} color={copied ? "#167C55" : "#FFFFFF"} /><Text style={[styles.copyText, { color: copied ? "#167C55" : "#FFFFFF" }]}>{copied ? "Chave copiada" : "Copiar chave PIX"}</Text></Pressable></View>
        <View style={[styles.info, { backgroundColor: "#F8F7F4" }]}><IconSymbol name="info.circle.fill" size={18} color={colors.primary} /><Text style={[styles.infoText, { color: colors.muted }]}>Confira o nome do recebedor no seu banco antes de confirmar qualquer oferta. O aplicativo não solicita senha, código de segurança ou dados do cartão.</Text></View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Sobre pagamentos pelo app</Text>
        <Text style={[styles.body, { color: colors.muted }]}>Nesta primeira versão, a chave PIX oficial fica disponível para copiar e usar no aplicativo do seu banco. A geração automática de QR Code e cobranças depende da escolha de um provedor de pagamentos e da configuração segura de credenciais pela organização.</Text>
        <View style={[styles.future, { borderColor: "#F3D9AF", backgroundColor: "#FFFDF8" }]}><IconSymbol name="sparkles" size={18} color="#A76418" /><Text style={[styles.futureText, { color: colors.foreground }]}>Próximo passo planejado: QR Code PIX dinâmico e comprovante opcional, com integração oficial.</Text></View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 16, paddingBottom: 36 },
  illustration: { height: 150, borderRadius: 26, alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 23 },
  sun: { width: 72, height: 72, borderRadius: 40, backgroundColor: "#F8D59D", position: "absolute", top: 23, right: 45 },
  field: { width: 240, height: 60, backgroundColor: "#D9EDD6", position: "absolute", bottom: -20, borderRadius: 120, alignItems: "center" },
  stem: { width: 5, height: 78, position: "absolute", bottom: 16, borderRadius: 4 },
  leaf: { width: 34, height: 18, backgroundColor: "#68B27E", borderRadius: 24, position: "absolute", bottom: 57 },
  leftLeaf: { transform: [{ rotate: "-28deg" }], left: 92 },
  rightLeaf: { transform: [{ rotate: "28deg" }], right: 92 },
  kicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1.3, marginBottom: 8 },
  title: { fontSize: 29, lineHeight: 34, fontWeight: "800", letterSpacing: -0.6 },
  subtitle: { fontSize: 14, lineHeight: 21, marginTop: 10 },
  pixCard: { borderWidth: 1, borderRadius: 22, padding: 18, marginTop: 22 },
  pixHeader: { flexDirection: "row", alignItems: "center", gap: 9 },
  pixBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, backgroundColor: "#DFF4E9" },
  pixBadgeText: { color: "#167C55", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  pixLabel: { fontSize: 11 },
  key: { fontSize: 23, fontWeight: "800", letterSpacing: 1.2, marginTop: 18 },
  copyButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 13, marginTop: 17 },
  copyText: { fontSize: 13, fontWeight: "800" },
  info: { flexDirection: "row", gap: 9, borderRadius: 14, padding: 13, marginTop: 14 },
  infoText: { flex: 1, fontSize: 11, lineHeight: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginTop: 29, marginBottom: 7 },
  body: { fontSize: 13, lineHeight: 20 },
  future: { flexDirection: "row", gap: 9, borderWidth: 1, borderRadius: 14, padding: 13, marginTop: 18 },
  futureText: { flex: 1, fontSize: 12, lineHeight: 18, fontWeight: "600" },
  pressed: { opacity: 0.78 },
});
