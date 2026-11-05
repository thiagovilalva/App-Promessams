import type { Express, Request, Response as ExpressResponse } from "express";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, renameSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import bundledCatalog from "../shared/radio-catalog.json";

const PROVIDER = "https://player.conectastm.com/pedir-musica/30368";
const CATALOG_URL = `${PROVIDER}/musicas`;
const SNAPSHOT_PATH = join(process.cwd(), "shared", "radio-catalog.json");
const SNAPSHOT_VERSION = 1;
const REFRESH_AFTER_MS = 12 * 60 * 60 * 1_000;
const RETRY_AFTER_MS = 5 * 60 * 1_000;
const UPSTREAM_TIMEOUT_MS = 120_000;
const MAX_CATALOG_BYTES = 2_000_000;
const CACHE_CONTROL = "public, max-age=60, stale-while-revalidate=86400";

export type RadioSong = { id: string; title: string };
export type RadioCatalogSnapshot = {
  version: number;
  source: string;
  updatedAt: string;
  songs: RadioSong[];
};

type CatalogState = {
  snapshot?: RadioCatalogSnapshot;
  refresh?: Promise<void>;
  lastAttemptAt: number;
};

const snapshotSchema = z.object({
  version: z.number().int().positive(),
  source: z.string().url(),
  updatedAt: z.string().datetime({ offset: true }),
  songs: z.array(
    z.object({
      id: z.string().min(1).max(512),
      title: z.string().min(1).max(1024),
    }),
  ),
});

function readSnapshotFromDisk(): RadioCatalogSnapshot | undefined {
  try {
    const snapshot = snapshotSchema.parse(
      JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8")),
    );
    return snapshot.songs.length ? snapshot : undefined;
  } catch {
    const bundled = snapshotSchema.safeParse(bundledCatalog);
    return bundled.success && bundled.data.songs.length ? bundled.data : undefined;
  }
}

const sharedState: CatalogState = {
  snapshot: readSnapshotFromDisk(),
  lastAttemptAt: 0,
};

function persistSnapshot(snapshot: RadioCatalogSnapshot): void {
  try {
    const temporaryPath = `${SNAPSHOT_PATH}.tmp`;
    writeFileSync(
      temporaryPath,
      `${JSON.stringify(snapshot, null, 2)}\n`,
      "utf8",
    );
    renameSync(temporaryPath, SNAPSHOT_PATH);
  } catch {
    // A read-only deployment can still serve the refreshed in-memory snapshot.
  }
}

// Some provider responses send a complete JSON value but keep their HTTP body
// open. Consume until JSON parses instead of waiting forever for EOF.
export async function readRadioCatalogResponse(
  response: globalThis.Response,
): Promise<unknown> {
  if (!response.body) throw new Error("Empty catalog response");
  const reader = response.body.getReader();
  let data = new Uint8Array(0);
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.value) {
        if (data.byteLength + chunk.value.byteLength > MAX_CATALOG_BYTES) {
          throw new Error("Catalog exceeds limit");
        }
        const merged = new Uint8Array(data.byteLength + chunk.value.byteLength);
        merged.set(data);
        merged.set(chunk.value, data.byteLength);
        data = merged;
      }
      let text: string;
      try {
        text = new TextDecoder("utf-8", { fatal: true }).decode(data);
      } catch {
        text = new TextDecoder("windows-1252").decode(data);
      }
      try {
        return JSON.parse(text);
      } catch {
        if (chunk.done) throw new Error("Invalid catalog JSON");
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}

export function parseRadioCatalog(payload: unknown): RadioSong[] {
  const songs = new Map<string, RadioSong>();
  const providerPayload = z
    .object({ data: z.array(z.array(z.string())) })
    .safeParse(payload);

  if (providerPayload.success) {
    for (const row of providerPayload.data.data) {
      const id = row[1]?.match(/pedir\(["']([^"']+)["']\)/)?.[1];
      if (!id || id.length > 512) continue;
      const title = id
        .replace(/\.mp3$/i, "")
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (title) songs.set(id, { id, title });
    }
  } else {
    const snapshotPayload = z
      .object({
        songs: z.array(z.object({ id: z.string(), title: z.string() })),
      })
      .safeParse(payload);
    if (snapshotPayload.success) {
      for (const song of snapshotPayload.data.songs) {
        if (song.id.length <= 512 && song.title.trim())
          songs.set(song.id, { id: song.id, title: song.title.trim() });
      }
    }
  }

  return [...songs.values()];
}

export const musicRequestSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  songId: z.string().min(1).max(512),
});

function isStale(snapshot: RadioCatalogSnapshot): boolean {
  return Date.now() - Date.parse(snapshot.updatedAt) >= REFRESH_AFTER_MS;
}

function writeCatalogResponse(
  req: Request,
  res: ExpressResponse,
  snapshot: RadioCatalogSnapshot,
): void {
  const payload = JSON.stringify({
    songs: snapshot.songs,
    updatedAt: snapshot.updatedAt,
  });
  const etag = `"${createHash("sha256").update(payload).digest("base64url")}"`;
  const updatedAt = Date.parse(snapshot.updatedAt);
  res.setHeader("Cache-Control", CACHE_CONTROL);
  res.setHeader("ETag", etag);
  res.setHeader("X-Catalog-Updated-At", snapshot.updatedAt);
  if (Number.isFinite(updatedAt))
    res.setHeader("Last-Modified", new Date(updatedAt).toUTCString());
  if (req.headers["if-none-match"] === etag) {
    res.status(304).end();
    return;
  }
  res.type("application/json").send(payload);
}

