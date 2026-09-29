import { HBJ_HYMNS } from "./hbj-data";
import { PAO_DIARIO_DAYS } from "./pao-diario-data";
import { READING_PLAN } from "./reading-plan";
import { FULL_DOCUMENT_TEXT } from "./full-document";
import { PROJECT_FULL_DOCUMENT } from "./project-full-document";
import { REGIONAL_MINISTRIES_DOCUMENT } from "./regional-ministries-document";
import { REGIONAL_MINISTRIES_SLIDES } from "./regional-ministries-slides";

type SearchItem = { source: string; title: string; text: string };

function normalize(value: string) {
  return value.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function terms(query: string) {
  return normalize(query).split(/[^a-z0-9]+/).filter((term) => term.length >= 2 || /^\d+$/.test(term));
}

function score(item: SearchItem, queryTerms: string[]) {
  const haystack = normalize(`${item.title} ${item.text}`);
  return queryTerms.reduce((total, term) => total + (haystack.includes(term) ? (normalize(item.title).includes(term) ? 4 : 1) : 0), 0);
}

function topMatches(items: SearchItem[], query: string, limit: number, minimum = 1) {
  const queryTerms = terms(query);
  if (!queryTerms.length) return items.slice(0, limit);
  return items.map((item) => ({ item, score: score(item, queryTerms) })).filter(({ score: value }) => value >= minimum).sort((a, b) => b.score - a.score).slice(0, limit).map(({ item }) => item);
}

const apostilaSections: SearchItem[] = REGIONAL_MINISTRIES_DOCUMENT.split(/\n(?=\d+(?:\.\d+)*\.?\s)/g).map((text, index) => ({
  source: "Apostila de Ministérios Regionais — Base Sementes",
  title: text.split("\n")[0]?.trim() || `Seção ${index + 1}`,
  text,
}));

const localItems: SearchItem[] = [
  { source: "Filosofia da Semente — documento integral", title: "Filosofia da Semente", text: FULL_DOCUMENT_TEXT },
  { source: "Projeto Sementes — documento integral", title: "Projeto Sementes", text: PROJECT_FULL_DOCUMENT },
  ...apostilaSections,
  { source: "Ministérios Regionais — apresentação de 88 slides", title: "Apresentação completa dos Ministérios Regionais", text: REGIONAL_MINISTRIES_SLIDES },
  ...READING_PLAN.map((item) => ({ source: "Bíblia Livre — Plano Bíblia & Devocionais", title: `${item.reference} — ${item.title}`, text: `${item.readingText}\n${item.hermeneutics}\n${item.dialogue}\n${item.application}` })),
  ...PAO_DIARIO_DAYS.map((item) => ({ source: "Pão Diário na Missão", title: `Dia ${item.day} — ${item.title}`, text: `${item.reading}\n${item.reflection}\n${item.prayer}\n${item.action}` })),
  ...HBJ_HYMNS.map((item) => ({ source: "Hinário HBJ — Brados de Júbilo", title: `Hino ${item.number} — ${item.title}`, text: item.lyrics })),
];

export function buildLibraryContext(query: string) {
  const matches = topMatches(localItems, query, 10, 1);
  const sections = matches.length ? matches : localItems.slice(0, 3);
  return `\n\nBASE LOCAL COMPLEMENTAR — consulte os trechos relevantes abaixo e identifique a fonte quando útil. O Pão Diário, o HBJ e a Apostila de Ministérios Regionais fazem parte da mesma visão de aplicação da Filosofia e do Projeto.\n${sections.map((item) => `\n### ${item.source}\n## ${item.title}\n${item.text.slice(0, 9000)}`).join("\n")}`;
}

const bibleBooks: Array<[RegExp, string]> = [
  [/\b(genesis|genesis)\b/i, "GEN"], [/\b(exodo)\b/i, "EXO"], [/\b(levitico)\b/i, "LEV"], [/\b(numeros)\b/i, "NUM"], [/\b(deuteronomio)\b/i, "DEU"],
  [/\b(josue)\b/i, "JOS"], [/\b(juizes)\b/i, "JDG"], [/\brute\b/i, "RUT"], [/\b(1\s*samuel)\b/i, "1SA"], [/\b(2\s*samuel)\b/i, "2SA"],
  [/\b(1\s*reis)\b/i, "1KI"], [/\b(2\s*reis)\b/i, "2KI"], [/\b(salmos|salmo)\b/i, "PSA"], [/\b(proverbios)\b/i, "PRO"], [/\b(isaias)\b/i, "ISA"],
  [/\b(jeremias)\b/i, "JER"], [/\b(daniel)\b/i, "DAN"], [/\b(mateus)\b/i, "MAT"], [/\b(marcos)\b/i, "MRK"], [/\b(lucas)\b/i, "LUK"],
  [/\b(joao)\b/i, "JHN"], [/\b(atos)\b/i, "ACT"], [/\b(romanos)\b/i, "ROM"], [/\b(1\s*corintios)\b/i, "1CO"], [/\b(2\s*corintios)\b/i, "2CO"],
  [/\b(galatas)\b/i, "GAL"], [/\b(efesios)\b/i, "EPH"], [/\b(filipenses)\b/i, "PHP"], [/\b(colossenses)\b/i, "COL"], [/\b(hebreus)\b/i, "HEB"],
  [/\b(tiago)\b/i, "JAS"], [/\b(1\s*pedro)\b/i, "1PE"], [/\b(2\s*pedro)\b/i, "2PE"], [/\b(1\s*joao)\b/i, "1JN"], [/\b(apocalipse)\b/i, "REV"],
];

export async function buildBibleReferenceContext(query: string) {
  const match = bibleBooks.find(([pattern]) => pattern.test(normalize(query)));
  const chapterMatch = normalize(query).match(/(?:capitulo|cap|:)\s*(\d{1,3})|\b(?:[a-z]+)\s+(\d{1,3})(?::|\s|$)/i);
  if (!match || !chapterMatch) return "";
  const chapter = Number(chapterMatch[1] || chapterMatch[2]);
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > 150) return "";
  try {
    const response = await fetch(`https://bible.helloao.org/api/por_blj/${match[1]}/${chapter}.json`);
    if (!response.ok) return "";
    const data = await response.json() as { book?: { name?: string }; chapter?: { number?: number; content?: Array<{ type?: string; number?: number; content?: string[] }> } };
    const verses = (data.chapter?.content ?? []).filter((verse) => verse.type === "verse").map((verse) => `${verse.number} ${verse.content?.join(" ") ?? ""}`).join("\n");
    return verses ? `\n\nBÍBLIA LIVRE — referência solicitada\n${data.book?.name ?? match[0]} ${data.chapter?.number ?? chapter}\n${verses.slice(0, 14000)}` : "";
  } catch {
    return "";
  }
}
