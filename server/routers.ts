import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { SEMENTES_KNOWLEDGE } from "../shared/knowledge";
import { buildBibleReferenceContext, buildLibraryContext } from "../shared/chat-library";
import { buildDoctrinalContext, buildDoctrinalFallback, DOCTRINAL_STUDIES } from "../shared/doctrinal-knowledge";
import { classifyChatComplexity, fallbackAnswer, needsOnlineResearch } from "../shared/chat-fallback";
import { COOKIE_NAME } from "../shared/const";
import { createMaterial, getAllMaterials, getPublishedMaterials, getUserConversations, publishMaterial, saveConversation } from "./db";
import { storagePut } from "./storage";
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
const chatMessageSchema = z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(10000), attachments: z.array(chatAttachmentSchema).max(3).optional() });

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
  category: z.enum(["filosofia", "projeto", "pao-diario", "hbj", "ministerios", "outros"]),
  version: z.number().int().positive().max(9999).default(1),
  summary: z.string().max(1000).optional(),
  content: z.string().min(20).max(100000),
  source: z.string().max(255).optional(),
  published: z.boolean().default(true),
  attachment: z.object({
    name: z.string().min(1).max(255),
    mimeType: z.string().min(1).max(160),
    base64: z.string().max(14_000_000),
    size: z.number().int().positive().max(10_000_000),
  }).optional(),
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
    manifest: publicProcedure.query(async () => {
      const published = await getPublishedMaterials();
      const latest = published.reduce<Date | null>((current, item) => {
        const value = item.updatedAt instanceof Date ? item.updatedAt : new Date(item.updatedAt);
        return !current || value > current ? value : current;
      }, null);
      return { version: latest?.toISOString() ?? "0", count: published.length };
    }),
    adminList: adminProcedure.query(() => getAllMaterials()),
    create: adminProcedure.input(materialInput).mutation(async ({ ctx, input }) => {
      const attachment = input.attachment;
      const uploaded = attachment ? await storagePut(`promessams/materials/${attachment.name}`, Buffer.from(attachment.base64.replace(/^data:[^;]+;base64,/, ""), "base64"), attachment.mimeType) : null;
      return createMaterial({ title: input.title, category: input.category, version: input.version, summary: input.summary ?? null, content: input.content, source: input.source ?? null, assetUrl: uploaded?.url ?? null, assetName: attachment?.name ?? null, assetMimeType: attachment?.mimeType ?? null, assetSize: attachment?.size ?? null, published: false, createdBy: ctx.user.id });
    }),
    approve: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => {
      if (!ENV.ownerOpenId || ctx.user.openId !== ENV.ownerOpenId) throw new TRPCError({ code: "FORBIDDEN", message: "Somente o gestor principal pode autorizar publicações." });
      return publishMaterial(input.id);
    }),
  }),
  history: router({
    list: protectedProcedure.query(({ ctx }) => getUserConversations(ctx.user.id)),
  }),
  reports: router({
    // Content will be published online; this area intentionally starts empty.
    list: protectedProcedure.query(() => [] as Array<{ id: number; title: string; content: string }>),
  }),
  chat: router({
    ask: publicProcedure.input(z.object({ messages: z.array(chatMessageSchema).min(1).max(20) })).mutation(async ({ ctx, input }) => {
      try {
        const databaseMaterials = await getPublishedMaterials();
        const latestUserQuery = [...input.messages].reverse().find((message) => message.role === "user")?.content ?? "";
        const complexity = classifyChatComplexity(latestUserQuery);
        const contextLimit = complexity === 1 ? 5000 : complexity === 2 ? 10000 : 16000;
        const databaseKnowledge = databaseMaterials.length ? `\n\nMATERIAIS ADICIONAIS PUBLICADOS PELA EQUIPE:\n${databaseMaterials.map((item) => `\n## ${item.title}\n${item.summary ?? ""}\n${item.content.slice(0, complexity === 1 ? 4000 : complexity === 2 ? 8000 : 12000)}\nFonte: ${item.source ?? "não informada"}`).join("\n")}` : "";
        const libraryKnowledge = buildLibraryContext(latestUserQuery);
        const bibleReferenceKnowledge = await buildBibleReferenceContext(latestUserQuery);
        const messages = [
        { role: "system" as const, content: `Você é o agente de orientação do aplicativo PromessaMS. Responda em português do Brasil, com tom humano, acolhedor, sereno e prático. Use a base institucional como autoridade principal e nunca permita que uma pesquisa externa a contradiga. Nível de profundidade desta pergunta: ${complexity}/3. No nível 1, responda de forma curta e direta; no nível 2, conecte mais pontos da base e ofereça aplicação; no nível 3, desenvolva uma resposta completa, compare argumentos e use pesquisa externa apenas para reforçar ou contextualizar a base, identificando claramente as fontes. Cite referências bíblicas quando forem relevantes, sem inventar citações. Ajude o usuário a compreender, vivenciar, ensinar e desenvolver a Filosofia da Semente e o Projeto Sementes na igreja local. O Pão Diário na Missão, a Bíblia Livre (BLivre), o Hinário HBJ — Brados de Júbilo e a Apostila de Ministérios Regionais são fontes relacionadas e podem ser conectadas à aplicação da Filosofia e do Projeto. Não substitua o pastor ou a liderança local em decisões sensíveis.\n\nNEXO TEOLOGICO OBRIGATORIO: quando a pergunta relacionar fruto do Espírito, Espírito Santo, caráter, discipulado, maturidade ou frutificação com a Filosofia da Semente, não trate os temas como ideias isoladas. Explique que o Espírito Santo habita e transforma o discípulo que permanece em Cristo; por isso, o fruto do Espírito de Gálatas 5:22-23 é evidência de caráter formado pela graça, não resultado de esforço meramente humano. Conecte João 15:4-5, Gálatas 5:16, 22-25, Efésios 5:18 e Atos 1:8, distinguindo fruto (caráter e vida transformada) de dons, atividade ou números. Mostre que, na Filosofia da Semente, a Palavra é a semente, Cristo é o centro, o Espírito Santo capacita o crescimento e o discípulo frutifica em amor, santidade, serviço, cuidado e testemunho; o Projeto Sementes organiza esse processo em relações, discipulado, acompanhamento e multiplicação. Se o usuário sugerir que fruto é apenas desempenho ou resultado numérico, corrija cordialmente essa redução.\n\nEntregue respostas completas no nível 2 ou 3, sem interromper frases, listas ou etapas.\n\n${SEMENTES_KNOWLEDGE.slice(0, contextLimit)}${databaseKnowledge}${libraryKnowledge}${bibleReferenceKnowledge}` },
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

        const shouldResearch = complexity === 3 || needsOnlineResearch(latestUserQuery);
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
        maxTokens: complexity === 1 ? 1200 : complexity === 2 ? 2200 : 3600,
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
          const second = await invokeLLM({ model: "gpt-5-mini", messages: [...messages, { role: "user" as const, content: `A pesquisa online retornou este material. Use-o somente para contextualizar e fortalecer a base institucional; descarte qualquer trecho que contradiga a base. Identifique no texto o que é fonte externa e o que é aplicação.\n\n${research.join("\n\n")}` }], maxTokens: complexity === 1 ? 1200 : complexity === 2 ? 2200 : 3600 });
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
  doctrinalChat: router({
    studies: publicProcedure.query(() => DOCTRINAL_STUDIES.map(({ number, title }) => ({ number, title }))),
    ask: publicProcedure.input(z.object({ messages: z.array(chatMessageSchema).min(1).max(20) })).mutation(async ({ ctx, input }) => {
      const latestQuery = [...input.messages].reverse().find((message) => message.role === "user")?.content ?? "";
      if (/^(olá|ola|oi|bom dia|boa tarde|boa noite)[!,.\s]*$/iu.test(latestQuery.trim())) {
        const answer = "Olá! Seja bem-vindo ao Professor Doutrinário. Faça sua pergunta sobre qualquer um dos 31 pontos da doutrina bíblica da Igreja Adventista da Promessa, e eu ajudarei a estudar o tema com base nas Escrituras e em O Doutrinal.";
        if (ctx.user) await saveConversation({ userId: ctx.user.id, title: "Doutrina: saudação", messages: JSON.stringify([...input.messages, { role: "assistant", content: answer }]) });
        return { answer, source: "O Doutrinal — Editora Promessa, 2023" };
      }
      try {
        const complexity = classifyChatComplexity(latestQuery);
        const doctrinalContext = complexity === 1
          ? buildDoctrinalContext(latestQuery, 2, 5000)
          : complexity === 2
            ? buildDoctrinalContext(latestQuery, 5, 8000)
            : buildDoctrinalContext(latestQuery, 8, 10000);
        const messages = [
          {
            role: "system" as const,
            content: `Você é o Professor Doutrinário do aplicativo PromessaMS. Responda em português do Brasil com clareza, reverência, firmeza bíblica, humildade pastoral e linguagem acessível. Profundidade da pergunta: nível ${complexity}/3. No nível 1, seja direto e use o estudo mais relevante; no nível 2, conecte vários estudos e referências; no nível 3, desenvolva uma análise completa e use pesquisa externa apenas para contextualizar ou fortalecer O Doutrinal, nunca para contradizê-lo. Sua base prioritária é O Doutrinal: Nossa crença ponto a ponto, da Editora Promessa, validado pela Comissão Teológica e pela Câmara Teológica da Igreja Adventista da Promessa. Explique os 31 pontos doutrinários com fundamentação bíblica e contexto histórico, sem inventar posições oficiais, citações ou referências. Diferencie o texto bíblico, o ensino doutrinário da Promessa, o contexto histórico e a aplicação prática. Não concorde automaticamente com a afirmação do usuário: quando ela contrariar a Bíblia ou a doutrina apresentada na base, diga com respeito e clareza que há um equívoco, explique por que a posição é inadequada e conduza a pessoa passo a passo à compreensão da doutrina bíblica ensinada pela Igreja Adventista da Promessa. Confronte o erro com a verdade, nunca a pessoa; evite humilhação, agressividade, condenação ou disputa. Quando houver questão pastoral, disciplina eclesiástica ou situação institucional sensível, recomende diálogo com o pastor ou liderança local. Cite estudos e referências bíblicas relevantes.\n\nCONTEXTO DOS ESTUDOS:\n${doctrinalContext}`,
          },
          ...input.messages.map((message) => ({ role: message.role as "user" | "assistant", content: message.content })),
        ];
        const shouldResearch = complexity === 3 || needsOnlineResearch(latestQuery);
        const outputLimit = complexity === 1 ? 1800 : complexity === 2 ? 4200 : 6500;
        const response = await invokeLLM({
          model: "gpt-5-mini",
          messages,
          maxTokens: outputLimit,
          ...(shouldResearch ? { tools: [{ type: "function" as const, function: { name: "search_online", description: "Pesquisar contexto externo para reforçar a doutrina sem alterá-la.", parameters: { type: "object", properties: { query: { type: "string", description: "Consulta curta em português" } }, required: ["query"] } } }], toolChoice: "auto" as const } : {}),
        });
        const responseMessage = response.choices?.[0]?.message as { content?: unknown; tool_calls?: Array<{ function: { arguments: string } }> } | undefined;
        let answerText = textFromContent(responseMessage?.content);
        if (responseMessage?.tool_calls?.length) {
          const research = await Promise.all(responseMessage.tool_calls.map(async (call) => {
            let args: { query?: string } = {};
            try { args = JSON.parse(call.function.arguments || "{}"); } catch { args = {}; }
            return args.query ? searchOnline(args.query) : "Consulta externa inválida.";
          }));
          const researched = await invokeLLM({ model: "gpt-5-mini", messages: [...messages, { role: "assistant" as const, content: answerText || "Analise a pergunta com base nos estudos." }, { role: "user" as const, content: `Material externo para apoio: use apenas o que for compatível com O Doutrinal, descarte contradições e sinalize que é contexto externo. Conclua a resposta com base doutrinária:\n\n${research.join("\n\n")}` }], maxTokens: outputLimit });
          answerText = textFromContent(researched.choices?.[0]?.message?.content);
        }
        const looksIncomplete = (value: string) => {
          const trimmed = value.trim();
          if (!trimmed) return true;
          if (/[.!?…»”)]$/u.test(trimmed)) return false;
          return /(?:\b(base|ofertar|ofertas|oferta|dízimo|dízimos|motivo|finalidade|igreja|Deus|Bíblia|Jesus|Espírito|segundo|terceiro|e|ou|para|com|de|da|do|em|no|na|que|como|porque|por)\s*)$/iu.test(trimmed) || /(?:^|\n)\s*(?:[-•*]|\d+[.)])\s+[^\n]*$/u.test(trimmed);
        };
        const completeDoctrinalAnswer = async (draft: string) => {
          let answer = draft.trim();
          if (!answer) return buildDoctrinalFallback(latestQuery);
          for (let attempt = 0; attempt < 3 && looksIncomplete(answer); attempt += 1) {
            const continuation = await invokeLLM({
              model: "gpt-5-mini",
              messages: [...messages, { role: "assistant" as const, content: answer }, { role: "user" as const, content: "A resposta foi interrompida antes de terminar. Continue exatamente do ponto em que parou, sem repetir o texto anterior. Complete a frase, todos os itens da lista e a conclusão. Entregue somente a continuação." }],
              maxTokens: 2200,
            });
            const continuationText = textFromContent(continuation.choices?.[0]?.message?.content).trim();
            if (!continuationText) break;
            answer = `${answer}\n\n${continuationText}`;
          }
          return answer;
        };
        const answer = await completeDoctrinalAnswer(answerText || buildDoctrinalFallback(latestQuery));
        if (ctx.user) {
          const safeMessages = [...input.messages, { role: "assistant" as const, content: answer }].map(({ role, content }) => ({ role, content }));
          await saveConversation({ userId: ctx.user.id, title: `Doutrina: ${latestQuery.slice(0, 70) || "estudo bíblico"}`, messages: JSON.stringify(safeMessages) });
        }
        return { answer, source: "O Doutrinal — Editora Promessa, 2023" };
      } catch (error) {
        console.error("[DoctrinalChat] LLM request failed:", error);
        return { answer: buildDoctrinalFallback(latestQuery), source: "O Doutrinal — Editora Promessa, 2023" };
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
