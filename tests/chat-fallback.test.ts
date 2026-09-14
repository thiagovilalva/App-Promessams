import { describe, expect, it } from "vitest";

import { fallbackAnswer, needsOnlineResearch } from "../shared/chat-fallback";

describe("chat fallback", () => {
  it("answers the common philosophy versus project question without the LLM", () => {
    const answer = fallbackAnswer("Qual a diferença entre filosofia e projeto?");
    expect(answer).toContain("Filosofia da Semente");
    expect(answer).toContain("Projeto Sementes");
    expect(answer.length).toBeGreaterThan(120);
  });

  it("returns a useful starting guide when the AI service is unavailable", () => {
    expect(fallbackAnswer("Como começar na minha igreja?")).toContain("oração");
    expect(fallbackAnswer("Tenho uma dúvida")).toContain("Filosofia da Semente");
  });

  it("only requests online research for current or explicitly external questions", () => {
    expect(needsOnlineResearch("Como formar novos líderes?")).toBe(false);
    expect(needsOnlineResearch("Pesquise na internet notícias atuais sobre o tema")).toBe(true);
  });
});
