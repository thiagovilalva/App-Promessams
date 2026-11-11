import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { HOSTED_PAGES, REPORTS_URL, resolveHostedDestination } from "../shared/hosted-pages";
const read = (file: string) => fs.readFileSync(file, "utf8");
describe("hosted reports and updated home", () => {
  it("retains the current origin and allows only owned page paths", () => {
    expect(REPORTS_URL).toBe("https://sementesapp-8jp8nwu7.manus.space/relatorios");
    expect(HOSTED_PAGES.relatorios.requiresAuth).toBe(true);
    expect(resolveHostedDestination("/relatorios")).toBe("/relatorios");
    for (const value of ["https://evil.example", "//evil.example", "/admin", "/relatorios?token=x"]) expect(resolveHostedDestination(value)).toBeUndefined();
  });
  it("shows reports only after login and has a route back to Home", () => {
    const account = read("app/conta.tsx");
    expect(account).toContain("{user && <Pressable"); expect(account).toContain("RELATÓRIOS");
    expect(account).toContain('accessibilityLabel="Voltar à tela inicial"');
    expect(read("server/routers.ts")).toContain("list: adminProcedure.query(() => getConversationReport())");
  });
  it("loads native hosted pages without bearer tokens in URLs or scripts", () => {
    const page = read("app/pagina-web.tsx");
    expect(page).toContain('Authorization: `Bearer ${token}`');
    expect(page).toContain("sharedCookiesEnabled"); expect(page).not.toContain("injectedJavaScript");
    expect(page).not.toContain("?token="); expect(page).toContain('mixedContentMode="never"');
  });
  it("uses the requested home order, simplified account and secretary greeting", () => {
    const home = read("app/(tabs)/index.tsx");
    expect(home).not.toContain("Todos são enviados"); expect(home).not.toContain("Cuidado contínuo"); expect(home).not.toContain("Tire suas dúvidas aqui");
    expect(home.indexOf("Fale Com A Convenção")).toBeLessThan(home.indexOf("Entrar ou Criar Conta"));
    expect(home).toContain("Olá, Gostaria de conversar com a secretaria regional.");
    expect(read("components/ui/icon-symbol.tsx")).toContain('<FontAwesome name="whatsapp"');
  });
});
