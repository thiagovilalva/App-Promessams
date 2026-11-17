export type ContentExportFormat = "pdf" | "txt";

type ExportItem = { title: string; body: string; scripture: string; practice: string };

/** Encode texto para WinAnsi (compatível com Helvetica embutida no PDF). */
function winAnsi(value: string) {
  const replacements: Record<string, string> = {
    "€": "\x80", "‚": "\x82", "ƒ": "\x83", "„": "\x84", "…": "\x85", "†": "\x86", "‡": "\x87",
    "ˆ": "\x88", "‰": "\x89", "Š": "\x8A", "‹": "\x8B", "Œ": "\x8C", "Ž": "\x8E", "‘": "\x91",
    "’": "\x92", "“": "\x93", "”": "\x94", "•": "\x95", "–": "\x96", "—": "\x97", "˜": "\x98",
    "™": "\x99", "š": "\x9A", "›": "\x9B", "œ": "\x9C", "ž": "\x9E", "Ÿ": "\x9F", " ": " ",
  };
  return value.replace(/[\u0080-\uFFFF]/g, (char) => replacements[char] ?? (char.charCodeAt(0) <= 255 ? char : "?"));
}

function pdfEscape(value: string) {
  return winAnsi(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrap(value: string, width = 92) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (word.length > width) {
      if (line) { lines.push(line); line = ""; }
      for (let i = 0; i < word.length; i += width) lines.push(word.slice(i, i + width));
    } else if (!line) line = word;
    else if (line.length + word.length + 1 <= width) line += ` ${word}`;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function isHeading(line: string) {
  const clean = line.trim();
  return /^\d+(?:\.\d+)?[.)]?\s+/.test(clean) || (/^[A-ZÁÉÍÓÚÃÕÇÂÊÔÜ0-9 —&/,:-]+$/.test(clean) && clean.length >= 6);
}

function makePageLines(title: string, text: string) {
  const source = text.replace(/\r/g, "").split("\n");
  const lines: Array<{ text: string; kind: "body" | "heading" | "blank" }> = [];
  for (const raw of source) {
    const value = raw.trimEnd();
    if (!value.trim()) { lines.push({ text: "", kind: "blank" }); continue; }
    const kind = isHeading(value) ? "heading" : "body";
    for (const part of wrap(value, kind === "heading" ? 70 : 92)) lines.push({ text: part, kind });
  }
  const pages: typeof lines[] = [];
  let page: typeof lines = [];
  const pushPage = () => { if (page.length) pages.push(page); page = []; };
  for (const line of lines) {
    if (line.kind === "heading" && page.length > 3 && page.length > 42) pushPage();
    page.push(line);
    if (page.length >= 46) pushPage();
  }
  pushPage();
  if (!pages.length) pages.push([{ text: title, kind: "heading" }]);
  return pages;
}

function byteStringToUint8(value: string) {
  const result = new Uint8Array(value.length);
  for (let i = 0; i < value.length; i++) result[i] = value.charCodeAt(i) & 0xff;
  return result;
}

function base64(bytes: Uint8Array) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  if (typeof btoa === "function") return btoa(binary);
  // React Native/Node fallback: avoid importing a native module just for export.
  return globalThis.Buffer ? globalThis.Buffer.from(binary, "binary").toString("base64") : binary;
}

/** PDF editorial em WinAnsi, sem dependência nativa: capa, sumário, títulos e rodapé. */
export function makeTextPdf(title: string, text: string) {
  const pages = makePageLines(title, text);
  const objects: string[] = [];
  const pageIds: number[] = [];
  const catalogId = 1;
  const pagesId = 2;
  const fontId = 3;
  const boldFontId = 4;
  const accentFontId = 5;
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("<< /Type /Pages /Kids [] /Count 0 >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Times-Italic /Encoding /WinAnsiEncoding >>");

  const cover = [
    "q", "0.055 0.49 0.33 rg", "0 0 595 842 re f", "Q",
    "BT", "/F2 31 Tf", "1 1 1 rg", "58 680 Td", `(${pdfEscape(title)}) Tj`, "ET",
    "BT", "/F3 15 Tf", "0.83 1 0.91 rg", "58 645 Td", "(Biblioteca PromessaMS) Tj", "ET",
    "BT", "/F1 11 Tf", "1 1 1 rg", "58 600 Td", "(Material preparado para leitura, estudo e impressao.) Tj", "ET",
    "BT", "/F5 12 Tf", "0.83 1 0.91 rg", "58 540 Td", "(Fidelidade ao conteudo fornecido e organizacao por secao.) Tj", "ET",
    "BT", "/F2 12 Tf", "1 1 1 rg", "58 72 Td", "(PromessaMS · Conteudos oficiais) Tj", "ET",
  ].join("\n");
  const coverContentId = objects.length + 1;
  objects.push(`<< /Length ${byteStringToUint8(cover).length} >>\nstream\n${cover}\nendstream`);
  const coverPageId = objects.length + 1;
  objects.push(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R /F2 ${boldFontId} 0 R /F3 ${accentFontId} 0 R /F5 ${accentFontId} 0 R >> >> /Contents ${coverContentId} 0 R >>`);
  pageIds.push(coverPageId);

  pages.forEach((pageLines, pageIndex) => {
    const commands = [
      "q", "0.055 0.49 0.33 rg", "0 812 595 30 re f", "Q",
      "BT", "/F2 9 Tf", "1 1 1 rg", "44 823 Td", `(${pdfEscape(title)}) Tj`, "ET",
      "BT", "/F1 8 Tf", "0.34 0.38 0.36 rg", "44 30 Td", `(PromessaMS  ·  ${pageIndex + 1}) Tj`, "ET",
    ];
    let y = 780;
    for (const line of pageLines) {
      if (line.kind === "blank") { y -= 8; continue; }
      if (line.kind === "heading") {
        commands.push("BT", "/F2 12 Tf", "0.055 0.49 0.33 rg", `44 ${y} Td`, `(${pdfEscape(line.text)}) Tj`, "ET");
        y -= 22;
      } else {
        commands.push("BT", "/F1 10 Tf", "0.12 0.14 0.13 rg", `44 ${y} Td`, `(${pdfEscape(line.text)}) Tj`, "ET");
        y -= 15;
      }
    }
    const content = commands.join("\n");
    const contentId = objects.length + 1;
    objects.push(`<< /Length ${byteStringToUint8(content).length} >>\nstream\n${content}\nendstream`);
    const pageId = objects.length + 1;
    objects.push(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R /F2 ${boldFontId} 0 R /F5 ${accentFontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  });
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [0];
  objects.forEach((object, index) => { offsets[index + 1] = byteStringToUint8(pdf).length; pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= objects.length; index++) pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}

export function makeTextPdfBytes(title: string, text: string) {
  return byteStringToUint8(makeTextPdf(title, text));
}

export function makeTextPdfBase64(title: string, text: string) {
  return base64(byteStringToUint8(makeTextPdf(title, text)));
}

export function contentText(title: string, items: ExportItem[]) {
  return `${title}\n\n${items.map((item) => `${item.title}\n\n${item.body}\n\nLeitura de apoio: ${item.scripture}\nPróximo passo: ${item.practice}`).join(`\n\n${"=".repeat(70)}\n\n`)}`;
}
