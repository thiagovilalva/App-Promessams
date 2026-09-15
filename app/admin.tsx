import { startOAuthLogin } from "@/constants/oauth";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

export default function AdminScreen() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [source, setSource] = useState("");
  const materialsQuery = trpc.materials.adminList.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const createMutation = trpc.materials.create.useMutation({ onSuccess: () => { setTitle(""); setSummary(""); setContent(""); setSource(""); void materialsQuery.refetch(); Alert.alert("Material enviado para revisão", "O material foi salvo como rascunho. Somente o gestor principal pode autorizar sua publicação no chat."); } });
  const approveMutation = trpc.materials.approve.useMutation({ onSuccess: () => { void materialsQuery.refetch(); Alert.alert("Material autorizado", "Este conteúdo agora está disponível para o guia do Projeto Sementes."); }, onError: (error) => Alert.alert("Acesso restrito", error.message) });

  if (loading) return <ScreenContainer className="items-center justify-center"><ActivityIndicator size="large" color="#167C55" /></ScreenContainer>;

  if (!isAuthenticated) {
    return <ScreenContainer className="px-5" edges={["top", "left", "right"]}><View style={styles.center}><View style={styles.lock}><IconSymbol name="lock.fill" size={28} color="#167C55" /></View><Text style={styles.title}>Área da equipe</Text><Text style={styles.subtitle}>Entre com a conta administrativa da plataforma para adicionar e revisar materiais da base de conhecimento.</Text><Pressable onPress={() => void startOAuthLogin()} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryText}>Entrar com Manus</Text><IconSymbol name="arrow.forward" size={17} color="#FFFFFF" /></Pressable><Pressable onPress={() => router.back()}><Text style={styles.backText}>Voltar ao app</Text></Pressable></View></ScreenContainer>;
  }

  const queryError = materialsQuery.error as { data?: { code?: string }; message?: string } | null;
  const isForbidden = queryError?.data?.code === "FORBIDDEN" || queryError?.message?.toLowerCase().includes("permission");
  if (isForbidden) return <ScreenContainer className="px-5" edges={["top", "left", "right"]}><View style={styles.center}><View style={[styles.lock, { backgroundColor: "#FFF1DE" }]}><IconSymbol name="info.circle.fill" size={28} color="#A76418" /></View><Text style={styles.title}>Acesso restrito</Text><Text style={styles.subtitle}>A conta {user?.email ?? "autenticada"} não possui permissão de administradora. Peça ao responsável pela plataforma para atribuir o papel de administrador.</Text><Pressable onPress={() => router.back()}><Text style={styles.backText}>Voltar ao app</Text></Pressable></View></ScreenContainer>;

  async function submit() {
    if (title.trim().length < 3 || content.trim().length < 20) {
      Alert.alert("Complete o material", "Informe um título e pelo menos 20 caracteres de conteúdo.");
      return;
    }
    await createMutation.mutateAsync({ title: title.trim(), summary: summary.trim() || undefined, content: content.trim(), source: source.trim() || undefined, published: false });
  }

  return <ScreenContainer className="px-5" edges={["top", "left", "right"]}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}><View style={styles.header}><View><Text style={styles.kicker}>ADMINISTRAÇÃO</Text><Text style={styles.title}>Base de conhecimento</Text></View><Pressable onPress={() => router.back()}><Text style={styles.backText}>Fechar</Text></Pressable></View><Text style={styles.subtitle}>Olá, {user?.name ?? "equipe"}. Novos materiais entram como rascunho. O gestor principal, identificado pela conta proprietária da plataforma, precisa autorizar cada publicação.</Text><View style={styles.form}><Text style={styles.label}>Título</Text><TextInput value={title} onChangeText={setTitle} placeholder="Ex.: Roteiro de Grupo de Apoio" style={styles.input} placeholderTextColor="#8A9890" /><Text style={styles.label}>Resumo</Text><TextInput value={summary} onChangeText={setSummary} placeholder="Explique em uma frase o que este material oferece" style={styles.input} placeholderTextColor="#8A9890" /><Text style={styles.label}>Fonte</Text><TextInput value={source} onChangeText={setSource} placeholder="Ex.: Manual aprovado pela Convenção" style={styles.input} placeholderTextColor="#8A9890" /><Text style={styles.label}>Conteúdo</Text><TextInput value={content} onChangeText={setContent} placeholder="Cole ou escreva o material completo..." multiline numberOfLines={8} style={[styles.input, styles.textarea]} placeholderTextColor="#8A9890" /><Pressable onPress={() => void submit()} disabled={createMutation.isPending} style={({ pressed }) => [styles.primaryButton, createMutation.isPending && styles.disabled, pressed && styles.pressed]}>{createMutation.isPending ? <ActivityIndicator color="#FFFFFF" /> : <><IconSymbol name="plus.circle.fill" size={18} color="#FFFFFF" /><Text style={styles.primaryText}>Enviar para revisão</Text></>}</Pressable></View><Text style={styles.section}>Materiais e status</Text>{materialsQuery.isLoading ? <ActivityIndicator color="#167C55" /> : materialsQuery.error ? <Text style={styles.error}>Não foi possível carregar os materiais desta conta.</Text> : materialsQuery.data?.map((material) => <View key={material.id} style={styles.material}><Text style={styles.materialTitle}>{material.title}</Text><Text style={styles.materialSummary}>{material.summary || material.content.slice(0, 140)}</Text><Text style={styles.materialSource}>{material.source || "Fonte não informada"}</Text><View style={styles.materialFooter}><Text style={[styles.status, { color: material.published ? "#167C55" : "#A76418" }]}>{material.published ? "Publicado" : "Aguardando autorização"}</Text>{!material.published && <Pressable onPress={() => approveMutation.mutate({ id: material.id })} disabled={approveMutation.isPending} style={styles.approveButton}><Text style={styles.approveText}>Autorizar publicação</Text></Pressable>}</View></View>)}</ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  lock: { width: 62, height: 62, borderRadius: 22, backgroundColor: "#E9F7F0", alignItems: "center", justifyContent: "center", marginBottom: 18 },
  kicker: { color: "#167C55", fontSize: 10, fontWeight: "800", letterSpacing: 1.3, marginBottom: 7 },
  title: { color: "#1D2B25", fontSize: 27, lineHeight: 32, fontWeight: "800", letterSpacing: -0.5, textAlign: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  subtitle: { color: "#718078", fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 10, maxWidth: 390 },
  backText: { color: "#167C55", fontSize: 13, fontWeight: "800", marginTop: 20 },
  primaryButton: { minHeight: 46, backgroundColor: "#167C55", borderRadius: 14, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 20 },
  primaryText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  form: { backgroundColor: "#FFFFFF", borderColor: "#E4EBE6", borderWidth: 1, borderRadius: 20, padding: 16, marginTop: 22 },
  label: { color: "#1D2B25", fontSize: 12, fontWeight: "800", marginTop: 12, marginBottom: 6 },
  input: { borderColor: "#DDE7E0", borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, color: "#1D2B25", fontSize: 13 },
  textarea: { minHeight: 150, textAlignVertical: "top" },
  section: { color: "#1D2B25", fontSize: 18, fontWeight: "800", marginTop: 28, marginBottom: 10 },
  material: { backgroundColor: "#FFFFFF", borderColor: "#E4EBE6", borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10 },
  materialTitle: { color: "#1D2B25", fontSize: 14, fontWeight: "800" },
  materialSummary: { color: "#718078", fontSize: 12, lineHeight: 17, marginTop: 5 },
  materialSource: { color: "#167C55", fontSize: 10, fontWeight: "700", marginTop: 8 },
  materialFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 12 },
  status: { fontSize: 11, fontWeight: "800", flex: 1 },
  approveButton: { backgroundColor: "#167C55", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  approveText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  error: { color: "#C94F4F", fontSize: 12 },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.78 },
});
