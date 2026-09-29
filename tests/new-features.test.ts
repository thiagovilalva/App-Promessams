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
  it("copies PIX payloads through the native Android clipboard", () => {
    const source = read("app/(tabs)/ofertas.tsx");
    expect(source).toContain('import * as Clipboard from "expo-clipboard"');
    expect(source).toContain("await Clipboard.setStringAsync(value)");
    expect(source).toContain('Alert.alert("Copiado"');
    expect(source).not.toContain("Alert.alert(label, value");
  });
  it("makes the devotional, Bible, hymnal and regional ministries libraries available to chat", () => {
    const router = read("server/routers.ts");
    const library = read("shared/chat-library.ts");
    expect(router).toContain("buildLibraryContext");
    expect(router).toContain("buildBibleReferenceContext");
    expect(library).toContain("PAO_DIARIO_DAYS");
    expect(library).toContain("HBJ_HYMNS");
    expect(library).toContain("READING_PLAN");
    expect(library).toContain("REGIONAL_MINISTRIES_DOCUMENT");
    expect(library).toContain("https://bible.helloao.org/api/por_blj");
    expect(fs.existsSync(path.join(process.cwd(), "shared/regional-ministries-document.ts"))).toBe(true);
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
    const offers = read("app/(tabs)/ofertas.tsx");
    expect(offers).toContain("projeto-missional-horizontal.webp");
    expect(offers).toContain("backgroundColor: colors.surface");
  });
  it("updates offers, chat and content library wording", () => {
    const offers = read("app/(tabs)/ofertas.tsx");
    const chat = read("app/(tabs)/chat.tsx");
    const home = read("app/(tabs)/index.tsx");
    const contents = read("app/(tabs)/conteudos.tsx");
    const knowledge = read("shared/knowledge.ts");
    expect(offers).toContain("Oferta Missionária");
    expect(offers).toContain("manter e investir no Projeto Sementes junto às igrejas locais");
    expect(offers).not.toContain("Próximo passo: integrar");
    expect(chat).toContain("caminhos práticos para vivê-la");
    expect(home).not.toContain("Apoie o campo");
    expect(knowledge).toContain("filosofia-contextualizacao");
    expect(knowledge).toContain("projeto-territorio");
    expect((knowledge.match(/id: \"filosofia-/g) ?? []).length).toBeGreaterThanOrEqual(7);
    expect((knowledge.match(/id: \"projeto-/g) ?? []).length).toBeGreaterThanOrEqual(10);
  });
  it("integrates the 365-day Pão Diário with navigation, progress and notes", () => {
    const devotional = read("app/pao-diario.tsx");
    const data = read("shared/pao-diario-data.ts");
    const home = read("app/(tabs)/index.tsx");
    const plan = read("app/plano-biblico.tsx");
    expect(data).toContain('day": 1');
    expect(data).toContain('day": 365');
    expect(devotional).toContain("projeto-sementes.pao-diario.read");
    expect(devotional).toContain("projeto-sementes.pao-diario.notes");
    expect(devotional).toContain("progress");
    expect(devotional).toContain("Escolher dia ou tema");
    expect(home).toContain('router.push("/pao-diario")');
    expect(plan).toContain('router.push("/pao-diario")');
  });
  it("groups the official HBJ thematic index into expandable topics", () => {
    const hymnary = read("app/hinario.tsx");
    expect(hymnary).toContain("groupedThemes");
    expect(hymnary).toContain("themeTopic");
    expect(hymnary).toContain("themeHeaderText");
    expect(hymnary).toContain("Voltar para Início");
    expect(hymnary).toContain("Hinário HBJ");
  });
  it("keeps the selected devotional day visible on mobile and exposes themes", () => {
    const devotional = read("app/pao-diario.tsx");
    expect(devotional).toContain("key={`day-${day.day}`}");
    expect(devotional).toContain("Aproveite Cada Dia!");
    expect(devotional).toContain("Pão Diário</Text>");
    expect(devotional).toContain("themeFor");
    expect(devotional).toContain("‹ Início");
  });
  it("uses the PromessaMS identity and the revised project document", () => {
    const config = read("app.config.ts");
    expect(config).toContain('name: "PromessaMS"');
    expect(config).toContain('slug: "promessams"');
    const projectConfig = JSON.parse(read(".project-config.json"));
    expect(projectConfig.secrets.VITE_APP_TITLE).toBe("PromessaMS");
    expect(read("app/(tabs)/index.tsx")).toContain(">PromessaMS</Text>");
    const document = read("shared/project-full-document.ts");
    expect(document).toContain("PROJETO SEMENTES");
    expect(document).toContain("Expressão prática e funcional da Filosofia da Semente");
    expect(document).toContain("5.5. Co-pastorado pastoral integral");
    expect(fs.existsSync(path.join(process.cwd(), "assets/documents/Projeto_Sementes_Revisado11092026.pdf"))).toBe(true);
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
