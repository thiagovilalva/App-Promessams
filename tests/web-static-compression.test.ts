import { afterEach, describe, expect, it } from "vitest";
import express from "express";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { AddressInfo } from "node:net";
import { brotliCompressSync, gzipSync } from "node:zlib";
import { registerWebStatic } from "../server/web-static";
const dirs: string[] = [];
afterEach(() => dirs.splice(0).forEach(d => rmSync(d, { recursive: true, force: true })));
async function withApp(run: (base: string) => Promise<void>) {
  const dir = mkdtempSync(path.join(tmpdir(), "promessams-static-")); dirs.push(dir);
  const html = '<html><body>Igrejas · PromessaMS</body></html>';
  writeFileSync(path.join(dir, "igrejas.html"), html);
  writeFileSync(path.join(dir, "igrejas.html.br"), brotliCompressSync(html));
  mkdirSync(path.join(dir, "_expo"));
  const asset = path.join(dir, "_expo", "entry-1234567890abcdef1234567890abcdef.js");
  const js = 'console.log("PromessaMS");'; writeFileSync(asset, js); writeFileSync(asset + ".gz", gzipSync(js));
  const app = express(); app.get("/api/health", (_q,r) => r.json({ ok: true })); registerWebStatic(app, dir);
  const server = app.listen(0); const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try { await run(base); } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
}
describe("compressed static website", () => {
  it("serves the real exported route, Brotli with correct type and revalidated HTML", async () => {
    await withApp(async base => {
      const r = await fetch(`${base}/igrejas?theme=dark`, { headers: { "Accept-Encoding": "br" } });
      expect(r.status).toBe(200); expect(r.headers.get("content-encoding")).toBe("br");
      expect(r.headers.get("content-type")).toContain("text/html"); expect(r.headers.get("cache-control")).toBe("no-cache");
      expect(r.headers.get("vary")).toContain("Accept-Encoding"); expect(await r.text()).toContain("Igrejas · PromessaMS");
    });
  });
  it("serves hashed assets with long cache and gzip, while keeping API uncompressed", async () => {
    await withApp(async base => {
      const r = await fetch(`${base}/_expo/entry-1234567890abcdef1234567890abcdef.js`, { headers: { "Accept-Encoding": "gzip" } });
      expect(r.headers.get("content-encoding")).toBe("gzip"); expect(r.headers.get("cache-control")).toContain("immutable");
      expect(r.headers.get("content-type")).toContain("javascript"); expect(await r.text()).toContain("console.log");
      const api = await fetch(`${base}/api/health`); expect(await api.json()).toEqual({ ok: true }); expect(api.headers.get("content-encoding")).toBeNull();
    });
  });
  it("falls back to uncompressed content when requested", async () => {
    await withApp(async base => {
      const r = await fetch(`${base}/igrejas`, { headers: { "Accept-Encoding": "identity" } });
      expect(r.status).toBe(200); expect(r.headers.get("content-encoding")).toBeNull(); expect(await r.text()).toContain("Igrejas");
    });
  });
});
