import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { PRIVACY_POLICY_URL } from "../shared/privacy";

describe("Política de Privacidade", () => {
  it("usa uma URL pública HTTPS do domínio do app", () => {
    expect(PRIVACY_POLICY_URL).toBe("https://sementesapp-8jp8nwu7.manus.space/politica-privacidade.html");
    expect(PRIVACY_POLICY_URL).toMatch(/^https:\/\//);
  });

  it("contém os disclosures essenciais para a Play Console", () => {
    const page = readFileSync(resolve(process.cwd(), "app/politica-privacidade.tsx"), "utf8");
    for (const text of ["Dados que podem ser tratados", "Como usamos os dados", "Compartilhamento e prestadores", "Segurança", "Seus direitos e solicitações", "Contato"]) {
      expect(page).toContain(text);
    }
  });
});
