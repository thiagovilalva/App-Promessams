import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Speech from "expo-speech";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAccessibility, type SpeechVoiceGender } from "@/lib/accessibility-provider";
import { copyChatResponse, shareChatResponse } from "@/lib/message-actions";
import { trpc } from "@/lib/trpc";

type Attachment = { name: string; mimeType?: string; text?: string; dataUrl?: string };
type Message = { role: "user" | "assistant"; content: string; researched?: boolean; attachments?: Attachment[] };
type ChatMode = "menu" | "seeds" | "doctrinal" | "admin";

const offlineAnswer = "Estou sem conexão neste momento. Você pode continuar lendo a biblioteca offline. Quando a internet voltar, envie sua pergunta novamente para receber uma orientação personalizada com a base do Projeto Sementes.";
const textTypes = ["text/plain", "text/markdown", "text/csv", "application/json", "application/pdf"];

function speechFriendlyText(text: string) {
  return text.replace(/\b(\d?\s?[1-3]?\s?[A-ZÁÉÍÓÚÃÕÇ][\wÁÉÍÓÚÃÕÇ-]*(?:\s+[A-ZÁÉÍÓÚÃÕÇ][\wÁÉÍÓÚÃÕÇ-]*)?)\s+(\d{1,3})[:.](\d{1,3})\b/g, (_match, book: string, chapter: string, verse: string) => `${book}, capítulo ${chapter}, versículo ${verse}`);
}

async function findPortugueseVoice(gender: SpeechVoiceGender) {
  const voices = await Speech.getAvailableVoicesAsync();
  const portuguese = voices.filter((voice) => voice.language?.toLowerCase().startsWith("pt"));
  const maleHints = /male|masc|homem|man|male|daniel|jorge|ricardo|felipe|matej|thomas|miguel|lucas|bruno/i;
  const femaleHints = /female|fem|mulher|woman|female|luciana|helena|joana|samantha|vitoria|victoria|alice|susan/i;
  const hints = gender === "male" ? maleHints : femaleHints;
  const genderMatch = portuguese.find((voice: any) => hints.test(`${voice.identifier ?? ""} ${voice.name ?? ""} ${voice.quality ?? ""}`) || String(voice.gender ?? "").toLowerCase() === gender);
  return (genderMatch ?? portuguese[gender === "female" ? 0 : Math.min(1, portuguese.length - 1)] ?? portuguese[0])?.identifier;
}