function startRefresh(
  state: CatalogState,
  fetcher: typeof fetch,
  persist: boolean,
): Promise<void> | undefined {
  if (state.refresh || Date.now() - state.lastAttemptAt < RETRY_AFTER_MS)
    return state.refresh;
  state.lastAttemptAt = Date.now();
  state.refresh = (async () => {
    const response = await fetcher(CATALOG_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PromessaMS/1.0)",
        Accept: "application/json",
        "Accept-Encoding": "identity",
        Connection: "close",
      },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!response.ok)
      throw new Error(`Catalog unavailable (${response.status})`);
    const songs = parseRadioCatalog(await readRadioCatalogResponse(response));
    if (!songs.length) throw new Error("Empty catalog");
    const snapshot: RadioCatalogSnapshot = {
      version: SNAPSHOT_VERSION,
      source: CATALOG_URL,
      updatedAt: new Date().toISOString(),
      songs,
    };
    state.snapshot = snapshot;
    if (persist) persistSnapshot(snapshot);
  })()
    .catch(() => undefined)
    .finally(() => {
      state.refresh = undefined;
    });
  return state.refresh;
}

export type RadioMusicRouteOptions = { initialSnapshot?: RadioCatalogSnapshot };

export function registerRadioMusicRoutes(
  app: Express,
  fetcher: typeof fetch = fetch,
  options?: RadioMusicRouteOptions,
) {
  // Dependency injection remains isolated for tests; production uses this one
  // module-level state so every route registration shares one refresh promise.
  const isInjectedFetcher = fetcher !== fetch;
  const state: CatalogState = isInjectedFetcher
    ? { snapshot: options?.initialSnapshot, lastAttemptAt: 0 }
    : sharedState;
  const persist = !isInjectedFetcher;

  app.get("/api/radio-music/catalog", async (req, res) => {
    let snapshot = state.snapshot;
    if (isInjectedFetcher && !snapshot) {
      await startRefresh(state, fetcher, false);
      snapshot = state.snapshot;
    } else if (snapshot && isStale(snapshot)) {
      void startRefresh(state, fetcher, persist);
    } else if (!snapshot) {
      void startRefresh(state, fetcher, persist);
    }

    if (!snapshot) {
      res.status(503).json({
        error:
          "O catálogo da rádio ainda não está disponível. Tente novamente em instantes.",
      });
      return;
    }
    writeCatalogResponse(req, res, snapshot);
  });

  const sentAt = new Map<string, number>();
  app.post("/api/radio-music/request", async (req, res) => {
    const parsed = musicRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Informe seu nome, e-mail válido e uma música do catálogo.",
      });
      return;
    }
    const key = req.ip || "unknown";
    const now = Date.now();
    // Only timestamps are retained in memory, never listener names or e-mails.
    for (const [ip, time] of sentAt)
      if (now - time > 300_000) sentAt.delete(ip);
    if (sentAt.has(key)) {
      res.status(429).json({
        error: "Aguarde alguns minutos antes de enviar outro pedido.",
      });
      return;
    }
    if (sentAt.size >= 5000) {
      res.status(503).json({
        error: "Muitos pedidos no momento. Tente novamente em alguns minutos.",
      });
      return;
    }

    let snapshot = state.snapshot;
    if (!snapshot && isInjectedFetcher) {
      await startRefresh(state, fetcher, false);
      snapshot = state.snapshot;
    }
    if (!snapshot) {
      res.status(503).json({
        error:
          "O catálogo da rádio ainda não está disponível. Tente novamente em instantes.",
      });
      return;
    }
    if (!snapshot.songs.some((song) => song.id === parsed.data.songId)) {
      res
        .status(400)
        .json({ error: "Escolha uma música disponível no catálogo." });
      return;
    }

    try {
      sentAt.set(key, now);
      const response = await fetcher(PROVIDER, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          nome: parsed.data.name,
          email: parsed.data.email,
          musica: parsed.data.songId,
        }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error("Request unavailable");
      const answer = (await response.text()).trim();
      if (answer === "erro") {
        res.status(429).json({
          error:
            "A rádio informa que já recebeu um pedido recente. Aguarde e tente novamente.",
        });
        return;
      }
      // The provider response must never be rendered as HTML in the app.
      const estimate = answer
        .replace(/<[^>]*>/g, "")
        .replace(/[<>]/g, "")
        .slice(0, 160);
      res.json({
        ok: true,
        message: estimate
          ? `Pedido recebido pela rádio. Previsão informada: ${estimate}.`
          : "Pedido recebido pela rádio.",
      });
    } catch {
      res.status(502).json({
        error:
          "Não foi possível confirmar o pedido. Evite reenviar imediatamente; fale com a rádio pelo WhatsApp se necessário.",
      });
    }
  });
}
