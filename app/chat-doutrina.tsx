import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type Message = { role: "user" | "assistant"; content: string };
const MAX_QUESTION_LENGTH = 10000;

const INTRO: Message = {
  role: "assistant",
  content: "Olá! Sou o Professor Doutrinário. Posso ajudar você a estudar à luz das Escrituras todas as doutrinas da Igreja Adventista da Promessa. Faça sua pergunta sobre qualquer um dos 31 pontos.",
};

export default function DoctrinalChatScreen() {
  const colors = useColors();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const mutation = trpc.doctrinalChat.ask.useMutation();

  useEffect(() => {
    AsyncStorage.getItem("promessams:doctrinal-chat").then((value) => {
      if (value) setMessages(JSON.parse(value));
    });
  }, []);

  useEffect(() => {
    if (messages.length) void AsyncStorage.setItem("promessams:doctrinal-chat", JSON.stringify(messages.slice(-30)));
  }, [messages]);

  const visibleMessages = useMemo(() => messages.length ? messages : [INTRO], [messages]);

  async function sendMessage() {
    const clean = input.trim();
    if (!clean || mutation.isPending) return;
    const next = [...messages, { role: "user" as const, content: clean }];
    setInput("");
    setMessages(next);
    try {
      const result = await mutation.mutateAsync({ messages: next });
      setMessages([...next, { role: "assistant", content: result.answer }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Não foi possível responder agora. Consulte o estudo correspondente em O Doutrinal e converse com a liderança local." }]);
    }
  }

  function clearConversation() {
    setMessages([]);
    void AsyncStorage.removeItem("promessams:doctrinal-chat");
  }

  return (
    <ScreenContainer className="px-4" edges={["top", "left", "right"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button"><Text style={[styles.back, { color: colors.primary }]}>‹ Voltar</Text></Pressable>
          <Text style={[styles.kicker, { color: colors.primary }]}>O DOUTRINAL</Text>
          {!!messages.length && <Pressable onPress={clearConversation}><Text style={[styles.clear, { color: colors.error }]}>Apagar</Text></Pressable>}
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Professor Doutrinário</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Se aprofunde na doutrina bíblica da promessa.</Text>
        <ScrollView style={styles.messages} contentContainerStyle={styles.messageContent} showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
          {visibleMessages.map((message, index) => <View key={`${index}-${message.role}`} style={[styles.row, message.role === "user" && styles.userRow]}>
            {message.role === "assistant" && <View style={[styles.avatar, { backgroundColor: colors.primary }]}><Text style={styles.avatarText}>B</Text></View>}
            <View style={[styles.bubble, message.role === "user" ? { backgroundColor: colors.primary } : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
              <Text style={[styles.message, { color: message.role === "user" ? "#FFFFFF" : colors.foreground }]}>{message.content}</Text>
            </View>
          </View>)}
          {mutation.isPending && <View style={styles.row}><View style={[styles.avatar, { backgroundColor: colors.primary }]}><Text style={styles.avatarText}>B</Text></View><View style={[styles.bubble, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}><ActivityIndicator color={colors.primary} /></View></View>}
        </ScrollView>
        <View style={[styles.composer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput value={input} onChangeText={setInput} placeholder="Pergunte sobre a doutrina..." placeholderTextColor={colors.muted} multiline maxLength={MAX_QUESTION_LENGTH} style={[styles.input, { color: colors.foreground }]} onSubmitEditing={() => void sendMessage()} returnKeyType="send" />
          <Pressable onPress={() => void sendMessage()} style={({ pressed }) => [styles.send, { backgroundColor: input.trim() ? colors.primary : colors.border }, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Enviar pergunta doutrinária"><Text style={styles.sendText}>↑</Text></Pressable>
        </View>
        <Text style={[styles.limitHint, { color: colors.muted }]}>Máximo de 10.000 caracteres por pergunta · {input.length.toLocaleString("pt-BR")} usados</Text>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 18, paddingBottom: 10 },
  back: { fontSize: 14, fontWeight: "800" },
  kicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  clear: { fontSize: 12, fontWeight: "800" },
  title: { fontSize: 27, lineHeight: 33, fontWeight: "800", letterSpacing: -0.4 },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: 5 },
  messages: { flex: 1, marginTop: 14 },
  messageContent: { paddingBottom: 15, gap: 12 },
  row: { flexDirection: "row", alignItems: "flex-end", gap: 8, maxWidth: "94%" },
  userRow: { alignSelf: "flex-end" },
  avatar: { width: 31, height: 31, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  bubble: { borderRadius: 17, paddingHorizontal: 14, paddingVertical: 12, maxWidth: "100%" },
  message: { fontSize: 15, lineHeight: 22 },
  composer: { borderWidth: 1, borderRadius: 17, minHeight: 54, flexDirection: "row", alignItems: "flex-end", padding: 7, marginBottom: 8 },
  input: { flex: 1, minHeight: 38, maxHeight: 120, paddingHorizontal: 9, paddingVertical: 8, fontSize: 15 },
  send: { width: 39, height: 39, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  sendText: { color: "#FFFFFF", fontSize: 22, fontWeight: "800" },
  limitHint: { fontSize: 10, lineHeight: 14, textAlign: "right", marginTop: 4, marginBottom: 4 },
  pressed: { opacity: 0.78 },
});
