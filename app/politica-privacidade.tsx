import { useRouter } from "expo-router";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { PRIVACY_POLICY_URL } from "@/shared/privacy";

const sections = [
  {
    title: "1. Quem somos",
    body: "O PromessaMS é um aplicativo e site mantidos pela Convenção Regional Sul-Mato-Grossense, para apoiar o ensino da Filosofia da Semente, do Projeto Sementes e de materiais missionais relacionados.",
  },
  {
    title: "2. Dados que podem ser tratados",
    body: "O aplicativo pode tratar os dados necessários para funcionar, como perguntas e respostas enviadas ao chat, anotações de leitura, favoritos, progresso de leitura e preferências de acessibilidade e tema. Se você entrar com uma conta Manus, podemos receber os dados básicos disponibilizados pelo provedor de autenticação, como nome, e-mail e identificador da conta, para autenticar o acesso e sincronizar o histórico.",
  },
  {
    title: "3. Arquivos e conteúdo enviados ao chat",
    body: "Quando você enviar uma pergunta, imagem ou arquivo compatível com o chat, o conteúdo será usado para gerar a resposta solicitada. Evite enviar documentos que contenham dados pessoais desnecessários, senhas, informações bancárias, dados de saúde ou documentos de identificação de terceiros.",
  },
  {
    title: "4. Como usamos os dados",
    body: "Usamos os dados para fornecer o chat contextual, manter recursos como favoritos, anotações, progresso e histórico, melhorar a estabilidade e a segurança do serviço, responder ao suporte e cumprir obrigações legais aplicáveis. Não usamos o conteúdo das perguntas para enviar publicidade direcionada dentro do PromessaMS.",
  },
  {
    title: "5. Compartilhamento e prestadores",
    body: "Para prestar os recursos solicitados, os dados podem ser processados por provedores técnicos contratados, como hospedagem, autenticação, armazenamento, análise técnica e serviços de inteligência artificial. Esses provedores devem processar os dados somente para executar os serviços contratados e aplicar medidas de segurança. Também podemos compartilhar dados quando exigido por lei, ordem válida de autoridade competente ou para proteger direitos e segurança.",
  },
  {
    title: "6. Conteúdo offline e armazenamento no dispositivo",
    body: "Materiais de leitura, preferências, favoritos, anotações e parte do histórico podem permanecer armazenados localmente no seu dispositivo para permitir o uso offline e melhorar a experiência. Desinstalar o aplicativo ou limpar seus dados pode apagar esse conteúdo local. O histórico associado a uma conta pode permanecer sincronizado até que seja excluído de acordo com os recursos disponíveis da conta.",
  },
  {
    title: "7. Permissões e recursos do dispositivo",
    body: "O app pode usar internet para chat, autenticação e conteúdos online; armazenamento local para leitura e preferências; área de transferência quando você solicita copiar um texto ou PIX; áudio quando você solicita leitura em voz alta ou rádio; e notificações somente se autorizadas pelo sistema. O app não acessa contatos, localização ou câmera sem uma solicitação específica de recurso que explique a finalidade.",
  },
  {
    title: "8. Segurança",
    body: "Adotamos medidas técnicas e administrativas razoáveis para proteger os dados contra acesso não autorizado, perda, alteração ou divulgação indevida. Nenhum serviço conectado à internet pode garantir segurança absoluta; por isso, proteja seu dispositivo e não compartilhe credenciais.",
  },
  {
    title: "9. Crianças",
    body: "O PromessaMS não é destinado especificamente a crianças. O uso por menores deve ocorrer com orientação e supervisão dos responsáveis, conforme a legislação aplicável. Não solicitamos conscientemente dados pessoais de crianças para fins de publicidade.",
  },
  {
    title: "10. Seus direitos e solicitações",
    body: "Você pode solicitar informações sobre o tratamento dos seus dados, correção, eliminação quando aplicável, revogação de consentimentos e esclarecimentos sobre esta política. Para isso, entre em contato pelo WhatsApp oficial ou pelos canais institucionais da Convenção Regional Sul-Mato-Grossense. Podemos solicitar informações mínimas para confirmar a identidade e proteger a conta.",
  },
  {
    title: "11. Retenção e exclusão",
    body: "Mantemos os dados pelo tempo necessário para oferecer os recursos, cumprir obrigações legais, resolver disputas e aplicar acordos. Quando não houver mais necessidade legítima, os dados serão excluídos, anonimizados ou mantidos somente pelo prazo exigido por lei.",
  },
  {
    title: "12. Alterações nesta política",
    body: "Podemos atualizar esta Política de Privacidade para refletir mudanças no aplicativo, nos serviços ou na legislação. Publicaremos a versão atualizada nesta mesma página e indicaremos a data da última atualização. Mudanças relevantes serão comunicadas no app quando apropriado.",
  },
  {
    title: "13. Contato",
    body: "Para dúvidas ou solicitações relacionadas à privacidade, use o canal oficial: WhatsApp +55 (67) 99913-2610. Ao entrar em contato, descreva sua solicitação sem enviar dados pessoais além do necessário.",
  },
];

export default function PrivacyPolicyScreen() {
  const colors = useColors();
  const router = useRouter();

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.replace("/")} style={[styles.backButton, { borderColor: colors.border, backgroundColor: colors.surface }]} accessibilityRole="button" accessibilityLabel="Voltar para o início">
            <Text style={[styles.backText, { color: colors.primary }]}>‹ Início</Text>
          </Pressable>
          <Text style={[styles.kicker, { color: colors.primary }]}>TRANSPARÊNCIA</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Política de Privacidade</Text>
          <Text style={[styles.updated, { color: colors.muted }]}>PromessaMS · última atualização: 3 de outubro de 2026</Text>
        </View>

        <View style={[styles.notice, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.noticeTitle, { color: colors.foreground }]}>Resumo</Text>
          <Text style={[styles.body, { color: colors.muted }]}>Esta política explica quais dados podem ser tratados pelo PromessaMS, por que são usados, com quem podem ser compartilhados e quais escolhas estão disponíveis para você.</Text>
        </View>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{section.title}</Text>
            <Text style={[styles.body, { color: colors.muted }]}>{section.body}</Text>
          </View>
        ))}

        <Pressable onPress={() => void Linking.openURL("https://wa.me/5567999132610?text=Olá%2C%20tenho%20uma%20dúvida%20sobre%20privacidade%20no%20PromessaMS.")} style={[styles.contactButton, { backgroundColor: colors.primary }]} accessibilityRole="link">
          <Text style={styles.contactText}>Falar sobre privacidade pelo WhatsApp</Text>
        </Pressable>
        <Text selectable style={[styles.url, { color: colors.muted }]}>{PRIVACY_POLICY_URL}</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 18, paddingBottom: 42 },
  header: { marginBottom: 18 },
  backButton: { alignSelf: "flex-start", borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 20 },
  backText: { fontSize: 13, fontWeight: "800" },
  kicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1.3, marginBottom: 6 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: "800", letterSpacing: -0.5 },
  updated: { fontSize: 12, marginTop: 8 },
  notice: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 20 },
  noticeTitle: { fontSize: 15, fontWeight: "800", marginBottom: 5 },
  section: { marginBottom: 19 },
  sectionTitle: { fontSize: 16, lineHeight: 21, fontWeight: "800", marginBottom: 5 },
  body: { fontSize: 14, lineHeight: 22 },
  contactButton: { borderRadius: 14, alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, marginTop: 4 },
  contactText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
  url: { fontSize: 11, textAlign: "center", marginTop: 13 },
});
