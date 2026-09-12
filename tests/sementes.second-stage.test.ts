import { describe, expect, it } from "vitest";

import { FULL_DOCUMENT_TEXT } from "../shared/full-document";
import { CONTENT_MODULES } from "../shared/knowledge";
import { buildPixPayload, PIX_KEY } from "../shared/pix";

describe("Projeto Sementes second stage", () => {
  it("bundles the complete source document in the offline knowledge base", () => {
    expect(FULL_DOCUMENT_TEXT.length).toBeGreaterThan(60000);
    expect(FULL_DOCUMENT_TEXT).toContain("Filosofia da Semente");
    expect(FULL_DOCUMENT_TEXT).toContain("13. Indicadores e avaliação");
    expect(CONTENT_MODULES.find((module) => module.id === "documento-integral")?.body).toBe(FULL_DOCUMENT_TEXT);
  });

  it("generates a valid-looking Pix Copia e Cola payload with the official key", () => {
    const payload = buildPixPayload(35.5);
    expect(payload).toContain(PIX_KEY);
    expect(payload).toContain("540535.50");
    expect(payload.startsWith("000201")).toBe(true);
    expect(payload).toMatch(/6304[0-9A-F]{4}$/);
  });

  it("generates a no-fixed-amount payload when no amount is supplied", () => {
    const payload = buildPixPayload();
    expect(payload).toContain(PIX_KEY);
    expect(payload).not.toContain("5405");
  });
});
