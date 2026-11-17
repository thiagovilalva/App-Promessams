export type ContentExportFormat = "pdf" | "txt";

function ascii(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E\n\r\t]/g, "?");
}

function pdfEscape(value: string) {
  return ascii(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrap(value: string, width = 92) {
  const words = ascii(value).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (!line) line = word;
    else if (line.length + word.length + 1 <= width) line += ` ${word}`;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

/** Gera um PDF textual básico, sem módulo nativo, para leitura e compartilhamento. */
export function makeTextPdf(title: string, text: string) {
  const lines = [`${ascii(title)}`, "", ...ascii(text).split(/\r?\n/).flatMap((line) => line ? wrap(line) : [""])];
  const pages: string[][] = [];
  for (let index = 0; index < lines.length; index += 44) pages.push(lines.slice(index, index + 44));
  if (!pages.length) pages.push([ascii(title)]);

  const objects: string[] = [];
  const pageIds: number[] = [];
  const fontId = 3;
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("<< /Type /Pages /Kids [] /Count 0 >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  for (const pageLines of pages) {
    const content = ["BT", "/F1 10 Tf", "50 780 Td", ...pageLines.map((line, index) => `${index ? "0 -16 Td\n" : ""}(${pdfEscape(line)}) Tj`), "ET"].join("\n");
    const contentId = objects.length + 1;
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    const pageId = objects.length + 1;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  }
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [0];
  objects.forEach((object, index) => { offsets[index + 1] = pdf.length; pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= objects.length; index++) pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}

export function contentText(title: string, items: Array<{ title: string; body: string; scripture: string; practice: string }>) {
  return `${title}\n\n${items.map((item) => `${item.title}\n\n${item.body}\n\nLeitura de apoio: ${item.scripture}\nProximo passo: ${item.practice}`).join(`\n\n${"=".repeat(70)}\n\n`)}`;
}
