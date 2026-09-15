import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("chat mobile reading experience", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "app/(tabs)/chat.tsx"), "utf8");

  it("keeps a single conversation scroll container for long answers", () => {
    expect(source).not.toContain("nestedScrollEnabled");
    expect(source).not.toContain("maxHeight: 260");
    expect(source).toContain("onContentSizeChange");
  });

  it("offers local conversation deletion without requiring authentication", () => {
    expect(source).toContain("Apagar conversa");
    expect(source).toContain('AsyncStorage.removeItem("sementes:chat")');
  });
});