export default function ChatScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ topic?: string }>();
  const { textScale, speechRate, speechVoice } = useAccessibility();
  const [messages, setMessages] = useState<Message[]>([]);
  const [mode, setMode] = useState<ChatMode>(params.topic === "doctrinal" ? "doctrinal" : params.topic === "seeds" ? "seeds" : "menu");
  const [adminLevel, setAdminLevel] = useState<1 | 2 | 3 | null>(null);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);
  const [speechPaused, setSpeechPaused] = useState(false);
  const messagesScrollRef = useRef<ScrollView>(null);
  const mutation = trpc.chat.ask.useMutation();
  const doctrinalMutation = trpc.doctrinalChat.ask.useMutation();
  const adminMutation = trpc.adminChat.ask.useMutation();

  const requestedMode = params.topic === "doctrinal" ? "doctrinal" : params.topic === "seeds" ? "seeds" : undefined;

  // The Chat tab can remain mounted while the user returns Home. React Router
  // updates the params, but a useState initializer runs only once; synchronize
  // the selected topic so Home shortcuts always open the requested chat.
  useEffect(() => {
    if (!requestedMode) return;
    setMode(requestedMode);
    setAdminLevel(null);
    setInput("");
    setAttachments([]);
  }, [requestedMode]);

  const storageKey = mode === "doctrinal" ? "promessams:doctrinal-chat" : mode === "admin" ? `promessams:admin-chat-${adminLevel ?? "menu"}` : "sementes:chat";
  useEffect(() => { if (mode === "menu") return; AsyncStorage.getItem(storageKey).then((value) => { if (value) setMessages(JSON.parse(value)); else setMessages([]); }); }, [mode, storageKey]);
  useEffect(() => { if (messages.length && mode !== "menu") void AsyncStorage.setItem(storageKey, JSON.stringify(messages.slice(-30))); }, [messages, mode, storageKey]);
  useEffect(() => {
    const subscription = Keyboard.addListener("keyboardDidShow", () => {
      requestAnimationFrame(() => messagesScrollRef.current?.scrollToEnd({ animated: true }));
    });
    return () => subscription.remove();
  }, []);

  const visibleMessages = useMemo(() => mode === "menu" ? [] : messages.length ? messages : [{ role: "assistant" as const, content: mode === "doctrinal" ? "Olá! Sou o Professor Doutrinário. Faça sua pergunta sobre qualquer um dos 31 pontos da doutrina bíblica da Igreja Adventista da Promessa." : mode === "admin" ? (adminLevel ? "Estou pronto para te ajudar. Escreva qual é a sua dúvida; responderei com base nos documentos administrativos do nível selecionado." : "Escolha um nível administrativo para iniciar a conversa.") : "Olá! Posso te ajudar na compreensão da filosofia, encontrando os caminhos práticos para vivê-la. Por onde quer começar?" }], [messages, mode, adminLevel]);

  function chooseMode(next: Exclude<ChatMode, "menu">) { setMessages([]); setInput(""); setAttachments([]); setAdminLevel(null); setMode(next); }

  async function pickAttachment() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["image/*", ...textTypes], copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      const mimeType = asset.mimeType ?? "application/octet-stream";
      if ((asset.size ?? 0) > 8_000_000) { Alert.alert("Arquivo muito grande", "Escolha um arquivo de até 8 MB."); return; }
      const isImage = mimeType.startsWith("image/");
      const isPdf = mimeType === "application/pdf";
      const isText = !isPdf && (textTypes.includes(mimeType) || mimeType.startsWith("text/"));
      let attachment: Attachment = { name: asset.name, mimeType };
      if (isImage || isPdf) {
        let base64 = asset.base64;
        if (!base64 && Platform.OS === "web" && asset.file) {
          const bytes = new Uint8Array(await asset.file.arrayBuffer());
          let binary = "";
          bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
          base64 = btoa(binary);
        }
        if (!base64) base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
        attachment.dataUrl = `data:${mimeType};base64,${base64}`;
      } else if (isText) {
        attachment.text = Platform.OS === "web" && asset.file ? await asset.file.text() : await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
        attachment.text = attachment.text.slice(0, 30000);
      } else {
        Alert.alert("Formato não suportado", "Anexe uma imagem ou um arquivo de texto/PDF."); return;
      }
      setAttachments((current) => [...current, attachment].slice(-3));
    } catch (error) { console.error("[Chat] attachment error", error); Alert.alert("Não foi possível anexar", "Tente novamente com outro arquivo."); }
  }

  async function sendMessage(text = input) {
    const clean = text.trim();
    if ((!clean && !attachments.length) || mutation.isPending) return;
    setInput("");
    const next = [...messages, { role: "user" as const, content: clean || "Analise os arquivos anexados e me ajude a compreender o conteúdo.", attachments }];
    setAttachments([]); setMessages(next);
    try {
      const payload = next.map(({ role, content, attachments: files }) => ({ role, content, ...(files?.length ? { attachments: files } : {}) }));
      const result = mode === "doctrinal"
        ? await doctrinalMutation.mutateAsync({ messages: payload })
        : mode === "admin" && adminLevel
          ? await adminMutation.mutateAsync({ level: adminLevel, messages: payload })
          : await mutation.mutateAsync({ messages: payload });
      setMessages([...next, { role: "assistant", content: result.answer, researched: "researched" in result ? result.researched : false }]);
    } catch { setMessages([...next, { role: "assistant", content: offlineAnswer }]); }
  }

  async function copyAnswer(text: string) {
    await copyChatResponse(text);
  }

  async function shareAnswer(text: string) {
    await shareChatResponse(text, "Guia Sementes · PromessaMS");
  }

  async function toggleSpeech(text: string, key: string) {
    if (speakingKey === key && speechPaused) { await Speech.resume(); setSpeechPaused(false); return; }
    if (speakingKey === key) { await Speech.pause(); setSpeechPaused(true); return; }
    await Speech.stop();
    setSpeakingKey(key); setSpeechPaused(false);
    const voice = await findPortugueseVoice(speechVoice);
    Speech.speak(speechFriendlyText(text), { language: "pt-BR", voice, rate: speechRate, pitch: speechVoice === "female" ? 1.08 : 0.78, onDone: () => { setSpeakingKey(null); setSpeechPaused(false); }, onStopped: () => { setSpeakingKey(null); setSpeechPaused(false); }, onError: () => { setSpeakingKey(null); setSpeechPaused(false); } });
  }

  function deleteConversation() {
    setMessages([]);
    setAttachments([]);
    setInput("");
    void AsyncStorage.removeItem(storageKey);
    setConfirmDelete(false);
  }

  const pending = mutation.isPending || doctrinalMutation.isPending || adminMutation.isPending;
  const modeTitle = mode === "doctrinal" ? "Professor Doutrinário" : mode === "admin" ? "Administração da Igreja" : "Guia Sementes";

  return (
    <ScreenContainer className="px-4" edges={["top", "left", "right"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 24}>
        <View style={styles.header}><View><Text style={[styles.kicker, { color: colors.primary }]}>PROMESSAMS · CHAT GERAL</Text><Text style={[styles.title, { color: colors.foreground }]}>{mode === "menu" ? "Vamos conversar." : modeTitle}</Text></View><View style={[styles.status, { backgroundColor: "#E9F7F0" }]}><View style={styles.dot} /><Text style={styles.statusText}>Online</Text></View></View>
        {mode !== "menu" && <Pressable onPress={() => { setMode("menu"); setMessages([]); setAdminLevel(null); }} style={styles.backToMenu}><Text style={[styles.clearHistoryText, { color: colors.primary }]}>‹ Escolher outro tema</Text></Pressable>}
        {mode === "menu" && <View style={[styles.topicMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.menuTitle, { color: colors.foreground }]}>Escolha sobre o que deseja conversar</Text>
          <Pressable onPress={() => chooseMode("doctrinal")} style={[styles.topicButton, { borderColor: colors.border }]}><Text style={[styles.topicTitle, { color: colors.foreground }]}>Professor Doutrinário</Text><Text style={[styles.topicText, { color: colors.muted }]}>Estude a doutrina bíblica da Promessa.</Text></Pressable>
          <Pressable onPress={() => chooseMode("seeds")} style={[styles.topicButton, { borderColor: colors.border }]}><Text style={[styles.topicTitle, { color: colors.foreground }]}>Filosofia e Projeto Sementes</Text><Text style={[styles.topicText, { color: colors.muted }]}>Compreenda e aplique a missão na igreja local.</Text></Pressable>
          <Pressable onPress={() => chooseMode("admin")} style={[styles.topicButton, { borderColor: colors.border }]}><Text style={[styles.topicTitle, { color: colors.foreground }]}>Administração da Igreja</Text><Text style={[styles.topicText, { color: colors.muted }]}>Consulte regulamentos, manuais e estatutos.</Text></Pressable>
        </View>}
        {mode === "admin" && !adminLevel && <View style={[styles.topicMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.menuTitle, { color: colors.foreground }]}>Qual nível administrativo você precisa?</Text><Pressable onPress={() => setAdminLevel(1)} style={[styles.topicButton, { borderColor: colors.border }]}><Text style={[styles.topicTitle, { color: colors.foreground }]}>1 — ADM Igrejas sem CNPJ</Text><Text style={[styles.topicText, { color: colors.muted }]}>Regulamento das IAPs locais mantidas pelas DCRs, Manual e Código de Ética Pastoral.</Text></Pressable><Pressable onPress={() => setAdminLevel(2)} style={[styles.topicButton, { borderColor: colors.border }]}><Text style={[styles.topicTitle, { color: colors.foreground }]}>2 — ADM Igrejas com CNPJ</Text><Text style={[styles.topicText, { color: colors.muted }]}>Estatuto da IAP local, Manual e Código de Ética Pastoral.</Text></Pressable><Pressable onPress={() => setAdminLevel(3)} style={[styles.topicButton, { borderColor: colors.border }]}><Text style={[styles.topicTitle, { color: colors.foreground }]}>3 — ADM Convenção Regional</Text><Text style={[styles.topicText, { color: colors.muted }]}>Estatuto, Regimento Regional, Regulamento Eleitoral e Código de Ética Pastoral.</Text></Pressable></View>}
        {!!messages.length && <Pressable onPress={() => setConfirmDelete(true)} style={styles.clearHistory} accessibilityRole="button" accessibilityLabel="Apagar conversa local"><Text style={[styles.clearHistoryText, { color: colors.primary }]}>Apagar conversa</Text></Pressable>}
        <ScrollView ref={messagesScrollRef} style={styles.messages} contentContainerStyle={styles.messageContent} showsVerticalScrollIndicator keyboardShouldPersistTaps="handled" onContentSizeChange={() => messagesScrollRef.current?.scrollToEnd({ animated: false })}>
          {visibleMessages.map((message, index) => <View key={`${index}-${message.role}`} style={[styles.messageRow, message.role === "user" && styles.userRow]}>
            {message.role === "assistant" && <View style={[styles.avatar, { backgroundColor: colors.primary }]}><Text style={styles.avatarText}>S</Text></View>}
            <View style={[styles.bubble, message.role === "user" ? { backgroundColor: colors.primary } : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
              {!!message.attachments?.length && <Text style={[styles.attachmentLabel, { color: message.role === "user" ? "#E8FAF2" : colors.primary }]}>Anexo: {message.attachments.map((file) => file.name).join(", ")}</Text>}
              <Text style={[styles.messageText, { color: message.role === "user" ? "#FFFFFF" : colors.foreground, fontSize: 15 * textScale, lineHeight: 23 * textScale }]}>{message.content}</Text>
              {message.role === "assistant" && <View style={styles.messageActions}>{messages.length > 0 && <><Pressable onPress={() => void copyAnswer(message.content)} style={[styles.actionButton, { borderColor: colors.border }]} accessibilityRole="button" accessibilityLabel="Copiar resposta"><IconSymbol name="doc.on.doc.fill" size={15} color={colors.primary} /><Text style={[styles.actionText, { color: colors.primary }]}>Copiar</Text></Pressable><Pressable onPress={() => void shareAnswer(message.content)} style={[styles.actionButton, { borderColor: colors.border }]} accessibilityRole="button" accessibilityLabel="Compartilhar resposta"><IconSymbol name="share" size={15} color={colors.primary} /><Text style={[styles.actionText, { color: colors.primary }]}>Compartilhar</Text></Pressable></>}<Pressable onPress={() => void toggleSpeech(message.content, `message-${index}`)} style={[styles.actionButton, { borderColor: speakingKey === `message-${index}` ? colors.primary : colors.border }]} accessibilityRole="button" accessibilityLabel={speakingKey === `message-${index}` && !speechPaused ? "Pausar resposta" : speakingKey === `message-${index}` ? "Continuar resposta" : "Ouvir resposta"}><IconSymbol name="volume.up" size={15} color={colors.primary} /><Text style={[styles.actionText, { color: colors.primary }]}>{speakingKey === `message-${index}` ? (speechPaused ? "Continuar" : "Pausar") : "Ouvir"}</Text></Pressable></View>}
              {message.researched && <Text style={[styles.sourceNote, { color: colors.muted }]}>Resposta complementada por pesquisa online.</Text>}
            </View>
          </View>)}
          {pending && <View style={styles.messageRow}><View style={[styles.avatar, { backgroundColor: colors.primary }]}><Text style={styles.avatarText}>P</Text></View><View style={[styles.bubble, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}><ActivityIndicator size="small" color={colors.primary} /></View></View>}
          {!messages.length && <View style={[styles.chatGuide, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.chatGuideTitle, { color: colors.foreground, fontSize: 16 * textScale }]}>Como usar o chat</Text><Text style={[styles.chatGuideText, { color: colors.muted, fontSize: 15 * textScale, lineHeight: 23 * textScale }]}>{mode === "seeds" ? "Escreva sua dúvida, reflexão ou situação prática. O Guia Sementes pode ajudar a compreender conceitos da Filosofia da Semente e orientar caminhos para vivê-los na igreja local. Você também pode anexar imagens ou textos para uma análise mais específica." : mode === "menu" ? "Escolha um dos temas acima para iniciar a conversa. Cada tema utiliza sua própria base de conhecimento para orientar suas perguntas." : mode === "admin" ? (adminLevel ? "Depois de escolher o nível administrativo, escreva sua dúvida. A resposta será fundamentada nos documentos selecionados." : "Escolha primeiro um dos níveis administrativos acima. Depois disso, o campo para escrever sua dúvida será liberado.") : "Escreva sua pergunta sobre a doutrina bíblica da Igreja Adventista da Promessa. Você pode anexar imagens ou textos quando precisar de uma análise mais específica."}</Text></View>}
        </ScrollView>
        {mode !== "menu" && !(mode === "admin" && !adminLevel) && <><Text style={[styles.modeHint, { color: colors.muted }]}>{mode === "admin" ? `Nível ${adminLevel} selecionado. Qual seria sua dúvida?` : "Escreva sua pergunta ou reflexão."}</Text>{!!attachments.length && <View style={[styles.attachmentTray, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.attachmentTrayText, { color: colors.foreground }]} numberOfLines={1}>{attachments.map((file) => file.name).join(" • ")}</Text><Pressable onPress={() => setAttachments([])}><Text style={{ color: colors.error, fontWeight: "800" }}>Remover</Text></Pressable></View>}<View style={[styles.composer, { backgroundColor: colors.surface, borderColor: colors.border }]}><Pressable onPress={pickAttachment} style={styles.attachButton} accessibilityRole="button" accessibilityLabel="Anexar imagem ou texto"><IconSymbol name="paperclip" size={20} color={colors.primary} /></Pressable><TextInput value={input} onChangeText={setInput} onFocus={() => requestAnimationFrame(() => messagesScrollRef.current?.scrollToEnd({ animated: true }))} onSubmitEditing={() => sendMessage()} placeholder="Escreva sua pergunta..." placeholderTextColor={colors.muted} multiline maxLength={1000} style={[styles.input, { color: colors.foreground, fontSize: 15 * textScale }]} returnKeyType="send"/><Pressable onPress={() => sendMessage()} style={({ pressed }) => [styles.sendButton, { backgroundColor: input.trim() || attachments.length ? colors.primary : colors.border }, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Enviar pergunta"><IconSymbol name="arrow.up" size={19} color={input.trim() || attachments.length ? "#FFFFFF" : colors.muted} /></Pressable></View></>}
        {confirmDelete && <View style={[styles.confirmOverlay, { backgroundColor: colors.background }]}><Text style={[styles.confirmTitle, { color: colors.foreground }]}>Apagar conversa?</Text><Text style={[styles.confirmBody, { color: colors.muted }]}>As mensagens serão removidas deste dispositivo. Isso funciona sem login e não pode ser desfeito.</Text><View style={styles.confirmActions}><Pressable onPress={() => setConfirmDelete(false)} style={[styles.confirmButton, { borderColor: colors.border }]}><Text style={[styles.confirmButtonText, { color: colors.foreground }]}>Cancelar</Text></Pressable><Pressable onPress={deleteConversation} style={[styles.confirmButton, { backgroundColor: colors.error, borderColor: colors.error }]}><Text style={styles.confirmButtonLight}>Apagar</Text></Pressable></View></View>}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, header: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingTop: 20, paddingBottom: 14 }, clearHistory: { alignSelf: "flex-end", paddingVertical: 5, paddingHorizontal: 4, marginBottom: 4 }, clearHistoryText: { fontSize: 13, fontWeight: "800" }, backToMenu: { paddingVertical: 4 }, kicker: { fontSize: 12, fontWeight: "800", letterSpacing: 1.3, marginBottom: 6 }, title: { fontSize: 32, lineHeight: 39, fontWeight: "800", letterSpacing: -0.6 }, status: { flexDirection: "row", gap: 6, alignItems: "center", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 99, marginBottom: 3 }, dot: { width: 7, height: 7, backgroundColor: "#17A66E", borderRadius: 4 }, statusText: { color: "#167C55", fontSize: 12, fontWeight: "800" }, topicMenu: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 9, marginBottom: 10 }, menuTitle: { fontSize: 17, fontWeight: "800", marginBottom: 2 }, topicButton: { borderWidth: 1, borderRadius: 13, padding: 12, gap: 3 }, topicTitle: { fontSize: 14, fontWeight: "800" }, topicText: { fontSize: 12, lineHeight: 17 }, modeHint: { fontSize: 11, marginBottom: 4 }, messages: { flex: 1 }, messageContent: { paddingBottom: 24, gap: 13 }, messageRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, maxWidth: "94%" }, userRow: { alignSelf: "flex-end" }, avatar: { width: 32, height: 32, borderRadius: 11, alignItems: "center", justifyContent: "center" }, avatarText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" }, bubble: { flexShrink: 1, minWidth: 0, borderRadius: 18, paddingHorizontal: 15, paddingVertical: 13, maxWidth: "100%" }, messageText: { fontSize: 15, lineHeight: 23 }, attachmentLabel: { fontSize: 12, fontWeight: "800", marginBottom: 6 }, messageActions: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 12 }, actionButton: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 7 }, actionText: { fontSize: 12, fontWeight: "800" }, sourceNote: { fontSize: 11, marginTop: 8, fontStyle: "italic" }, chatGuide: { borderWidth: 1, borderRadius: 16, padding: 15, marginTop: 7 }, chatGuideTitle: { fontWeight: "800", marginBottom: 6 }, chatGuideText: { lineHeight: 20 }, attachmentTray: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 5 }, attachmentTrayText: { flex: 1, fontSize: 12 }, composer: { flexShrink: 0, minHeight: 58, borderWidth: 1, borderRadius: 18, flexDirection: "row", alignItems: "center", paddingLeft: 6, paddingRight: 6, marginTop: 4 }, attachButton: { width: 42, height: 44, alignItems: "center", justifyContent: "center" }, input: { flex: 1, maxHeight: 100, fontSize: 15, paddingTop: 10, paddingBottom: 10 }, sendButton: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" }, disclaimer: { fontSize: 11, textAlign: "center", lineHeight: 16, paddingVertical: 8 }, confirmOverlay: { position: "absolute", left: 12, right: 12, bottom: 72, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: "#CBD5D0", shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 12, elevation: 8 }, confirmTitle: { fontSize: 20, fontWeight: "800" }, confirmBody: { fontSize: 14, lineHeight: 21, marginTop: 8 }, confirmActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10 }, confirmButton: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 11 }, confirmButtonText: { fontSize: 14, fontWeight: "800" }, confirmButtonLight: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" }, pressed: { opacity: 0.75 },
});
