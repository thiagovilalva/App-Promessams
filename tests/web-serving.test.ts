import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("web deployment bundle", () => {
  it("keeps the exported Expo website available for the production server", () => {
    const indexPath = path.join(process.cwd(), "web-dist", "index.html");
    expect(fs.existsSync(indexPath)).toBe(true);
    const html = fs.readFileSync(indexPath, "utf8");
    expect(html).toContain("<div id=\"root\">");
    expect(html).toContain("entry-");
  });
});
