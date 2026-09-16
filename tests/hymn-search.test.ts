import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("hinário interno", () => {
  it("mantém um índice local para busca por número e título", () => {
    const source = read("shared/hymn-index.ts");
    expect(source).toContain("Santo, santo, Pai bondoso");
    expect(source).toContain("number");
    expect(source).toContain("title");
  });
  it("oferece busca e abre a letra dentro do aplicativo", () => {
    const source = read("app/hinario.tsx");
    expect(source).toContain("Buscar por número ou título");
    expect(source).toContain("selected.url");
    expect(source).toContain("WebView");
  });
  it("abre o hinário interno na tela inicial", () => {
    expect(read("app/(tabs)/index.tsx")).toContain('router.push("/hinario")');
  });
});
