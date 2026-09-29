import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { SEMENTES_KNOWLEDGE } from "../shared/knowledge";
import { buildBibleReferenceContext, buildLibraryContext } from "../shared/chat-library";
import { fallbackAnswer, needsOnlineResearch } from "../shared/chat-fallback";
import { COOKIE_NAME } from "../shared/const";
import { createMaterial, getAllMaterials, getPublishedMaterials, getUserConversations, publishMaterial, saveConversation } from "./db";
import { invokeLLM } from "./_core/llm";
import { ENV } from "./_core/env";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";

const chatAttachmentSchema = z.object({
  name: z.string().max(255),
  mimeType: z.string().max(120).optional(),
  text: z.string().max(30000).optional(),
  dataUrl: z.string().max(12000000).optional(),
});
const chatMessageSchema = z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(6000), attachments: z.array(chatAttachmentSchema).max(3).optional() });

function textFromContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((item) => item && typeof item === "object" && "text" in item ? String((item as { text: unknown }).text) : typeof item === "string" ? item : "").join("\n");
  return "";
}

function decodeHtml(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#x2F;/g, "/").replace(/<[^>]+>/g, "").trim();
}

async function searchOnline(query: string) {
  try {
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, { headers: { "user-agent": "Projeto-Sementes/1.0" } });
    if (!response.ok) return "Pesquisa online indisponível no momento.";
    const html = await response.text();
    const results: Array<{ title: string; url: string; snippet: string }> = [];
    const pattern = /<a rel="nofollow" class="result__a" href="([^"]+)">([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) && results.length < 4) results.push({ title: decodeHtml(match[2]), url: match[1], snippet: decodeHtml(match[3]) });
    if (!results.length) return "Nenhum resultado confiável foi encontrado na pesquisa online.";
    return results.map((item, index) => `${index + 1}. ${item.title}\nURL: ${item.url}\nResumo: ${item.snippet}`).join("\n\n");
  } catch {
    return "Não foi possível consultar a internet agora. Responda usando a base de conhecimento e sinalize essa limitação.";
  }
}

