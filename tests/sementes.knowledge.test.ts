import { describe, expect, it } from "vitest";

import { CONTENT_MODULES, SEMENTES_KNOWLEDGE } from "../shared/knowledge";
import { appRouter } from "../server/routers";

describe("Projeto Sementes knowledge base", () => {
  it("exposes the core learning journey for offline reading", () => {
    expect(CONTENT_MODULES.length).toBeGreaterThanOrEqual(6);
    expect(CONTENT_MODULES.map((module) => module.id)).toEqual(expect.arrayContaining(["filosofia", "distincao", "principios", "jornada", "igreja-viva", "lideranca"]));
    expect(CONTENT_MODULES.every((module) => module.body.length > 80 && module.scripture.length > 0 && module.practice.length > 0)).toBe(true);
  });

  it("prioritizes the project pillars in the assistant context", () => {
    expect(SEMENTES_KNOWLEDGE).toContain("Cristo");
    expect(SEMENTES_KNOWLEDGE).toContain("Palavra");
    expect(SEMENTES_KNOWLEDGE).toContain("cuidado contínuo");
    expect(SEMENTES_KNOWLEDGE).toContain("multiplicação saudável");
  });

  it("keeps the public chat endpoint available without authentication", () => {
    expect(appRouter._def.procedures).toHaveProperty("chat.ask");
  });
});
