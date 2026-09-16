import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Speech from "expo-speech";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAccessibility, type SpeechVoiceGender } from "@/lib/accessibility-provider";
import { trpc } from "@/lib/trpc";

type Attachment = { name: string; mimeType?: string; text?: string; dataUrl?: string };
type Message = { role: "user" | "assistant"; content: string; researched?: boolean; attachments?: Attachment[] };

const starters = ["Como começar o Projeto Sementes na minha igreja?", "Qual a diferença entre filosofia e projeto?", "Como acompanhar alguém sem pressionar?", "Como formar novos líderes?"];
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
  const { textScale, speechRate, speechVoice } = useAccessibility();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);
  const [speechPaused, setSpeechPaused] = useState(false);
  const messagesScrollRef = useRef<ScrollView>(null);
  const mutation = trpc.chat.ask.useMutation();

  useEffect(() => { AsyncStorage.getItem("sementes:chat").then((value) => { if (value) setMessages(JSON.parse(value)); }); }, []);
  useEffect(() => { if (messages.length) void AsyncStorage.setItem("sementes:chat", JSON.stringify(messages.slice(-30))); }, [messages]);

  const visibleMessages = useMemo(() => messages.length ? messages : [{ role: "assistant" as const, content: "Olá! Eu sou o guia do Projeto Sementes. Posso ajudar você a compreender a filosofia, preparar uma conversa na igreja, encontrar um próximo passo ou refletir sobre uma situação de cuidado. Por onde começamos?" }], [messages]);

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
      const result = await mutation.mutateAsync({ messages: next.map(({ role, content, attachments: files }) => ({ role, content, ...(files?.length ? { attachments: files } : {}) })) });
      setMessages([...next, { role: "assistant", content: result.answer, researched: result.researched }]);
    } catch { setMessages([...next, { role: "assistant", content: offlineAnswer }]); }
  }

  async function copyAnswer(text: string) {
    await Clipboard.setStringAsync(text);
    Alert.alert("Texto copiado", "A resposta foi copiada para a área de transferência.");
  }

  async function shareAnswer(text: string) {
    try { await Share.share({ message: text, title: "Projeto Sementes" }); } catch (error) { console.warn("[Chat] share cancelled", error); }
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
    void AsyncStorage.removeItem("sementes:chat");
    setConfirmDelete(false);
  }

  return (
    <ScreenContainer className="px-4" edges={["top", "left", "right"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
        <View style={styles.header}><View><Text style={[styles.kicker, { color: colors.primary }]}>GUIA SEMENTES</Text><Text style={[styles.title, { color: colors.foreground }]}>Vamos conversar.</Text></View><View style={[styles.status, { backgroundColor: "#E9F7F0" }]}><View style={styles.dot} /><Text style={styles.statusText}>Online</Text></View></View>
        {!!messages.length && <Pressable onPress={() => setConfirmDelete(true)} style={styles.clearHistory} accessibilityRole="button" accessibilityLabel="Apagar conversa local"><Text style={[styles.clearHistoryText, { color: colors.primary }]}>Apagar conversa</Text></Pressable>}
        <ScrollView ref={messagesScrollRef} style={styles.messages} contentContainerStyle={styles.messageContent} showsVerticalScrollIndicator keyboardShouldPersistTaps="handled" onContentSizeChange={() => messagesScrollRef.current?.scrollToEnd({ animated: false })}>
          {visibleMessages.map((message, index) => <View key={`${index}-${message.role}`} style={[styles.messageRow, message.role === "user" && styles.userRow]}>
            {message.role === "assistant" && <View style={[styles.avatar, { backgroundColor: colors.primary }]}><Text style={styles.avatarText}>S</Text></View>}
            <View style={[styles.bubble, message.role === "user" ? { backgroundColor: colors.primary } : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
              {!!message.attachments?.length && <Text style={[styles.attachmentLabel, { color: message.role === "user" ? "#E8FAF2" : colors.primary }]}>Anexo: {message.attachments.map((file) => file.name).join(", ")}</Text>}
              <Text style={[styles.messageText, { color: message.role === "user" ? "#FFFFFF" : colors.foreground, fontSize: 15 * textScale, lineHeight: 23 * textScale }]}>{message.content}</Text>
              {message.role === "assistant" && <View style={styles.messageActions}><Pressable onPress={() => void copyAnswer(message.content)} style={[styles.actionButton, { borderColor: colors.border }]} accessibilityRole="button" accessibilityLabel="Copiar resposta"><IconSymbol name="doc.on.doc.fill" size={15} color={colors.primary} /><Text style={[styles.actionText, { color: colors.primary }]}>Copiar</Text></Pressable><Pressable onPress={() => void shareAnswer(message.content)} style={[styles.actionButton, { borderColor: colors.border }]} accessibilityRole="button" accessibilityLabel="Compartilhar resposta"><IconSymbol name="share" size={15} color={colors.primary} /><Text style={[styles.actionText, { color: colors.primary }]}>Compartilhar</Text></Pressable><Pressable onPress={() => void toggleSpeech(message.content, `message-${index}`)} style={[styles.actionButton, { borderColor: speakingKey === `message-${index}` ? colors.primary : colors.border }]} accessibilityRole="button" accessibilityLabel={speakingKey === `message-${index}` && !speechPaused ? "Pausar resposta" : speakingKey === `message-${index}` ? "Continuar resposta" : "Ouvir resposta"}><IconSymbol name="volume.up" size={15} color={colors.primary} /><Text style={[styles.actionText, { color: colors.primary }]}>{speakingKey === `message-${index}` ? (speechPaused ? "Continuar" : "Pausar") : "Ouvir"}</Text></Pressable></View>}
              {message.researched && <Text style={[styles.sourceNote, { color: colors.muted }]}>Resposta complementada por pesquisa online.</Text>}
            </View>
          </View>)}
          {mutation.isPending && <View style={styles.messageRow}><View style={[styles.avatar, { backgroundColor: colors.primary }]}><Text style={styles.avatarText}>S</Text></View><View style={[styles.bubble, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}><ActivityIndicator size="small" color={colors.primary} /></View></View>}
          {!messages.length && <View style={styles.starters}><Text style={[styles.starterLabel, { color: colors.muted, fontSize: 13 * textScale }]}>Perguntas para começar</Text>{starters.map((starter) => <Pressable key={starter} onPress={() => sendMessage(starter)} style={({ pressed }) => [styles.starter, { borderColor: colors.border, backgroundColor: colors.background }, pressed && styles.pressed]}><Text style={[styles.starterText, { color: colors.foreground, fontSize: 14 * textScale, lineHeight: 20 * textScale }]}>{starter}</Text><IconSymbol name="arrow.up.right" size={15} color={colors.primary} /></Pressable>)}</View>}
        </ScrollView>
        {!!attachments.length && <View style={[styles.attachmentTray, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.attachmentTrayText, { color: colors.foreground }]} numberOfLines={1}>{attachments.map((file) => file.name).join(" • ")}</Text><Pressable onPress={() => setAttachments([])}><Text style={{ color: colors.error, fontWeight: "800" }}>Remover</Text></Pressable></View>}
        <View style={[styles.composer, { backgroundColor: colors.surface, borderColor: colors.border }]}><Pressable onPress={pickAttachment} style={styles.attachButton} accessibilityRole="button" accessibilityLabel="Anexar imagem ou texto"><IconSymbol name="paperclip" size={20} color={colors.primary} /></Pressable><TextInput value={input} onChangeText={setInput} onSubmitEditing={() => sendMessage()} placeholder="Escreva sua pergunta..." placeholderTextColor={colors.muted} multiline maxLength={1000} style={[styles.input, { color: colors.foreground, fontSize: 15 * textScale }]} returnKeyType="send"/><Pressable onPress={() => sendMessage()} style={({ pressed }) => [styles.sendButton, { backgroundColor: input.trim() || attachments.length ? colors.primary : colors.border }, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Enviar pergunta"><IconSymbol name="arrow.up" size={19} color={input.trim() || attachments.length ? "#FFFFFF" : colors.muted} /></Pressable></View>
        <Text style={[styles.disclaimer, { color: colors.muted }]}>Anexe imagens ou textos para pedir uma análise mais específica.</Text>
        {confirmDelete && <View style={[styles.confirmOverlay, { backgroundColor: colors.background }]}><Text style={[styles.confirmTitle, { color: colors.foreground }]}>Apagar conversa?</Text><Text style={[styles.confirmBody, { color: colors.muted }]}>As mensagens serão removidas deste dispositivo. Isso funciona sem login e não pode ser desfeito.</Text><View style={styles.confirmActions}><Pressable onPress={() => setConfirmDelete(false)} style={[styles.confirmButton, { borderColor: colors.border }]}><Text style={[styles.confirmButtonText, { color: colors.foreground }]}>Cancelar</Text></Pressable><Pressable onPress={deleteConversation} style={[styles.confirmButton, { backgroundColor: colors.error, borderColor: colors.error }]}><Text style={styles.confirmButtonLight}>Apagar</Text></Pressable></View></View>}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, header: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingTop: 20, paddingBottom: 14 }, clearHistory: { alignSelf: "flex-end", paddingVertical: 5, paddingHorizontal: 4, marginBottom: 4 }, clearHistoryText: { fontSize: 13, fontWeight: "800" }, kicker: { fontSize: 12, fontWeight: "800", letterSpacing: 1.3, marginBottom: 6 }, title: { fontSize: 32, lineHeight: 39, fontWeight: "800", letterSpacing: -0.6 }, status: { flexDirection: "row", gap: 6, alignItems: "center", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 99, marginBottom: 3 }, dot: { width: 7, height: 7, backgroundColor: "#17A66E", borderRadius: 4 }, statusText: { color: "#167C55", fontSize: 12, fontWeight: "800" }, messages: { flex: 1 }, messageContent: { paddingBottom: 16, gap: 13 }, messageRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, maxWidth: "94%" }, userRow: { alignSelf: "flex-end" }, avatar: { width: 32, height: 32, borderRadius: 11, alignItems: "center", justifyContent: "center" }, avatarText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" }, bubble: { borderRadius: 18, paddingHorizontal: 15, paddingVertical: 13, maxWidth: "100%" }, messageText: { fontSize: 15, lineHeight: 23 }, attachmentLabel: { fontSize: 12, fontWeight: "800", marginBottom: 6 }, messageActions: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 12 }, actionButton: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 7 }, actionText: { fontSize: 12, fontWeight: "800" }, sourceNote: { fontSize: 11, marginTop: 8, fontStyle: "italic" }, starters: { gap: 9, marginTop: 7 }, starterLabel: { fontSize: 13, fontWeight: "700", marginBottom: 2 }, starter: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 12, minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, starterText: { fontSize: 14, lineHeight: 20, flex: 1, paddingRight: 8 }, attachmentTray: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 5 }, attachmentTrayText: { flex: 1, fontSize: 12 }, composer: { minHeight: 58, borderWidth: 1, borderRadius: 18, flexDirection: "row", alignItems: "center", paddingLeft: 6, paddingRight: 6, marginTop: 4 }, attachButton: { width: 42, height: 44, alignItems: "center", justifyContent: "center" }, input: { flex: 1, maxHeight: 100, fontSize: 15, paddingTop: 10, paddingBottom: 10 }, sendButton: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" }, disclaimer: { fontSize: 11, textAlign: "center", lineHeight: 16, paddingVertical: 8 }, confirmOverlay: { position: "absolute", left: 12, right: 12, bottom: 72, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: "#CBD5D0", shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 12, elevation: 8 }, confirmTitle: { fontSize: 20, fontWeight: "800" }, confirmBody: { fontSize: 14, lineHeight: 21, marginTop: 8 }, confirmActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 16 }, confirmButton: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 11 }, confirmButtonText: { fontSize: 14, fontWeight: "800" }, confirmButtonLight: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" }, pressed: { opacity: 0.75 },
});
