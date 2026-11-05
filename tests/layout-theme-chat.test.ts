import { describe, expect, it } from "vitest";
import fs from "node:fs";
const read = (file: string) => fs.readFileSync(file, "utf8");
describe("layout, product theme and response actions", () => {
  it("uses the product theme on both web and native", () => {
    const web = read("hooks/use-color-scheme.web.ts");
    expect(web).toContain("useThemeContext().colorScheme"); expect(web).not.toContain("useRNColorScheme");
    const provider = read("lib/theme-provider.tsx");
    expect(provider).toContain('get("theme")'); expect(provider).toContain('requested === "light" || requested === "dark"');
  });
  it("moves the complete church header into the scrolling list", () => {
    const churches = read("app/igrejas.tsx");
    expect(churches).toContain("ListHeaderComponent={<View style={styles.header}>");
    expect(churches).not.toContain("stickyHeaderIndices");
    expect(churches.indexOf("<FlatList")).toBeLessThan(churches.indexOf('accessibilityLabel="Buscar igrejas"'));
  });
  it("adds the church card beside the doctrine shortcut and compacts community", () => {
    const home = read("app/(tabs)/index.tsx");
    expect(home).toContain("Compreenda a Doutrina."); expect(home).toContain('accessibilityLabel="Abrir endereços das igrejas"');
    expect(home).toContain('page: "igrejas", returnTo: "home"'); expect(home).toContain("Programas & Comunidade");
    expect(home).not.toContain("Programas, Igrejas e Comunidade");
    expect(read("components/ui/icon-symbol.tsx")).toContain('"building.2.crop.circle": "church"');
  });
  it("shows only listening on the guide intro, copying/sharing only after interaction", () => {
    const guide = read("app/(tabs)/chat.tsx");
    expect(guide).toContain('<View style={styles.messageActions}>{messages.length > 0 && <>');
    expect(guide).toContain('>Compartilhar</Text></Pressable></>}<Pressable onPress={() => void toggleSpeech');
  });
  it("removes document export entirely and adds doctrine response copy/share", () => {
    const doc = read("app/chat-doutrina.tsx");
    for (const old of ["exportAnswer", "Baixar DOC", "Salvar PDF", "window.open", "document.write"]) expect(doc).not.toContain(old);
    expect(doc).toContain('message.role === "assistant" && messages.length > 0');
    expect(doc).toContain("copyChatResponse(message.content)"); expect(doc).toContain("shareChatResponse(message.content");
  });
  it("passes theme but never a credential to public hosted page URLs", () => {
    const page = read("app/pagina-web.tsx");
    expect(page).toContain('?theme=${colorScheme}'); expect(page).toContain('definition.requiresAuth ? await getSessionToken() : null');
    expect(page).not.toContain("?token="); expect(page).toContain('returnTo === "home" ? "/"');
  });
});
