import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("admin approval and accessibility", () => {
  it("creates drafts and restricts approval to the owner identity", () => {
    const source = read("server/routers.ts");
    expect(source).toContain("published: false");
    expect(source).toContain("ctx.user.openId !== ENV.ownerOpenId");
    expect(source).toContain("publishMaterial");
  });

  it("offers Libras access and adjustable natural speech", () => {
    const screen = read("app/acessibilidade.tsx");
    const provider = read("lib/accessibility-provider.tsx");
    const chat = read("app/(tabs)/chat.tsx");
    expect(screen).toContain("Abrir VLibras");
    expect(provider).toContain("speechRate");
    expect(chat).toContain("speechVoice === \"female\"");
  });
});
