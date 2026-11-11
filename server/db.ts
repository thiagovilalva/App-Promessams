import { and, desc, eq, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { Conversation, InsertConversation, InsertMaterial, InsertUser, conversations, materials, users } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { DOCTRINAL_STUDIES } from "../shared/doctrinal-knowledge";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPublishedMaterials() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: materials.id, title: materials.title, category: materials.category, version: materials.version, summary: materials.summary, content: materials.content, source: materials.source, assetUrl: materials.assetUrl, assetName: materials.assetName, assetMimeType: materials.assetMimeType, assetSize: materials.assetSize, createdAt: materials.createdAt, updatedAt: materials.updatedAt }).from(materials).where(eq(materials.published, true)).orderBy(desc(materials.updatedAt));
}

export async function getAllMaterials() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(materials).orderBy(desc(materials.createdAt));
}

export async function createMaterial(input: Omit<InsertMaterial, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(materials).values(input);
  return { created: true } as const;
}

export async function getNextMaterialVersion(title: string) {
  const db = await getDb();
  if (!db) return 1;
  const existing = await db.select({ version: materials.version }).from(materials).where(eq(materials.title, title)).orderBy(desc(materials.version)).limit(1);
  return (existing[0]?.version ?? 0) + 1;
}

export async function publishMaterial(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(materials).set({ published: true }).where(eq(materials.id, id));
  return { published: true } as const;
}

export async function saveConversation(input: Omit<InsertConversation, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(conversations).values(input);
  return { saved: true } as const;
}

export async function getUserConversations(userId: number): Promise<Conversation[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt)).limit(30);
}

export async function deleteUserConversation(userId: number, conversationId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(conversations).where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)));
  return true;
}

export async function deleteAllUserConversations(userId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(conversations).where(eq(conversations.userId, userId));
  return true;
}

