import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("accessibility and reading plan updates", () => {
  it("keeps accessibility only beside the theme toggle on home", () => {
    const source = read("app/(tabs)/index.tsx");
    expect(source).toContain("accessibilityButton");
    expect(source).not.toContain("accessibilityLink");
  });
  it("persists male/female voice selection and normalizes Bible references", () => {
    expect(read("lib/accessibility-provider.tsx")).toContain("speechVoice");
    expect(read("app/acessibilidade.tsx")).toContain("Voz feminina");
    expect(read("app/acessibilidade.tsx")).toContain("Voz masculina");
    expect(read("app/(tabs)/chat.tsx")).toContain("speechFriendlyText");
    expect(read("app/(tabs)/chat.tsx")).toContain("capítulo");
  });
  it("includes KJA reference notes, deeper theology and commentator dialogue", () => {
    const source = read("shared/reading-plan.ts");
    expect(source).toContain("Bíblia Livre (BLivre)");
    expect(source).toContain("Em diálogo com");
    expect(source).toContain("Craig Keener");
    expect(source).toContain("Gordon Fee");
    expect(read("app/plano-biblico.tsx")).toContain("EM DIÁLOGO COM COMENTARISTAS");
    expect(read("app/plano-biblico.tsx")).toContain("TEXTO BÍBLICO — BLIVRE");
    expect(read("app/plano-biblico.tsx")).toContain("blivre.org");
    expect(read("app/(tabs)/chat.tsx")).toContain("maleHints");
    expect(read("app/biblia-livre.tsx")).toContain("nestedScrollEnabled");
    expect(read("app/biblia-livre.tsx")).toContain("chapterOptions");
    expect(source).not.toContain("deve ser consultado");
    expect(source).toContain("Bíblia Livre (BLivre)");
  });
});
