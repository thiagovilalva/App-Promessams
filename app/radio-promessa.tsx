import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useRadio } from "@/lib/radio-provider";

const RADIO_SITE = "https://promessams-gt8vmutx.manus.space";
const MUSIC_REQUEST = "https://player.conectastm.com/pedir-musica/30368";
const COMMUNITY_LINKS = [
  { label: "Grupo da rádio no WhatsApp", url: "https://chat.whatsapp.com/KA0WXvor0XQISApC5dSeT6?s=cl&p=a&mlu=4&ilr=4" },
  { label: "Fale com a Rádio da Promessa", url: "https://wa.me/556798974072" },
  { label: "Grupo no Facebook", url: "https://www.facebook.com/share/g/1Fb134V7mJ/" },
  { label: "Instagram Promessa MS", url: "https://www.instagram.com/promessams/" },
];
const TIMER_OPTIONS = [15, 30, 45, 60, 90];

export default function RadioPromessaScreen() {
  const colors = useColors();
  const router = useRouter();
  const { playing, isBuffering, volume, setVolume, toggle } = useRadio();
  const [timer, setTimer] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function setStopTimer(minutes: number | null) {
    if (timerRef.current) clearTimeout(timerRef.current);
    setTimer(minutes);
    if (minutes) {
      timerRef.current = setTimeout(() => {
        if (playing) toggle();
        setTimer(null);
      }, minutes * 60 * 1000);
    }
  }

  function open(url: string) { void Linking.openURL(url); }

  return (
    <ScreenContainer className="px-4" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}><Text style={[styles.back, { color: colors.primary }]}>‹ Voltar</Text></Pressable>
          <Text style={[styles.kicker, { color: colors.primary }]}>RÁDIO DA PROMESSA · MS</Text>
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>A mensagem que inspira.</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Ao vivo, onde você estiver.</Text>
        <Text style={[styles.description, { color: colors.muted }]}>Ouça a Rádio da Promessa, acompanhe a programação e participe da comunidade Promessa MS.</Text>

        <View style={[styles.player, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.playerHead}><View style={[styles.radioIcon, { backgroundColor: colors.primary }]}><IconSymbol name="music-note" size={24} color="#FFFFFF" /></View><View style={styles.playerCopy}><Text style={[styles.playerTitle, { color: colors.foreground }]}>Rádio da Promessa</Text><Text style={[styles.playerMeta, { color: colors.muted }]}>Gospel · Promessa MS</Text></View><View style={[styles.liveDot, { backgroundColor: playing ? colors.success : colors.border }]} /></View>
          <Pressable onPress={toggle} style={({ pressed }) => [styles.playButton, { backgroundColor: colors.primary }, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={playing ? "Parar rádio" : "Ouvir rádio ao vivo"}><IconSymbol name={playing ? "stop.fill" : "play.fill"} size={21} color="#FFFFFF" /><Text style={styles.playText}>{isBuffering ? "Conectando..." : playing ? "Parar reprodução" : "Ouvir ao vivo"}</Text></Pressable>
          <View style={styles.volumeRow}><IconSymbol name="volume.up" size={17} color={colors.primary} /><Text style={[styles.volumeLabel, { color: colors.foreground }]}>Volume {Math.round(volume * 100)}%</Text><View style={[styles.volumeTrack, { backgroundColor: colors.border }]}><View style={[styles.volumeFill, { backgroundColor: colors.primary, width: `${volume * 100}%` }]} /></View></View>
          <View style={styles.volumeButtons}><Pressable onPress={() => setVolume(volume - 0.1)} style={[styles.smallButton, { borderColor: colors.border }]}><Text style={[styles.smallButtonText, { color: colors.foreground }]}>−</Text></Pressable><Pressable onPress={() => setVolume(volume + 0.1)} style={[styles.smallButton, { borderColor: colors.border }]}><Text style={[styles.smallButtonText, { color: colors.foreground }]}>+</Text></Pressable></View>
          <Text style={[styles.timerTitle, { color: colors.foreground }]}>Parar reprodução em</Text>
          <View style={styles.timerRow}>{TIMER_OPTIONS.map((minutes) => <Pressable key={minutes} onPress={() => setStopTimer(minutes)} style={[styles.timerButton, { borderColor: timer === minutes ? colors.primary : colors.border, backgroundColor: timer === minutes ? colors.primary + "18" : "transparent" }]}><Text style={[styles.timerText, { color: colors.foreground }]}>{minutes >= 60 ? `${minutes / 60} h` : `${minutes} min`}</Text></Pressable>)}<Pressable onPress={() => setStopTimer(null)} style={[styles.timerButton, { borderColor: colors.border }]}><Text style={[styles.timerText, { color: colors.foreground }]}>Cancelar</Text></Pressable></View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Acompanhe a rádio</Text>
        <View style={styles.featureGrid}>
          <Pressable onPress={() => open(`${RADIO_SITE}/programacao/`)} style={[styles.feature, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.featureNumber, { color: colors.primary }]}>01 / NO AR</Text><Text style={[styles.featureTitle, { color: colors.foreground }]}>Programação</Text><Text style={[styles.featureText, { color: colors.muted }]}>Horários, locutores e contato direto.</Text></Pressable>
          <Pressable onPress={() => open(`${RADIO_SITE}/igrejas/`)} style={[styles.feature, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.featureNumber, { color: colors.primary }]}>02 / COMUNIDADE</Text><Text style={[styles.featureTitle, { color: colors.foreground }]}>Igrejas</Text><Text style={[styles.featureText, { color: colors.muted }]}>Encontre unidades e abra o endereço no mapa.</Text></Pressable>
          <Pressable onPress={() => open(MUSIC_REQUEST)} style={[styles.feature, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.featureNumber, { color: colors.primary }]}>03 / PARTICIPAÇÃO</Text><Text style={[styles.featureTitle, { color: colors.foreground }]}>Pedir música</Text><Text style={[styles.featureText, { color: colors.muted }]}>Envie seu pedido para a programação.</Text></Pressable>
        </View>

        <Text style={[styles.sectionKicker, { color: colors.primary }]}>PERTO DE VOCÊ</Text><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Faça parte da comunidade</Text>
        <Text style={[styles.description, { color: colors.muted, marginTop: 4 }]}>Participe dos programas, compartilhe o que acontece na sua igreja e acompanhe a Promessa MS.</Text>
        <View style={styles.community}>{COMMUNITY_LINKS.map((item) => <Pressable key={item.label} onPress={() => open(item.url)} style={[styles.communityButton, { borderColor: colors.border }]}><Text style={[styles.communityText, { color: colors.primary }]}>{item.label}</Text><Text style={[styles.external, { color: colors.muted }]}>↗</Text></Pressable>)}</View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 18, paddingBottom: 36 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  back: { fontSize: 14, fontWeight: "800" },
  kicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1.1 },
  title: { fontSize: 29, lineHeight: 35, fontWeight: "800", letterSpacing: -0.6 },
  subtitle: { fontSize: 18, fontWeight: "700", marginTop: 2 },
  description: { fontSize: 14, lineHeight: 21, marginTop: 12 },
  player: { borderWidth: 1, borderRadius: 20, padding: 15, marginTop: 20 },
  playerHead: { flexDirection: "row", alignItems: "center", gap: 11 },
  radioIcon: { width: 48, height: 48, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  playerCopy: { flex: 1 },
  playerTitle: { fontSize: 17, fontWeight: "800" },
  playerMeta: { fontSize: 12, marginTop: 3 },
  liveDot: { width: 11, height: 11, borderRadius: 7 },
  playButton: { minHeight: 48, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16 },
  playText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  volumeRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 17 },
  volumeLabel: { fontSize: 12, fontWeight: "700" },
  volumeTrack: { flex: 1, height: 5, borderRadius: 4, overflow: "hidden" },
  volumeFill: { height: 5, borderRadius: 4 },
  volumeButtons: { flexDirection: "row", gap: 7, justifyContent: "flex-end", marginTop: 7 },
  smallButton: { width: 30, height: 28, borderRadius: 9, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  smallButtonText: { fontSize: 17, fontWeight: "800" },
  timerTitle: { fontSize: 12, fontWeight: "800", marginTop: 16 },
  timerRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 8 },
  timerButton: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 7 },
  timerText: { fontSize: 11, fontWeight: "700" },
  sectionKicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1.1, marginTop: 27, marginBottom: 5 },
  sectionTitle: { fontSize: 21, fontWeight: "800", marginTop: 25 },
  featureGrid: { gap: 9, marginTop: 11 },
  feature: { borderWidth: 1, borderRadius: 15, padding: 13 },
  featureNumber: { fontSize: 10, fontWeight: "800", letterSpacing: 0.7 },
  featureTitle: { fontSize: 15, fontWeight: "800", marginTop: 5 },
  featureText: { fontSize: 12, lineHeight: 17, marginTop: 3 },
  community: { gap: 8, marginTop: 13 },
  communityButton: { borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  communityText: { fontSize: 13, fontWeight: "800" },
  external: { fontSize: 15 },
  pressed: { opacity: 0.78 },
});
