import { useState } from "react";
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { buildPixPayload, PIX_KEY } from "@/shared/pix";

export default function OfertasScreen() {
  const colors = useColors();
  const [amountDigits, setAmountDigits] = useState("");
  const [copied, setCopied] = useState(false);
  const numericAmount = amountDigits ? Number(amountDigits) / 100 : 0;
  const payload = buildPixPayload(Number.isFinite(numericAmount) && numericAmount > 0 ? numericAmount : undefined);
  const displayedAmount = amountDigits ? (Number(amountDigits) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";

  async function copy(value: string, label: string) {
    if (Platform.OS === "web" && globalThis.navigator?.clipboard) {
      await globalThis.navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } else {
      Alert.alert(label, value, [{ text: "Entendi" }]);
    }
  }

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={[styles.illustration, { backgroundColor: colors.surface }]}><Image source={require("@/assets/images/projeto-missional-horizontal.webp")} style={styles.illustrationImage} resizeMode="contain" accessibilityLabel="Projeto Missional Sementes" /></View>
        <Text style={[styles.kicker, { color: "#A76418" }]}>APOIE A MISSÃO</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Toda semente pode alcançar mais vidas.</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Sua oferta ajuda a Convenção Regional Sul-Mato-Grossense a manter e investir no Projeto Sementes junto às igrejas locais.</Text>
        <View style={[styles.pixCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.pixHeader}><View style={styles.pixBadge}><Text style={styles.pixBadgeText}>PIX</Text></View><Text style={[styles.pixLabel, { color: colors.muted }]}>Oferta Missionária · CNPJ</Text></View>
          <Text style={[styles.key, { color: colors.foreground }]}>{PIX_KEY}</Text>
          <Text style={[styles.helper, { color: colors.muted }]}>Valor opcional para personalizar o QR Code</Text>
          <View style={[styles.amountBox, { borderColor: colors.border }]}><Text style={[styles.currency, { color: colors.muted }]}>R$</Text><TextInput value={displayedAmount} onChangeText={(value) => setAmountDigits(value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 12))} keyboardType="number-pad" placeholder="0,00" placeholderTextColor={colors.muted} style={[styles.amountInput, { color: colors.foreground }]} accessibilityLabel="Valor da oferta em reais" /></View>
          <Text style={[styles.amountHint, { color: colors.muted }]}>Digite somente números: 1000 = R$ 10,00 · 500 = R$ 5,00 · 12020 = R$ 120,20</Text>
          <View style={styles.qrWrap}><QRCode value={payload} size={190} color="#173D2C" backgroundColor="#FFFFFF" quietZone={8} /><Text style={[styles.qrCaption, { color: colors.muted }]}>Aponte a câmera do banco para ofertar</Text></View>
          <Pressable onPress={() => copy(payload, "PIX Copia e Cola")} style={({ pressed }) => [styles.copyButton, { backgroundColor: copied ? "#E9F7F0" : colors.primary }, pressed && styles.pressed]}><IconSymbol name={copied ? "checkmark" : "qrcode"} size={17} color={copied ? "#167C55" : "#FFFFFF"} /><Text style={[styles.copyText, { color: copied ? "#167C55" : "#FFFFFF" }]}>{copied ? "Código copiado" : "Copiar PIX Copia e Cola"}</Text></Pressable>
          <Pressable onPress={() => copy(PIX_KEY, "Chave PIX")} style={({ pressed }) => [styles.keyButton, { borderColor: colors.border }, pressed && styles.pressed]}><IconSymbol name="doc.on.doc.fill" size={16} color={colors.primary} /><Text style={[styles.keyButtonText, { color: colors.foreground }]}>Copiar somente a chave</Text></Pressable>
        </View>
        <View style={[styles.info, { backgroundColor: "#F8F7F4" }]}><IconSymbol name="info.circle.fill" size={18} color={colors.primary} /><Text style={[styles.infoText, { color: colors.muted }]}>Confira o nome do recebedor no seu banco antes de confirmar. O app não solicita senha, código de segurança ou dados do cartão.</Text></View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Transparência e segurança</Text>
        <Text style={[styles.body, { color: colors.muted }]}>O QR Code e o código Copia e Cola são gerados localmente a partir da chave PIX informada pela Convenção. A confirmação acontece somente no aplicativo do seu banco.</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 16, paddingBottom: 36 },
  illustration: { width: "100%", height: 150, borderRadius: 26, marginBottom: 23, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  illustrationImage: { width: "100%", height: "100%" },
  sun: { width: 72, height: 72, borderRadius: 40, backgroundColor: "#F8D59D", position: "absolute", top: 23, right: 45 },
  field: { width: 240, height: 60, backgroundColor: "#D9EDD6", position: "absolute", bottom: -20, borderRadius: 120, alignItems: "center" },
  stem: { width: 5, height: 78, position: "absolute", bottom: 16, borderRadius: 4 },
  leaf: { width: 34, height: 18, backgroundColor: "#68B27E", borderRadius: 24, position: "absolute", bottom: 57 },
  leftLeaf: { transform: [{ rotate: "-28deg" }], left: 92 },
  rightLeaf: { transform: [{ rotate: "28deg" }], right: 92 },
  kicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1.3, marginBottom: 8 },
  title: { fontSize: 32, lineHeight: 39, fontWeight: "800", letterSpacing: -0.6 },
  subtitle: { fontSize: 16, lineHeight: 24, marginTop: 10 },
  pixCard: { borderWidth: 1, borderRadius: 22, padding: 18, marginTop: 22 },
  pixHeader: { flexDirection: "row", alignItems: "center", gap: 9 },
  pixBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, backgroundColor: "#DFF4E9" },
  pixBadgeText: { color: "#167C55", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  pixLabel: { fontSize: 11 },
  key: { fontSize: 23, fontWeight: "800", letterSpacing: 1.2, marginTop: 18 },
  helper: { fontSize: 11, marginTop: 14, marginBottom: 7 },
  amountHint: { fontSize: 11, lineHeight: 16, marginTop: 6 },
  amountBox: { borderWidth: 1, borderRadius: 13, height: 46, flexDirection: "row", alignItems: "center", paddingHorizontal: 12 },
  currency: { fontSize: 13, fontWeight: "700", marginRight: 6 },
  amountInput: { flex: 1, fontSize: 16, fontWeight: "700" },
  qrWrap: { alignItems: "center", paddingVertical: 16 },
  qr: { width: 190, height: 190 },
  qrCaption: { fontSize: 11, marginTop: 8 },
  copyButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 13, marginTop: 2 },
  copyText: { fontSize: 13, fontWeight: "800" },
  keyButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderRadius: 14, paddingVertical: 11, marginTop: 9 },
  keyButtonText: { fontSize: 12, fontWeight: "700" },
  info: { flexDirection: "row", gap: 9, borderRadius: 14, padding: 13, marginTop: 14 },
  infoText: { flex: 1, fontSize: 11, lineHeight: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginTop: 29, marginBottom: 7 },
  body: { fontSize: 13, lineHeight: 20 },
  future: { flexDirection: "row", gap: 9, borderWidth: 1, borderRadius: 14, padding: 13, marginTop: 18 },
  futureText: { flex: 1, fontSize: 14, lineHeight: 21, fontWeight: "600" },
  pressed: { opacity: 0.78 },
});
