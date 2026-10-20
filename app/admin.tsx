import { startOAuthLogin } from "@/constants/oauth";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { File } from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

type Category = "filosofia" | "projeto" | "pao-diario" | "hbj" | "ministerios" | "outros";

type Attachment = { name: string; mimeType: string; base64: string; size: number };

const categories: Array<{ value: Category; label: string }> = [
  { value: "filosofia", label: "Filosofia da Semente" },
  { value: "projeto", label: "Projeto Sementes" },
  { value: "pao-diario", label: "Pão Diário" },
  { value: "hbj", label: "Hinário HBJ" },
  { value: "ministerios", label: "Ministérios Regionais" },
  { value: "outros", label: "Outros" },
];

function categoryLabel(value: string) {
  return categories.find((item) => item.value === value)?.label ?? "Outros";
}

export default function AdminScreen() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [source, setSource] = useState("");
  const [category, setCategory] = useState<Category>("outros");
  const [version, setVersion] = useState("1");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [publicationRequested, setPublicationRequested] = useState(false);
  const materialsQuery = trpc.materials.adminList.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const createMutation = trpc.materials.create.useMutation({
    onSuccess: () => {
      setTitle(""); setSummary(""); setContent(""); setSource(""); setCategory("outros"); setVersion("1"); setAttachment(null);
      void materialsQuery.refetch();
      Alert.alert("Material enviado para revisão", "O material foi salvo como rascunho. O gestor principal deve tocar em Publicar para todos.");
    },
    onError: (error) => Alert.alert("Não foi possível salvar", error.message),
  });
  const approveMutation = trpc.materials.approve.useMutation({
    onSuccess: () => { void materialsQuery.refetch(); Alert.alert("Publicado para todos", "Este conteúdo já está disponível no app, no site e no contexto do chat."); },
    onError: (error) => Alert.alert("Acesso restrito", error.message),
  });

  async function pickAttachment() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["image/*", "application/pdf", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"], copyToCacheDirectory: true, base64: true });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      const base64 = asset.base64 ?? await new File(asset.uri).base64();
      const size = asset.size ?? Math.ceil(base64.length * 0.75);
      if (size > 10_000_000) {
        Alert.alert("Arquivo muito grande", "Escolha uma imagem ou arquivo de até 10 MB.");
        return;
      }
      setAttachment({ name: asset.name, mimeType: asset.mimeType || "application/octet-stream", base64, size });
    } catch (error) {
      Alert.alert("Não foi possível anexar", error instanceof Error ? error.message : "Tente novamente.");
    }
  }

  if (loading) return <ScreenContainer className="items-center justify-center"><ActivityIndicator size="large" color="#167C55" /></ScreenContainer>;

  function requestPublication() {
    setPublicationRequested(true);
    Alert.alert("Solicitação registrada", "A atualização está pronta para publicação. A autorização final do deploy continua sendo feita no painel WebDev, porque o app não possui permissão para publicar código diretamente.");
  }

  if (!isAuthenticated) {
    return <ScreenContainer className="px-5" edges={["top", "left", "right"]}><View style={styles.center}><View style={styles.lock}><IconSymbol name="lock.fill" size={28} color="#167C55" /></View><Text style={styles.title}>Área da equipe</Text><Text style={styles.subtitle}>Entre com a conta administrativa da plataforma para adicionar, revisar e publicar materiais.</Text><Pressable onPress={() => void startOAuthLogin()} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryText}>Entrar com Manus</Text><IconSymbol name="arrow.forward" size={17} color="#FFFFFF" /></Pressable><Pressable onPress={() => router.back()}><Text style={styles.backText}>Voltar ao app</Text></Pressable></View></ScreenContainer>;
  }

  const queryError = materialsQuery.error as { data?: { code?: string }; message?: string } | null;
  const isForbidden = queryError?.data?.code === "FORBIDDEN" || queryError?.message?.toLowerCase().includes("permission");
  if (isForbidden) return <ScreenContainer className="px-5" edges={["top", "left", "right"]}><View style={styles.center}><View style={[styles.lock, { backgroundColor: "#FFF1DE" }]}><IconSymbol name="info.circle.fill" size={28} color="#A76418" /></View><Text style={styles.title}>Acesso restrito</Text><Text style={styles.subtitle}>A conta {user?.email ?? "autenticada"} não possui permissão de administradora. Somente a equipe autorizada pode publicar materiais.</Text><Pressable onPress={() => router.back()}><Text style={styles.backText}>Voltar ao app</Text></Pressable></View></ScreenContainer>;

  async function submit() {
    const parsedVersion = Number.parseInt(version, 10);
    if (title.trim().length < 3 || content.trim().length < 20 || !Number.isInteger(parsedVersion) || parsedVersion < 1) {
      Alert.alert("Complete o material", "Informe título, pelo menos 20 caracteres e uma versão válida.");
      return;
    }
    await createMutation.mutateAsync({ title: title.trim(), category, version: parsedVersion, summary: summary.trim() || undefined, content: content.trim(), source: source.trim() || undefined, published: false, attachment: attachment ?? undefined });
  }

  return <ScreenContainer className="px-5" edges={["top", "left", "right"]}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}><View style={styles.header}><View><Text style={styles.kicker}>ADMINISTRAÇÃO</Text><Text style={styles.title}>Publicar conteúdos</Text></View><Pressable onPress={() => router.back()}><Text style={styles.backText}>Fechar</Text></Pressable></View><Text style={styles.subtitle}>Olá, {user?.name ?? "equipe"}. Cada envio começa como rascunho. O gestor principal revisa e publica para todos os usuários.</Text><View style={styles.releaseCard}><View style={styles.releaseCopy}><Text style={styles.releaseTitle}>Atualização do aplicativo e site</Text><Text style={styles.releaseText}>Solicite a publicação do checkpoint validado. A autorização final do deploy continua no painel WebDev.</Text></View><Pressable onPress={requestPublication} style={({ pressed }) => [styles.releaseButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Solicitar publicação da atualização"><Text style={styles.releaseButtonText}>{publicationRequested ? "Solicitação registrada" : "Solicitar publicação"}</Text></Pressable></View><View style={styles.form}><Text style={styles.label}>Categoria</Text><View style={styles.categoryGrid}>{categories.map((item) => <Pressable key={item.value} onPress={() => setCategory(item.value)} style={[styles.categoryChip, category === item.value && styles.categoryChipSelected]}><Text style={[styles.categoryChipText, category === item.value && styles.categoryChipTextSelected]}>{item.label}</Text></Pressable>)}</View><Text style={styles.label}>Título</Text><TextInput value={title} onChangeText={setTitle} placeholder="Ex.: Roteiro de Grupo de Apoio" style={styles.input} placeholderTextColor="#8A9890" /><View style={styles.inlineFields}><View style={styles.versionField}><Text style={styles.label}>Versão</Text><TextInput value={version} onChangeText={(value) => setVersion(value.replace(/\D/g, "").slice(0, 4))} keyboardType="number-pad" placeholder="1" style={styles.input} placeholderTextColor="#8A9890" /></View><View style={styles.sourceField}><Text style={styles.label}>Fonte</Text><TextInput value={source} onChangeText={setSource} placeholder="Manual aprovado" style={styles.input} placeholderTextColor="#8A9890" /></View></View><Text style={styles.label}>Resumo</Text><TextInput value={summary} onChangeText={setSummary} placeholder="Explique em uma frase o que este material oferece" style={styles.input} placeholderTextColor="#8A9890" /><Text style={styles.label}>Conteúdo para o app e o chat</Text><TextInput value={content} onChangeText={setContent} placeholder="Cole ou escreva o material completo..." multiline numberOfLines={8} style={[styles.input, styles.textarea]} placeholderTextColor="#8A9890" /><Pressable onPress={() => void pickAttachment()} style={styles.attachmentButton}><IconSymbol name="paperclip" size={18} color="#167C55" /><Text style={styles.attachmentText}>{attachment ? `Anexo: ${attachment.name}` : "Adicionar imagem ou arquivo (até 10 MB)"}</Text></Pressable>{attachment && <Text style={styles.attachmentMeta}>{attachment.mimeType} · {(attachment.size / 1024 / 1024).toFixed(2)} MB</Text>}<Pressable onPress={() => void submit()} disabled={createMutation.isPending} style={({ pressed }) => [styles.primaryButton, createMutation.isPending && styles.disabled, pressed && styles.pressed]}>{createMutation.isPending ? <ActivityIndicator color="#FFFFFF" /> : <><IconSymbol name="plus.circle.fill" size={18} color="#FFFFFF" /><Text style={styles.primaryText}>Enviar para revisão</Text></>}</Pressable></View><Text style={styles.section}>Materiais e versões</Text>{materialsQuery.isLoading ? <ActivityIndicator color="#167C55" /> : materialsQuery.error ? <Text style={styles.error}>Não foi possível carregar os materiais desta conta.</Text> : materialsQuery.data?.map((material) => <View key={material.id} style={styles.material}><View style={styles.materialTop}><Text style={styles.categoryBadge}>{categoryLabel(material.category)}</Text><Text style={styles.versionBadge}>v{material.version}</Text></View><Text style={styles.materialTitle}>{material.title}</Text><Text style={styles.materialSummary}>{material.summary || material.content.slice(0, 140)}</Text><Text style={styles.materialSource}>{material.source || "Fonte não informada"}{material.assetName ? ` · Anexo: ${material.assetName}` : ""}</Text><View style={styles.materialFooter}><Text style={[styles.status, { color: material.published ? "#167C55" : "#A76418" }]}>{material.published ? "Publicado para todos" : "Aguardando revisão"}</Text>{!material.published && <Pressable onPress={() => approveMutation.mutate({ id: material.id })} disabled={approveMutation.isPending} style={styles.approveButton}><Text style={styles.approveText}>Publicar para todos</Text></Pressable>}</View></View>)}</ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 20, paddingBottom: 40 }, center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 }, lock: { width: 62, height: 62, borderRadius: 22, backgroundColor: "#E9F7F0", alignItems: "center", justifyContent: "center", marginBottom: 18 }, kicker: { color: "#167C55", fontSize: 10, fontWeight: "800", letterSpacing: 1.3, marginBottom: 7 }, title: { color: "#1D2B25", fontSize: 27, lineHeight: 32, fontWeight: "800", letterSpacing: -0.5, textAlign: "center" }, header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }, subtitle: { color: "#718078", fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 10, maxWidth: 390 }, backText: { color: "#167C55", fontSize: 13, fontWeight: "800", marginTop: 20 }, primaryButton: { minHeight: 46, backgroundColor: "#167C55", borderRadius: 14, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 20 }, primaryText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" }, releaseCard: { backgroundColor: "#F0F8F3", borderColor: "#B6E6CF", borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 18, gap: 10 }, releaseCopy: { gap: 4 }, releaseTitle: { color: "#1D2B25", fontSize: 14, fontWeight: "800" }, releaseText: { color: "#53645B", fontSize: 12, lineHeight: 18 }, releaseButton: { alignSelf: "flex-start", backgroundColor: "#167C55", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 }, releaseButtonText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" }, form: { backgroundColor: "#FFFFFF", borderColor: "#E4EBE6", borderWidth: 1, borderRadius: 20, padding: 16, marginTop: 22 }, label: { color: "#1D2B25", fontSize: 12, fontWeight: "800", marginTop: 12, marginBottom: 6 }, categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, categoryChip: { borderColor: "#DDE7E0", borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8 }, categoryChipSelected: { backgroundColor: "#167C55", borderColor: "#167C55" }, categoryChipText: { color: "#53645B", fontSize: 11, fontWeight: "700" }, categoryChipTextSelected: { color: "#FFFFFF" }, inlineFields: { flexDirection: "row", gap: 10 }, versionField: { width: 80 }, sourceField: { flex: 1 }, input: { borderColor: "#DDE7E0", borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, color: "#1D2B25", fontSize: 13 }, textarea: { minHeight: 150, textAlignVertical: "top" }, attachmentButton: { minHeight: 44, borderColor: "#B6E6CF", borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 }, attachmentText: { color: "#167C55", fontSize: 12, fontWeight: "800", flex: 1 }, attachmentMeta: { color: "#718078", fontSize: 10, marginTop: 5 }, section: { color: "#1D2B25", fontSize: 18, fontWeight: "800", marginTop: 28, marginBottom: 10 }, material: { backgroundColor: "#FFFFFF", borderColor: "#E4EBE6", borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10 }, materialTop: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 9 }, categoryBadge: { color: "#167C55", fontSize: 10, fontWeight: "800", flex: 1 }, versionBadge: { color: "#7055AA", fontSize: 10, fontWeight: "800" }, materialTitle: { color: "#1D2B25", fontSize: 14, fontWeight: "800" }, materialSummary: { color: "#718078", fontSize: 12, lineHeight: 17, marginTop: 5 }, materialSource: { color: "#167C55", fontSize: 10, fontWeight: "700", marginTop: 8 }, materialFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 12 }, status: { fontSize: 11, fontWeight: "800", flex: 1 }, approveButton: { backgroundColor: "#167C55", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 }, approveText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" }, error: { color: "#C94F4F", fontSize: 12 }, disabled: { opacity: 0.55 }, pressed: { opacity: 0.78 },
});
