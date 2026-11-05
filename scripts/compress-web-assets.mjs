import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { brotliCompress, gzip, constants } from 'node:zlib';
const root = path.resolve('web-dist');
const br = promisify(brotliCompress);
const gz = promisify(gzip);
let original = 0, compressed = 0, count = 0;
async function compressDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) { await compressDirectory(target); continue; }
    if (!/\.(js|css|json|html)$/.test(entry.name)) continue;
    const input = await readFile(target);
    if (input.length < 1024) continue;
    const brotli = await br(input, { params: { [constants.BROTLI_PARAM_QUALITY]: 6 } });
    const zipped = await gz(input, { level: 6 });
    if (brotli.length < input.length) await writeFile(`${target}.br`, brotli);
    if (zipped.length < input.length) await writeFile(`${target}.gz`, zipped);
    original += input.length; compressed += brotli.length; count++;
  }
}
await compressDirectory(root);
console.log(`Web assets: ${count} files, ${original} original bytes -> ${compressed} Brotli bytes`);
