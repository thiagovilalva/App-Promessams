import { describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import type { AddressInfo } from "node:net";
import {
  registerRadioMusicRoutes,
  type RadioCatalogSnapshot,
} from "../server/radio-music";

type CatalogResponse = {
  songs: Array<{ id: string; title: string }>;
  updatedAt?: string;
};

const snapshot = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "shared/radio-catalog.json"),
    "utf8",
  ),
) as RadioCatalogSnapshot;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function withServer(
  fetcher: typeof fetch,
  initialSnapshot = snapshot,
  callback: (base: string) => Promise<void>,
) {
  const app = express();
  app.use(express.json());
  registerRadioMusicRoutes(app, fetcher, { initialSnapshot });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    await callback(base);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

describe("persistent radio catalog performance", () => {
  it("contains a real, non-empty snapshot with unique songs and source metadata", () => {
    expect(snapshot.version).toBe(1);
    expect(snapshot.source).toBe(
      "https://player.conectastm.com/pedir-musica/30368/musicas",
    );
    expect(snapshot.songs.length).toBeGreaterThanOrEqual(500);
    expect(new Date(snapshot.updatedAt).getTime()).not.toBeNaN();
    expect(new Set(snapshot.songs.map((song) => song.id)).size).toBe(
      snapshot.songs.length,
    );
    expect(
      snapshot.songs.every(
        (song) => song.id.endsWith(".mp3") && song.title.length > 0,
      ),
    ).toBe(true);
  });

  it("serves a stale snapshot immediately while refreshing once in the background", async () => {
    const staleSnapshot: RadioCatalogSnapshot = {
      ...snapshot,
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1_000).toISOString(),
    };
    const upstream = vi.fn<typeof fetch>(async () => {
      await sleep(60);
      return new Response(JSON.stringify({ data: [] }), {
        headers: { "content-type": "application/json" },
      });
    });
    await withServer(
      upstream as unknown as typeof fetch,
      staleSnapshot,
      async (base) => {
        const startedAt = performance.now();
        const responses = await Promise.all([
          fetch(`${base}/api/radio-music/catalog`),
          fetch(`${base}/api/radio-music/catalog`),
          fetch(`${base}/api/radio-music/catalog`),
        ]);
        const elapsed = performance.now() - startedAt;
        expect(elapsed).toBeLessThan(500);
        for (const response of responses) {
          expect(response.status).toBe(200);
          const body = (await response.json()) as CatalogResponse;
          expect(body.songs).toHaveLength(snapshot.songs.length);
        }
        expect(responses[0].headers.get("cache-control")).toContain(
          "stale-while-revalidate=86400",
        );
        expect(responses[0].headers.get("etag")).toBeTruthy();
        await sleep(100);
        expect(upstream).toHaveBeenCalledTimes(1);
      },
    );
  });

  it("returns 304 for an unchanged cached catalog without contacting upstream", async () => {
    const upstream = vi.fn<typeof fetch>();
    await withServer(
      upstream as unknown as typeof fetch,
      snapshot,
      async (base) => {
        const first = await fetch(`${base}/api/radio-music/catalog`);
        expect(first.status).toBe(200);
        const etag = first.headers.get("etag");
        expect(etag).toBeTruthy();
        const second = await fetch(`${base}/api/radio-music/catalog`, {
          headers: { "If-None-Match": etag as string },
        });
        expect(second.status).toBe(304);
        expect(await second.text()).toBe("");
        expect(upstream).not.toHaveBeenCalled();
      },
    );
  });

  it("uses the shared snapshot to validate a request without a catalog fetch", async () => {
    const upstream = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("10 minutos"));
    await withServer(
      upstream as unknown as typeof fetch,
      snapshot,
      async (base) => {
        const response = await fetch(`${base}/api/radio-music/request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Pessoa de Teste",
            email: "test@example.com",
            songId: snapshot.songs[0].id,
          }),
        });
        expect(response.status).toBe(200);
        expect(await response.json()).toMatchObject({ ok: true });
        expect(upstream).toHaveBeenCalledTimes(1);
        expect(upstream.mock.calls[0][0]).toBe(
          "https://player.conectastm.com/pedir-musica/30368",
        );
      },
    );
  });
});
