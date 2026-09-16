import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("requested product updates", () => {
  it("formats PIX input as cents and removes the invitation from offers", () => {
    const source = read("app/(tabs)/ofertas.tsx");
    expect(source).toContain("Number(amountDigits) / 100");
    expect(source).toContain("1000 = R$ 10,00");
    expect(source).not.toContain("Junte-se ao Manus");
  });
  it("places WhatsApp and accessibility access on the home screen", () => {
    const source = read("app/(tabs)/index.tsx");
    expect(source).toContain("wa.me/5567999132610");
    expect(source).toContain("/acessibilidade");
    expect(source).toContain("accessibility");
  });
  it("supports account choices, speech pause/resume, reading plan and revised project document", () => {
    expect(read("app/conta.tsx")).toContain("Criar conta na Manus");
    expect(read("app/(tabs)/chat.tsx")).toContain("Speech.pause");
    expect(read("app/(tabs)/chat.tsx")).toContain("Speech.resume");
    expect(read("app/plano-biblico.tsx")).toContain("LEITURA HERMENÊUTICA");
    expect(read("shared/knowledge.ts")).toContain("Projeto Sementes — documento integral revisado");
  });
});
