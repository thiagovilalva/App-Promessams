import { describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import type { AddressInfo } from "node:net";
import { RADIO_PROGRAMS, REGIONAL_CHURCHES } from "../shared/radio-community";
import { parseRadioCatalog, readRadioCatalogResponse, musicRequestSchema, registerRadioMusicRoutes } from "../server/radio-music";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
const sample = { data: [["<i></i> Canção", '<button onclick=\'pedir("Cancao_da_Promessa.mp3")\'>Pedir</button>']] };

describe("radio directory and startup regressions", () => {
  it("bundles all source programs and churches with valid contacts", () => {
    expect(RADIO_PROGRAMS).toHaveLength(5);
    expect(REGIONAL_CHURCHES).toHaveLength(35);
    expect(RADIO_PROGRAMS[0]).toMatchObject({ name: "Manhã com Deus", host: "Pastor Emerson Muniz", schedule: "De segunda a sexta-feira · 08:00–10:00" });
    expect(REGIONAL_CHURCHES[0]).toMatchObject({ name: "IAP Vila Antunes", city: "Campo Grande/MS" });
    for (const church of REGIONAL_CHURCHES) expect(church.mapUrl).toMatch(/^https:\/\/maps\.app\.goo\.gl\//);
  });
  it("renders real native screens, without embedding or redirecting to the radio site", () => {
    const page = read("app/radio-promessa.tsx");
    expect(page).not.toMatch(/useRadio|playButton|TIMER_OPTIONS|WebView|promessams-gt8vmutx/);
    for (const file of ["programacao", "igrejas", "pedir-musica"]) {
      const screen = read(`app/${file}.tsx`);
      expect(page).toContain(`"/${file}"`);
      expect(screen).toContain("ScreenContainer");
      expect(screen).not.toContain("promessams-gt8vmutx");
    }
  });
  it("never changes the root hook count when fonts finish loading", () => {
    const layout = read("app/_layout.tsx");
    const guard = layout.indexOf("if (!fontsLoaded) return null");
    expect(guard).toBeGreaterThan(layout.lastIndexOf("useState("));
    expect(guard).toBeGreaterThan(layout.lastIndexOf("useMemo("));
    expect(guard).toBeGreaterThan(layout.lastIndexOf("useEffect("));
    expect(guard).toBeGreaterThan(layout.lastIndexOf("useCallback("));
  });
  it("retains the architecture required by Reanimated 4 and initializes audio only after Play and excludes unused video binaries", () => {
    const config = read("app.config.ts");
    const pkg = JSON.parse(read("package.json"));
    expect(config).toContain("newArchEnabled: true");
    expect(config).toContain("versionCode: 23");
    expect(pkg.dependencies["expo-audio"]).toBe("~1.1.1");
    expect(read("lib/native-radio.ts")).toContain('await import("expo-audio")');
    expect(pkg.dependencies["expo-video"]).toBeUndefined();
  });
  it("parses songs into plain native data without rendering provider HTML", () => {
    expect(parseRadioCatalog(sample)).toEqual([{ id: "Cancao_da_Promessa.mp3", title: "Cancao da Promessa" }]);
    expect(musicRequestSchema.safeParse({ name: "A", email: "invalid", songId: "x" }).success).toBe(false);
  });
  it("finishes reading valid catalog JSON without waiting for HTTP EOF", async () => {
    const cancel = vi.fn();
    const json = JSON.stringify(sample);
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(json.slice(0, 30)));
        controller.enqueue(new TextEncoder().encode(json.slice(30)));
        // Deliberately never close: this reproduces the provider's response.
      },
      cancel,
    });
    expect(await readRadioCatalogResponse(new Response(body))).toEqual(sample);
    expect(cancel).toHaveBeenCalledOnce();
  });
  it("loads, validates, sends and throttles requests using a mocked provider only", async () => {
    const provider = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response(JSON.stringify(sample), { headers: { "content-type": "application/json" } })).mockResolvedValueOnce(new Response("10 minutos"));
    const app = express();
    app.use(express.json());
    registerRadioMusicRoutes(app, provider as unknown as typeof fetch);
    const server = app.listen(0, "127.0.0.1");
    await new Promise<void>(resolve => server.once("listening", resolve));
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    try {
      const catalog = await fetch(`${base}/api/radio-music/catalog`);
      expect(await catalog.json()).toMatchObject({ songs: [{ id: "Cancao_da_Promessa.mp3" }] });
      const body = { name: "Pessoa de Teste", email: "test@example.com", songId: "Cancao_da_Promessa.mp3" };
      const post = (value: unknown) => fetch(`${base}/api/radio-music/request`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) });
      expect((await post({ ...body, email: "bad" })).status).toBe(400);
      expect((await post({ ...body, songId: "not-in-catalog.mp3" })).status).toBe(400);
      const result = await post(body);
      expect(result.status).toBe(200);
      expect(await result.json()).toMatchObject({ ok: true, message: "Pedido recebido pela rádio. Previsão informada: 10 minutos." });
      expect(provider).toHaveBeenCalledTimes(2);
      expect((await post(body)).status).toBe(429);
      expect(provider).toHaveBeenCalledTimes(2);
      const upstreamBody = provider.mock.calls[1][1]?.body as URLSearchParams;
      expect(upstreamBody.get("nome")).toBe("Pessoa de Teste");
      expect(upstreamBody.get("musica")).toBe("Cancao_da_Promessa.mp3");
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
    }
  });
  it("discloses the request data recipient in the form and both privacy pages", () => {
    for (const file of ["app/pedir-musica.tsx", "app/politica-privacidade.tsx", "public/politica-privacidade.html"]) expect(read(file)).toContain("ConectaSTM");
  });
});
