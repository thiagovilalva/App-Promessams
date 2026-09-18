import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("requested product updates", () => {
  it("formats PIX input as cents and removes the invitation from offers", () => {
    const source = read("app/(tabs)/ofertas.tsx");
    expect(source).toContain("Number(amountDigits) / 100");
    expect(source).toContain("1000 = R$ 10,00");
    expect(source).toContain("react-native-qrcode-svg");
    expect(source).toContain("<QRCode value={payload}");
    expect(source).not.toContain("Junte-se ao Manus");
  });
  it("moves the chat composer with the Android keyboard", () => {
    expect(read("app/(tabs)/chat.tsx")).toContain('behavior="padding"');
    expect(read("app.config.ts")).toContain('softwareKeyboardLayoutMode: "resize"');
  });
  it("places WhatsApp and accessibility access on the home screen", () => {
    const source = read("app/(tabs)/index.tsx");
    expect(source).toContain("wa.me/5567999132610");
    expect(source).toContain("/acessibilidade");
    expect(source).toContain("accessibility");
    expect(source).toContain("Tire suas dúvidas aqui");
    expect(source).toContain(">Conteúdos</Text>");
    expect(source).toContain("Filosofia da Semente e projeto.");
    expect(source).not.toContain(">Perguntar</Text>");
    expect(source).not.toContain("Conteúdo de trabalho da Convenção");
    expect(source).not.toContain(">Ver tudo</Text>");
  });
  it("adds the Promessa radio player above the WhatsApp contact", () => {
    const source = read("app/(tabs)/index.tsx");
    expect(source).toContain("Rádio da Promessa");
    expect(source).toContain("useRadio");
    expect(source).toContain("stop.fill");
    expect(source).toContain("radio-da-promessa-correta.jpg");
    const provider = read("lib/radio-provider.tsx");
    expect(provider).toContain("https://player.srvstm.com/proxy/30368");
    expect(provider).toContain("shouldPlayInBackground: true");
    expect(provider).toContain("keepAudioSessionActive: true");
  });
  it("uses the official Projeto Sementes symbol in the home header", () => {
    const source = read("app/(tabs)/index.tsx");
    expect(source).toContain("projeto-sementes-logo.png");
    expect(fs.existsSync(path.join(process.cwd(), "assets/images/projeto-sementes-logo.png"))).toBe(true);
  });
  it("uses the official symbol as the installed app icon", () => {
    const config = read("app.config.ts");
    expect(config).toContain('icon: "./assets/images/icon.png"');
    expect(config).toContain('foregroundImage: "./assets/images/android-icon-foreground.png"');
    expect(fs.existsSync(path.join(process.cwd(), "assets/images/icon.png"))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), "assets/images/android-icon-foreground.png"))).toBe(true);
  });
  it("uses the supplied mission image on the offers page", () => {
    expect(read("app/(tabs)/ofertas.tsx")).toContain("ofertas-missao.png");
  });
  it("supports account choices, speech pause/resume, reading plan and revised project document", () => {
    expect(read("app/conta.tsx")).toContain("Criar conta na Manus");
    expect(read("app/(tabs)/chat.tsx")).toContain("Speech.pause");
    expect(read("app/(tabs)/chat.tsx")).toContain("Speech.resume");
    const home = read("app/(tabs)/index.tsx");
    const plan = read("app/plano-biblico.tsx");
    expect(plan).toContain("Bíblia & Devocionais");
    expect(home).toContain("Devocionais na Palavra");
    expect(plan).toContain("Abrir Bíblia Livre</Text>");
    expect(plan).not.toContain("LEITURA {String(index + 1)");
    expect(read("shared/knowledge.ts")).toContain("Projeto Sementes — documento integral revisado");
  });
});
