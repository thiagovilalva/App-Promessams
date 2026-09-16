import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("accessibility and sharing features", () => {
  it("exposes copy, share and listen actions in chat", () => {
    const source = read("app/(tabs)/chat.tsx");
    expect(source).toContain("copyAnswer");
    expect(source).toContain("shareAnswer");
    expect(source).toContain("toggleSpeech");
    expect(source).toContain("Speech.pause");
    expect(source).toContain("Ouvir resposta");
  });

  it("exposes the official Manus invitation and WhatsApp contact", () => {
    const account = read("app/conta.tsx");
    const home = read("app/(tabs)/index.tsx");
    expect(account).toContain("L6X1HAEPGOFARG");
    expect(home).toContain("5567999132610");
  });

  it("provides persistent text-size accessibility settings", () => {
    expect(read("app/acessibilidade.tsx")).toContain("Muito grande");
    expect(read("lib/accessibility-provider.tsx")).toContain("sementes:text-scale");
  });
});