const materialInput = z.object({
  title: z.string().min(3).max(255),
  summary: z.string().max(1000).optional(),
  content: z.string().min(20).max(100000),
  source: z.string().max(255).optional(),
  published: z.boolean().default(true),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { maxAge: -1, secure: true, sameSite: "none", httpOnly: true, path: "/" });
      return { success: true } as const;
    }),
  }),
  materials: router({
    list: publicProcedure.query(() => getPublishedMaterials()),
    adminList: adminProcedure.query(() => getAllMaterials()),
    create: adminProcedure.input(materialInput).mutation(({ ctx, input }) => createMaterial({ ...input, published: false, createdBy: ctx.user.id, summary: input.summary ?? null, source: input.source ?? null })),
    approve: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => {
      if (!ENV.ownerOpenId || ctx.user.openId !== ENV.ownerOpenId) throw new TRPCError({ code: "FORBIDDEN", message: "Somente o gestor principal pode autorizar publicações." });
      return publishMaterial(input.id);
    }),
  }),
  history: router({
    list: protectedProcedure.query(({ ctx }) => getUserConversations(ctx.user.id)),
  }),
  chat: router({
    ask: publicProcedure.input(z.object({ messages: z.array(chatMessageSchema).min(1).max(20) })).mutation(async ({ ctx, input }) => {
      try {
        const databaseMaterials = await getPublishedMaterials();
        const databaseKnowledge = databaseMaterials.length ? `\n\nMATERIAIS ADICIONAIS PUBLICADOS PELA EQUIPE:\n${databaseMaterials.map((item) => `\n## ${item.title}\n${item.summary ?? ""}\n${item.content.slice(0, 18000)}\nFonte: ${item.source ?? "não informada"}`).join("\n")}` : "";
        const latestUserQuery = [...input.messages].reverse().find((message) => message.role === "user")?.content ?? "";
        const libraryKnowledge = buildLibraryContext(latestUserQuery);
        const bibleReferenceKnowledge = await buildBibleReferenceContext(latestUserQuery);
        const messages = [
        { role: "system" as const, content: `Você é o agente de orientação do aplicativo PromessaMS. Responda em português do Brasil, com tom humano, acolhedor, sereno e prático. Não diga que é uma IA de forma repetitiva. Use a base de conhecimento abaixo como prioridade. Cite referências bíblicas quando forem relevantes, sem inventar citações. Ajude o usuário a compreender, vivenciar, ensinar e desenvolver a Filosofia da Semente e o Projeto Sementes na igreja local. O Pão Diário na Missão, a Bíblia Livre (BLivre), o Hinário HBJ — Brados de Júbilo e a Apostila de Ministérios Regionais são fontes relacionadas e podem ser conectadas à aplicação da Filosofia e do Projeto. Quando usar um trecho, informe sua fonte. Faça perguntas de acompanhamento quando isso ajudar a transformar a reflexão em um próximo passo. Não substitua o pastor ou a liderança local em decisões sensíveis. Se recorrer à pesquisa online, diferencie claramente o que veio da base, o que é pesquisa e o que é sugestão. Entregue respostas completas: não interrompa frases, listas ou etapas. Ao terminar todos os tópicos, acrescente exatamente o marcador [FIM].\n\n${SEMENTES_KNOWLEDGE}${databaseKnowledge}${libraryKnowledge}${bibleReferenceKnowledge}` },
        ...input.messages.map((message) => {
          const attachments = message.attachments ?? [];
          const attachmentText = attachments.filter((item) => item.text).map((item) => `\n\nArquivo ${item.name}:\n${item.text}`).join("");
          const imageParts = attachments.filter((item) => item.dataUrl && item.mimeType?.startsWith("image/")).map((item) => ({ type: "image_url" as const, image_url: { url: item.dataUrl!, detail: "auto" as const } }));
          const fileParts = attachments.filter((item) => item.dataUrl && item.mimeType === "application/pdf").map((item) => ({ type: "file_url" as const, file_url: { url: item.dataUrl!, mime_type: "application/pdf" as const } }));
          const richParts = [...imageParts, ...fileParts];
          return richParts.length
            ? { role: message.role as "user" | "assistant", content: [{ type: "text" as const, text: `${message.content}${attachmentText}` }, ...richParts] }
            : { role: message.role as "user" | "assistant", content: `${message.content}${attachmentText}` };
        }),
        ];

        const shouldResearch = needsOnlineResearch(input.messages[input.messages.length - 1]?.content ?? "");
        const persist = async (answer: string) => {
          if (!ctx.user) return;
          const safeMessages = [...input.messages, { role: "assistant" as const, content: answer }].map(({ role, content, attachments }) => ({ role, content, attachments: attachments?.map(({ name, mimeType, text }) => ({ name, mimeType, text })) }));
          await saveConversation({ userId: ctx.user.id, title: input.messages.find((item) => item.role === "user")?.content.slice(0, 80) || "Conversa Projeto Sementes", messages: JSON.stringify(safeMessages) });
        };
        const completeAnswer = async (draft: string) => {
          if (draft.includes("[FIM]")) return draft.replace(/\s*\[FIM\]\s*$/u, "").trim();
          const trimmed = draft.trim();
          const looksIncomplete = !/[.!?…»”)]$/u.test(trimmed);
          if (trimmed.length < 1800 && !looksIncomplete) return trimmed;
          let answer = trimmed;
          for (let attempt = 0; attempt < 4 && !answer.includes("[FIM]"); attempt += 1) {
            const continuation = await invokeLLM({ model: "gpt-5-mini", messages: [...messages, { role: "assistant" as const, content: answer }, { role: "user" as const, content: "A resposta ainda não terminou. Continue exatamente do ponto em que parou, sem repetir o texto anterior. Conclua todos os tópicos, frases e listas pendentes e finalize com [FIM]." }], maxTokens: 1800 });
            const continuationText = textFromContent(continuation.choices?.[0]?.message?.content);
            if (!continuationText) break;
            answer = `${answer}\n\n${continuationText}`;
          }
          return answer.replace(/\s*\[FIM\]\s*$/u, "").trim();
        };
        const first = await invokeLLM({
        model: "gpt-5-mini",
        messages,
        maxTokens: 2200,
        ...(shouldResearch ? { tools: [{ type: "function" as const, function: { name: "search_online", description: "Pesquisar na internet para complementar uma pergunta que pede informação atual.", parameters: { type: "object", properties: { query: { type: "string", description: "Consulta curta em português" } }, required: ["query"] } } }], toolChoice: "auto" as const } : {}),
        });
        const firstChoice = first.choices?.[0] as { message?: unknown; finish_reason?: string } | undefined;
        const firstMessage = firstChoice?.message as { content?: unknown; tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }> } | undefined;
        if (firstMessage?.tool_calls?.length) {
          const research = await Promise.all(firstMessage.tool_calls.map(async (call) => {
          let args: { query?: string } = {};
          try { args = JSON.parse(call.function.arguments || "{}"); } catch { args = {}; }
          return args.query ? searchOnline(args.query) : "Consulta inválida.";
          }));
          const second = await invokeLLM({ model: "gpt-5-mini", messages: [...messages, { role: "user" as const, content: `A pesquisa online solicitada retornou o seguinte material. Use-o apenas como complemento, avalie sua confiabilidade e não invente fatos. Entregue uma resposta completa, sem interromper frases ou listas no meio; se ficar longa, conclua todos os tópicos antes de terminar:\n\n${research.join("\n\n")}` }], maxTokens: 2200 });
          const answer = await completeAnswer(textFromContent(second.choices?.[0]?.message?.content) || fallbackAnswer(input.messages[input.messages.length - 1]?.content ?? ""));
          await persist(answer);
          return { answer, researched: true };
        }
        const answer = await completeAnswer(textFromContent(firstMessage?.content) || fallbackAnswer(input.messages[input.messages.length - 1]?.content ?? ""));
        await persist(answer);
        return { answer, researched: false };
      } catch (error) {
        console.error("[Chat] LLM request failed:", error);
        const answer = fallbackAnswer(input.messages[input.messages.length - 1]?.content ?? "");
        if (ctx.user) await saveConversation({ userId: ctx.user.id, title: input.messages[0]?.content.slice(0, 80) || "Conversa Projeto Sementes", messages: JSON.stringify([...input.messages, { role: "assistant", content: answer }]) });
        return { answer, researched: false };
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