function normalizeReportText(value: string) {
  return value.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function classifyReportSubject(value: string, chatTopic: string) {
  const text = normalizeReportText(value);
  if (chatTopic === "Professor Doutrinário") {
    const aliases: Array<[number, string[]]> = [
      [18, ["sabado", "sábado", "dia de descanso", "quarto mandamento"]],
      [20, ["dizimo", "dízimo", "oferta", "ofertar", "ofertas", "primicia", "primícia", "manutencao da obra"]],
      [9, ["batismo no espirito", "batismo no espírito", "espirito santo", "espírito santo"]],
      [10, ["dom espiritual", "dons espirituais", "dom de cura", "profecia"]],
      [11, ["evangelizacao", "evangelização", "discipulado", "fazer discípulos", "fazer discipulos"]],
      [17, ["dez mandamentos", "mandamentos", "lei de deus"]],
      [19, ["lei cerimonial", "leis cerimoniais", "distincao das leis", "distinção das leis"]],
      [26, ["segunda vinda", "volta de jesus", "volta de cristo"]],
      [29, ["juizo final", "juízo final", "julgamento final"]],
      [22, ["casamento", "familia", "família", "lar"]],
      [15, ["oracao", "oração", "orar"]],
      [5, ["salvador", "mediador", "divindade de jesus", "jesus cristo"]],
    ];
    const alias = aliases.find(([_, terms]) => terms.some((term) => text.includes(normalizeReportText(term))));
    if (alias) {
      const study = DOCTRINAL_STUDIES.find((item) => item.number === alias[0]);
      return `Estudo ${alias[0]} — ${study?.title ?? "Ponto doutrinário"}`;
    }
    const matched = DOCTRINAL_STUDIES.find((study) => {
      const terms = [study.title, ...study.keywords];
      return terms.some((term) => {
        const normalized = normalizeReportText(term);
        return normalized.length >= 5 && text.includes(normalized);
      });
    });
    if (matched) return `Estudo ${matched.number} — ${matched.title}`;
    return "Sem referência à base doutrinária";
  }
  if (chatTopic === "Administração da Igreja") {
    const groups: Array<[string, string[]]> = [
      ["Estatuto e personalidade jurídica", ["estatuto", "cnpj", "personalidade juridica", "personalidade jurídica", "sede"]],
      ["Manual da Igreja e funcionamento local", ["manual da igreja", "conselho local", "assembleia", "assembléia", "membro", "ministro"]],
      ["Código de Ética Pastoral", ["codigo de etica", "código de ética", "etica pastoral", "ética pastoral", "denuncia", "denúncia"]],
      ["Convenção Regional e regimentos", ["convencao regional", "convenção regional", "regimento", "diretoria regional", "junta regional"]],
      ["Regulamento eleitoral", ["eleicao", "eleição", "votar", "voto", "eleitoral", "candidato"]],
      ["Finanças, dízimos e ofertas", ["financeiro", "financas", "finanças", "dizimo", "dízimo", "oferta", "orcamento", "orçamento", "conta bancaria", "conta bancária"]],
      ["Membros, disciplina e direitos", ["disciplina", "desligamento", "exclusao", "exclusão", "direitos", "deveres", "transferencia", "transferência"]],
      ["Liderança e ministérios", ["pastor", "presbitero", "presbítero", "diacono", "diácono", "ministerio", "ministério", "lideranca", "liderança"]],
    ];
    return groups.find(([_, terms]) => terms.some((term) => text.includes(normalizeReportText(term))))?.[0] ?? "Sem referência à base administrativa";
  }
  const groups: Array<[string, string[]]> = [
    ["Filosofia da Semente", ["filosofia da semente", "semente", "cristocentrismo", "palavra como semente", "modo missao", "modo missão"]],
    ["Jornada do semeador e acolhimento", ["jornada", "acolhimento", "campanha de oracao", "campanha de oração", "relacionamento", "primeiro contato"]],
    ["Discipulado e cuidado contínuo", ["discipulado", "discipulo", "discípulo", "cuidado", "integracao", "integração", "grupo de apoio"]],
    ["Liderança e formação", ["lideranca", "liderança", "formacao de lideres", "formação de líderes", "mentoria", "equipes"]],
    ["Multiplicação e missão", ["multiplicacao", "multiplicação", "missao", "missão", "evangelizacao", "evangelização", "enviado"]],
    ["Igreja Viva e território", ["igreja viva", "territorio", "território", "cidade", "bairro", "contextualizacao", "contextualização"]],
    ["Ministérios Regionais", ["ministerios regionais", "ministérios regionais", "regional", "diretoria regional", "capacitacao", "capacitação"]],
    ["Bíblia, oração e devocionais", ["biblia", "bíblia", "versiculo", "versículo", "oracao", "oração", "devocional", "pao diario", "pão diário"]],
  ];
  return groups.find(([_, terms]) => terms.some((term) => text.includes(normalizeReportText(term))))?.[0] ?? "Sem referência à base temática";
}

export async function getConversationReport(filter: { from?: Date; to?: Date } = {}) {
  const db = await getDb();
  if (!db) return { totalConversations: 0, topics: [] as Array<{ topic: string; count: number; subjects: Array<{ subject: string; count: number }> }> };
  const conditions = [];
  if (filter.from) conditions.push(gte(conversations.updatedAt, filter.from));
  if (filter.to) conditions.push(lte(conversations.updatedAt, filter.to));
  const rows = await db.select({ title: conversations.title, messages: conversations.messages, updatedAt: conversations.updatedAt }).from(conversations).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(conversations.updatedAt)).limit(5000);
  const counts = new Map<string, number>();
  const subjects = new Map<string, Map<string, number>>();
  for (const row of rows) {
    const title = row.title.toLowerCase();
    const topic = title.startsWith("doutrina:") ? "Professor Doutrinário" : title.startsWith("adm:") ? "Administração da Igreja" : "Filosofia e Projeto Sementes";
    counts.set(topic, (counts.get(topic) ?? 0) + 1);
    try {
      const messages = JSON.parse(row.messages) as Array<{ role?: string; content?: string }>;
      const bucket = subjects.get(topic) ?? new Map<string, number>();
      for (const message of messages.filter((item) => item.role === "user" && typeof item.content === "string")) {
        const subject = classifyReportSubject(message.content ?? "", topic);
        bucket.set(subject, (bucket.get(subject) ?? 0) + 1);
      }
      subjects.set(topic, bucket);
    } catch { /* Conversas antigas sem JSON válido não entram no detalhamento. */ }
  }
  return { totalConversations: rows.length, topics: [...counts.entries()].map(([topic, count]) => ({ topic, count, subjects: [...(subjects.get(topic) ?? new Map()).entries()].map(([subject, subjectCount]) => ({ subject, count: subjectCount })).sort((a, b) => b.count - a.count) })).sort((a, b) => b.count - a.count) };
}
