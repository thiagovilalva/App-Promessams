import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type Message = { role: "user" | "assistant"; content: string; researched?: boolean };

const starters = ["Como começar o Projeto Sementes na minha igreja?", "Qual a diferença entre filosofia e projeto?", "Como acompanhar alguém sem pressionar?", "Como formar novos líderes?"];
const offlineAnswer = "Estou sem conexão neste momento. Você pode continuar lendo a biblioteca offline. Quando a internet voltar, envie sua pergunta novamente para receber uma orientação personalizada com a base do Projeto Sementes.";

export default function ChatScreen() {
  const colors = useColors();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const mutation = trpc.chat.ask.useMutation();

  useEffect(() => {
    AsyncStorage.getItem("sementes:chat").then((value) => {
      if (value) setMessages(JSON.parse(value));
    });
  }, []);

  useEffect(() => {
    if (messages.length) AsyncStorage.setItem("sementes:chat", JSON.stringify(messages.slice(-20)));
  }, [messages]);

  const visibleMessages = useMemo(() => messages.length ? messages : [{ role: "assistant" as const, content: "Olá! Eu sou o guia do Projeto Sementes. Posso ajudar você a compreender a filosofia, preparar uma conversa na igreja, encontrar um próximo passo ou refletir sobre uma situação de cuidado. Por onde começamos?" }], [messages]);

  async function sendMessage(text = input) {
    const clean = text.trim();
    if (!clean || mutation.isPending) return;
    setInput("");
    const next = [...messages, { role: "user" as const, content: clean }];
    setMessages(next);
    try {
      const result = await mutation.mutateAsync({ messages: next.map(({ role, content }) => ({ role, content })) });
      setMessages([...next, { role: "assistant", content: result.answer, researched: result.researched }]);
    } catch {
      setMessages([...next, { role: "assistant", content: offlineAnswer }]);
    }
  }

  return (
    <ScreenContainer className="px-4" edges={["top", "left", "right"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
        <View style={styles.header}><View><Text style={[styles.kicker, { color: colors.primary }]}>GUIA SEMENTES</Text><Text style={[styles.title, { color: colors.foreground }]}>Vamos conversar.</Text></View><View style={[styles.status, { backgroundColor: "#E9F7F0" }]}><View style={styles.dot} /><Text style={styles.statusText}>Online</Text></View></View>
        {!!messages.length && <Pressable onPress={() => { setMessages([]); void AsyncStorage.removeItem("sementes:chat"); }} style={styles.clearHistory}><Text style={[styles.clearHistoryText, { color: colors.primary }]}>Nova conversa</Text></Pressable>}
        <ScrollView style={styles.messages} contentContainerStyle={styles.messageContent} showsVerticalScrollIndicator={false}>
          {visibleMessages.map((message, index) => (
            <View key={`${index}-${message.role}`} style={[styles.messageRow, message.role === "user" && styles.userRow]}>
              {message.role === "assistant" && <View style={[styles.avatar, { backgroundColor: colors.primary }]}><Text style={styles.avatarText}>S</Text></View>}
              <View style={[styles.bubble, message.role === "user" ? { backgroundColor: colors.primary } : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}><Text style={[styles.messageText, { color: message.role === "user" ? "#FFFFFF" : colors.foreground }]}>{message.content}</Text>{message.researched && <Text style={[styles.sourceNote, { color: colors.muted }]}>Resposta complementada por pesquisa online.</Text>}</View>
            </View>
          ))}
          {mutation.isPending && <View style={styles.messageRow}><View style={[styles.avatar, { backgroundColor: colors.primary }]}><Text style={styles.avatarText}>S</Text></View><View style={[styles.bubble, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}><ActivityIndicator size="small" color={colors.primary} /></View></View>}
          <View style={styles.starters}><Text style={[styles.starterLabel, { color: colors.muted }]}>{messages.length ? "Perguntas rápidas" : "Perguntas para começar"}</Text>{starters.map((starter) => <Pressable key={starter} onPress={() => sendMessage(starter)} disabled={mutation.isPending} style={({ pressed }) => [styles.starter, { borderColor: colors.border, backgroundColor: colors.background }, pressed && styles.pressed]}><Text style={[styles.starterText, { color: colors.foreground }]}>{starter}</Text><IconSymbol name="arrow.up.right" size={15} color={colors.primary} /></Pressable>)}</View>
        </ScrollView>
        <View style={[styles.composer, { backgroundColor: colors.surface, borderColor: colors.border }]}><TextInput value={input} onChangeText={setInput} onSubmitEditing={() => sendMessage()} placeholder="Escreva sua pergunta..." placeholderTextColor={colors.muted} multiline maxLength={1000} style={[styles.input, { color: colors.foreground }]} returnKeyType="send"/><Pressable onPress={() => sendMessage()} style={({ pressed }) => [styles.sendButton, { backgroundColor: input.trim() ? colors.primary : colors.border }, pressed && styles.pressed]}><IconSymbol name="arrow.up" size={19} color={input.trim() ? "#FFFFFF" : colors.muted} /></Pressable></View>
        <Text style={[styles.disclaimer, { color: colors.muted }]}>Use o chat como apoio à reflexão e caminhe em diálogo com a liderança local.</Text>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingTop: 20, paddingBottom: 14 },
  clearHistory: { alignSelf: "flex-end", paddingVertical: 3, paddingHorizontal: 4, marginBottom: 4 },
  clearHistoryText: { fontSize: 11, fontWeight: "800" },
  kicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1.3, marginBottom: 6 },
  title: { fontSize: 29, lineHeight: 35, fontWeight: "800", letterSpacing: -0.6 },
  status: { flexDirection: "row", gap: 6, alignItems: "center", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 99, marginBottom: 3 },
  dot: { width: 7, height: 7, backgroundColor: "#17A66E", borderRadius: 4 },
  statusText: { color: "#167C55", fontSize: 11, fontWeight: "800" },
  messages: { flex: 1 },
  messageContent: { paddingBottom: 16, gap: 13 },
  messageRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, maxWidth: "94%" },
  userRow: { alignSelf: "flex-end" },
  avatar: { width: 28, height: 28, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, maxWidth: "100%" },
  messageText: { fontSize: 13, lineHeight: 20 },
  sourceNote: { fontSize: 10, marginTop: 8, fontStyle: "italic" },
  starters: { gap: 8, marginTop: 7 },
  starterLabel: { fontSize: 11, fontWeight: "700", marginBottom: 2 },
  starter: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 11, minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  starterText: { fontSize: 12, flex: 1, paddingRight: 8 },
  composer: { minHeight: 54, borderWidth: 1, borderRadius: 18, flexDirection: "row", alignItems: "center", paddingLeft: 14, paddingRight: 6, marginTop: 4 },
  input: { flex: 1, maxHeight: 90, fontSize: 13, paddingTop: 10, paddingBottom: 10 },
  sendButton: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  disclaimer: { fontSize: 10, textAlign: "center", lineHeight: 14, paddingVertical: 8 },
  pressed: { opacity: 0.75 },
});
