import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("long answers and content sections", () => {
  it("uses a larger answer budget and continues truncated model output", () => {
    const source = read("server/routers.ts");
    expect(source).toContain("maxTokens: 2200");
    expect(source).toContain("completeAnswer");
    expect(source).toContain("looksIncomplete");
    expect(source).toContain("attempt < 4");
    expect(source).toContain("Continue exatamente do ponto");
  });

  it("provides separate philosophy and project selections", () => {
    const source = read("app/(tabs)/conteudos.tsx");
    expect(source).toContain("Filosofia da Semente");
    expect(source).toContain("Projeto Sementes");
    expect(source).toContain("visibleModules");
    expect(source).toContain("Compartilhar");
    expect(source).toContain("Copiar");
  });
});
