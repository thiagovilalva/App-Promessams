import { describe, expect, it } from "vitest";
import { mergeRemoteMaterials } from "../shared/remote-content";
import fs from "node:fs";

const material = (id: number, title: string, createdAt: string) => ({ id, title, category: "outros" as const, version: 1, summary: null, content: title, source: null, createdAt });

describe("arquitetura híbrida do PromessaMS", () => {
  it("prioriza o conteúdo online e mantém materiais do cache que ainda não foram retornados", () => {
    const cached = [material(1, "Versão offline", "2026-01-01T00:00:00.000Z"), material(2, "Somente cache", "2026-01-02T00:00:00.000Z")];
    const online = [material(1, "Versão online", "2026-01-03T00:00:00.000Z")];
    const result = mergeRemoteMaterials(online, cached);
    expect(result.map((item) => item.title)).toEqual(["Versão online", "Somente cache"]);
  });

  it("expõe manifesto público e cache persistente na biblioteca", () => {
    const router = fs.readFileSync("server/routers.ts", "utf8");
    const contents = fs.readFileSync("app/(tabs)/conteudos.tsx", "utf8");
    expect(router).toContain("manifest: publicProcedure");
    expect(contents).toContain("REMOTE_MATERIALS_CACHE_KEY");
    expect(contents).toContain("mergeRemoteMaterials");
  });
});
