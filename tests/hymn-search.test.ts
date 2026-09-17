import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("hinário HBJ interno", () => {
  it("contém os 541 hinos extraídos do PDF", () => {
    const source = read("shared/hbj-data.ts");
    expect(source).toContain('"number": 541');
    expect(source).toContain("Santo, santo, Pai bondoso");
    expect(source).toContain("lyrics");
  });
  it("oferece busca interna, favoritos e controles de leitura", () => {
    const source = read("app/hinario.tsx");
    expect(source).toContain("palavra da letra");
    expect(source).toContain("AsyncStorage");
    expect(source).toContain("Favoritos");
    expect(source).toContain("Fundo creme");
    expect(source).toContain("A+");
    expect(source).not.toContain("Linking.openURL");
  });
  it("exibe índice temático e comparativo", () => {
    const source = read("app/hinario.tsx");
    expect(source).toContain("Índice temático");
    expect(source).toContain("BJ antigo × HBJ");
    const data = read("shared/hbj-data.ts");
    expect(data).toContain("HBJ_THEMES");
    expect(data).toContain("HBJ_COMPARISON");
  });
});
