import { useRouter, type Href } from "expo-router";
import { FlatList, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const COMMUNITY_LINKS = [
  { label: "Grupo da rádio no WhatsApp", url: "https://chat.whatsapp.com/KA0WXvor0XQISApC5dSeT6?s=cl&p=a&mlu=4&ilr=4" },
  { label: "Fale com a Rádio da Promessa", url: "https://wa.me/556798974072" },
  { label: "Grupo no Facebook", url: "https://www.facebook.com/share/g/1Fb134V7mJ/" },
  { label: "Instagram Promessa MS", url: "https://www.instagram.com/promessams/" },
];
const SECTIONS = [
  { route: "/programacao" as const, title: "Programação", subtitle: "Conheça os horários, programas e apresentadores da rádio." },
  { route: "/igrejas" as const, title: "Igrejas", subtitle: "Consulte as 35 unidades, seus endereços e localização." },
  { route: "/pedir-musica" as const, title: "Pedir música", subtitle: "Escolha uma música e envie seu pedido aqui no PromessaMS." },
];

export default function RadioPromessaScreen() {
  const colors = useColors();
  const router = useRouter();
  return (
    <ScreenContainer className="px-4" edges={["top", "left", "right"]}>
      <FlatList data={SECTIONS} keyExtractor={item => item.route} contentContainerStyle={styles.content}
        ListHeaderComponent={<View>
          <Pressable onPress={() => router.replace("/")} style={styles.backButton} accessibilityRole="button"><Text style={[styles.back, { color: colors.primary }]}>Voltar</Text></Pressable>
          <Text style={[styles.kicker, { color: colors.primary }]}>RÁDIO DA PROMESSA · MS</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Programas, Igrejas e Comunidade</Text>
          <Text style={[styles.description, { color: colors.muted }]}>Acompanhe a programação, encontre sua igreja e participe. Para ouvir a rádio, use o botão na tela inicial.</Text>
        </View>}
        renderItem={({ item }) => <Pressable onPress={() => Platform.OS === "web" ? router.push(item.route as Href) : router.push({ pathname: "/pagina-web" as never, params: { page: item.route.slice(1) } })} style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={`Abrir ${item.title}`}>
          <View style={styles.cardBody}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text><Text style={[styles.cardText, { color: colors.muted }]}>{item.subtitle}</Text></View><Text style={[styles.arrow, { color: colors.primary }]}>›</Text>
        </Pressable>}
        ListFooterComponent={<View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Faça parte da comunidade</Text>
          <Text style={[styles.description, { color: colors.muted }]}>Os contatos abaixo abrem somente os serviços de comunicação escolhidos por você.</Text>
          {COMMUNITY_LINKS.map(item => <Pressable key={item.url} onPress={() => void Linking.openURL(item.url)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} accessibilityRole="link"><Text style={[styles.cardTitle, styles.cardBody, { color: colors.primary }]}>{item.label}</Text><Text style={[styles.arrow, { color: colors.primary }]}>↗</Text></Pressable>)}
        </View>}
      />
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  content: { paddingTop: 18, paddingBottom: 40 }, backButton: { alignSelf: "flex-start", paddingVertical: 10, marginBottom: 12 },
  back: { fontSize: 16, fontWeight: "800" }, kicker: { fontSize: 11, letterSpacing: 1, fontWeight: "800", marginBottom: 10 },
  title: { fontSize: 28, lineHeight: 35, fontWeight: "800" }, description: { fontSize: 16, lineHeight: 25, marginTop: 10, marginBottom: 16 },
  card: { borderWidth: 1, borderRadius: 18, padding: 18, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  cardBody: { flex: 1, minWidth: 0 }, cardTitle: { fontSize: 18, lineHeight: 25, fontWeight: "800" }, cardText: { fontSize: 15, lineHeight: 23, marginTop: 5 },
  arrow: { fontSize: 25 }, sectionTitle: { fontSize: 22, lineHeight: 29, fontWeight: "800", marginTop: 16 }, pressed: { opacity: 0.75 },
});
