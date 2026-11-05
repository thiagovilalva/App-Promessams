import * as Clipboard from "expo-clipboard";
import { Alert, Platform, Share } from "react-native";

export async function copyChatResponse(text: string) {
  try {
    await Clipboard.setStringAsync(text);
    Alert.alert("Texto copiado", "A resposta foi copiada para a área de transferência.");
  } catch {
    Alert.alert("Não foi possível copiar", "Selecione o texto da resposta para copiar manualmente.");
  }
}

export async function shareChatResponse(text: string, title = "PromessaMS") {
  try {
    if (Platform.OS === "web") {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title, text });
      } else {
        await Clipboard.setStringAsync(text);
        Alert.alert("Resposta copiada para compartilhar", "Cole o texto no WhatsApp, e-mail ou aplicativo de sua preferência.");
      }
      return;
    }
    await Share.share({ message: text, title });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return;
    Alert.alert("Não foi possível compartilhar", "Use a opção Copiar e cole a resposta no aplicativo desejado.");
  }
}
