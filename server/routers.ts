import { z } from "zod";

import { SEMENTES_KNOWLEDGE } from "../shared/knowledge";
import { COOKIE_NAME } from "../shared/const";
import { invokeLLM } from "./_core/llm";
import { publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(6000),
});

function textFromContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "text" in item) return String((item as { text: unknown }).text);
      return "";
    }).join("\n");
  }
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
    while ((match = pattern.exec(html)) && results.length < 4) {
      results.push({ title: decodeHtml(match[2]), url: match[1], snippet: decodeHtml(match[3]) });
    }
    if (!results.length) return "Nenhum resultado confiável foi encontrado na pesquisa online.";
    return results.map((item, index) => `${index + 1}. ${item.title}\nURL: ${item.url}\nResumo: ${item.snippet}`).join("\n\n");
  } catch {
    return "Não foi possível consultar a internet agora. Responda usando a base de conhecimento e sinalize essa limitação.";
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { maxAge: -1, secure: true, sameSite: "none", httpOnly: true, path: "/" });
      return { success: true } as const;
    }),
  }),
  chat: router({
    ask: publicProcedure.input(z.object({ messages: z.array(chatMessageSchema).min(1).max(20) })).mutation(async ({ input }) => {
      const messages = [
        { role: "system" as const, content: `Você é o agente de orientação do aplicativo Projeto Sementes. Responda em português do Brasil, com tom humano, acolhedor, sereno e prático. Não diga que é uma IA de forma repetitiva. Use a base de conhecimento abaixo como prioridade. Cite referências bíblicas quando forem relevantes, sem inventar citações. Ajude o usuário a compreender, vivenciar, ensinar e desenvolver a Filosofia da Semente e o Projeto Sementes na igreja local. Faça perguntas de acompanhamento quando isso ajudar a transformar a reflexão em um próximo passo. Não substitua o pastor ou a liderança local em decisões sensíveis. Se recorrer à pesquisa online, diferencie claramente o que veio da base, o que é pesquisa e o que é sugestão.\n\n${SEMENTES_KNOWLEDGE}` },
        ...input.messages.map((message) => ({ role: message.role as "user" | "assistant", content: message.content })),
      ];

      const first = await invokeLLM({
        model: "gpt-5-mini",
        messages,
        maxTokens: 900,
        tools: [{ type: "function", function: { name: "search_online", description: "Pesquisar na internet quando a pergunta pedir informação atual ou assunto fora da base de conhecimento.", parameters: { type: "object", properties: { query: { type: "string", description: "Consulta curta em português" } }, required: ["query"] } } }],
        toolChoice: "auto",
      });

      const firstMessage = first.choices?.[0]?.message as { content?: unknown; tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }> } | undefined;
      if (firstMessage?.tool_calls?.length) {
        const research = await Promise.all(firstMessage.tool_calls.map(async (call) => {
          let args: { query?: string } = {};
          try { args = JSON.parse(call.function.arguments || "{}"); } catch { args = {}; }
          return args.query ? searchOnline(args.query) : "Consulta inválida.";
        }));
        const researchText = research.join("\n\n");
        const second = await invokeLLM({
          model: "gpt-5-mini",
          messages: [...messages, { role: "user" as const, content: `A pesquisa online solicitada pelo usuário retornou o seguinte material. Use-o apenas como complemento, avalie sua confiabilidade e não invente fatos:\n\n${researchText}` }],
          maxTokens: 1000,
        });
        return { answer: textFromContent(second.choices?.[0]?.message?.content) || "Não consegui concluir a resposta agora. Tente novamente.", researched: true };
      }

      return { answer: textFromContent(firstMessage?.content) || "Não consegui concluir a resposta agora. Tente novamente.", researched: false };
    }),
  }),
});

export type AppRouter = typeof appRouter;
