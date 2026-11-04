import type { Express } from "express";
import { z } from "zod";

const PROVIDER = "https://player.conectastm.com/pedir-musica/30368";
export type RadioSong = { id: string; title: string };
export function parseRadioCatalog(payload: unknown): RadioSong[] {
  const rows = z.object({ data: z.array(z.array(z.string())) }).parse(payload).data;
  const songs = new Map<string, RadioSong>();
  for (const row of rows) {
    const id = row[1]?.match(/pedir\(["']([^"']+)["']\)/)?.[1];
    if (!id || id.length > 512) continue;
    const title = id.replace(/\.mp3$/i, "").replace(/_/g, " ").replace(/\s+/g, " ").trim();
    songs.set(id, { id, title });
  }
  return [...songs.values()];
}
export const musicRequestSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  songId: z.string().min(1).max(512),
});

export function registerRadioMusicRoutes(app: Express, fetcher: typeof fetch = fetch) {
  let catalog: RadioSong[] = [];
  let cachedAt = 0;
  let loading: Promise<RadioSong[]> | undefined;
  const sentAt = new Map<string, number>();
  const getCatalog = async (): Promise<RadioSong[]> => {
    if (catalog.length && Date.now() - cachedAt < 900_000) return catalog;
    if (!loading) {
      loading = (async () => {
        const response = await fetcher(`${PROVIDER}/musicas`, { signal: AbortSignal.timeout(60_000) });
        if (!response.ok) throw new Error("Catalog unavailable");
        const bytes = await response.arrayBuffer();
        let raw = new TextDecoder("utf-8", { fatal: true });
        let text: string;
        try { text = raw.decode(bytes); } catch { raw = new TextDecoder("windows-1252"); text = raw.decode(bytes); }
        const parsed = parseRadioCatalog(JSON.parse(text));
        if (!parsed.length) throw new Error("Empty catalog");
        catalog = parsed;
        cachedAt = Date.now();
        return catalog;
      })().finally(() => { loading = undefined; });
    }
    return loading;
  };
  app.get("/api/radio-music/catalog", async (_req, res) => {
    try { res.json({ songs: await getCatalog() }); }
    catch { res.status(502).json({ error: "O catálogo da rádio está indisponível. Tente novamente ou fale com a rádio pelo WhatsApp." }); }
  });
  app.post("/api/radio-music/request", async (req, res) => {
    const parsed = musicRequestSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Informe seu nome, e-mail válido e uma música do catálogo." }); return; }
    const key = req.ip || "unknown";
    const now = Date.now();
    // Only timestamps are retained in memory, never listener names or e-mails.
    for (const [ip, time] of sentAt) if (now - time > 300_000) sentAt.delete(ip);
    if (sentAt.has(key)) { res.status(429).json({ error: "Aguarde alguns minutos antes de enviar outro pedido." }); return; }
    if (sentAt.size >= 5000) { res.status(503).json({ error: "Muitos pedidos no momento. Tente novamente em alguns minutos." }); return; }
    try {
      const songs = await getCatalog();
      if (!songs.some(song => song.id === parsed.data.songId)) { res.status(400).json({ error: "Escolha uma música disponível no catálogo." }); return; }
      sentAt.set(key, now);
      const response = await fetcher(PROVIDER, {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ nome: parsed.data.name, email: parsed.data.email, musica: parsed.data.songId }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error("Request unavailable");
      const answer = (await response.text()).trim();
      if (answer === "erro") { res.status(429).json({ error: "A rádio informa que já recebeu um pedido recente. Aguarde e tente novamente." }); return; }
      // The provider response must never be rendered as HTML in the app.
      const estimate = answer.replace(/<[^>]*>/g, "").replace(/[<>]/g, "").slice(0, 160);
      res.json({ ok: true, message: estimate ? `Pedido recebido pela rádio. Previsão informada: ${estimate}.` : "Pedido recebido pela rádio." });
    } catch { res.status(502).json({ error: "Não foi possível confirmar o pedido. Evite reenviar imediatamente; fale com a rádio pelo WhatsApp se necessário." }); }
  });
}
