import json
import re
from pathlib import Path

source = Path('/tmp/text_editor_extracts/HBJNOVO-1-8bc100e6040e-p1-432.txt')
if not source.exists():
    raise SystemExit(f'Arquivo extraído não encontrado: {source}')
text = source.read_text(encoding='utf-8')
lines = text.splitlines()
starts = []
for i, line in enumerate(lines):
    match = re.match(r'^\s*(\d{1,3})\.\s+(.+?)\s*$', line)
    if match and 1 <= int(match.group(1)) <= 541:
        starts.append((i, int(match.group(1)), match.group(2).strip()))
by_number = {}
for pos, number, title in starts:
    if number in by_number:
        continue
    end = next((item[0] for item in starts if item[0] > pos), len(lines))
    block = lines[pos + 1:end]
    while block and (not block[0].strip() or block[0].strip() == '\x0c'):
        block.pop(0)
    metadata_end = 0
    for j, line in enumerate(block[:30]):
        if re.match(r'^\s*Tom\s*:', line, re.I):
            metadata_end = j + 1
            break
    lyric_lines = block[metadata_end:]
    cleaned = []
    for line in lyric_lines:
        value = line.replace('\x0c', '').strip()
        if not value:
            if cleaned and cleaned[-1] != '':
                cleaned.append('')
            continue
        if re.fullmatch(r'\d{1,3}', value):
            continue
        if re.fullmatch(r'\d{1,3}\s*[-–—]\s*\d{1,3}', value):
            continue
        cleaned.append(value)
    while cleaned and cleaned[-1] == '':
        cleaned.pop()
    lyrics = '\n'.join(cleaned).strip()
    by_number[number] = {'number': number, 'title': title, 'lyrics': lyrics}

hymns = [by_number[n] for n in sorted(by_number)]
if len(hymns) != 541:
    raise SystemExit(f'Esperados 541 hinos, extraídos {len(hymns)}')

# The thematic section starts after the title and ends at the comparative index.
thematic_start = text.find('ÍNDICE TEMÁTICO DO NOVO HINÁRIO')
comparative_start = text.find('Índice comparativo BJ e novo HBJ')
thematic_text = text[thematic_start:comparative_start]
sections = []
current_group = ''
current_topic = ''
for raw in thematic_text.splitlines():
    line = raw.strip()
    if not line or line.startswith('ÍNDICE') or line.startswith('BRADOS'):
        continue
    entry = re.match(r'^(\d{1,3})\s+(.+?)\s*$', line)
    if entry and 1 <= int(entry.group(1)) <= 541:
        sections.append({'group': current_group, 'topic': current_topic, 'number': int(entry.group(1)), 'title': entry.group(2).strip()})
    elif not re.search(r'^\d+$', line) and not re.search(r'^[-–—]+$', line):
        if not current_group:
            current_group = line
        elif line.isupper() or line == line.upper():
            current_group = line
            current_topic = ''
        else:
            current_topic = line

comparative_text = text[comparative_start:]
comparative = []
for raw in comparative_text.splitlines():
    match = re.match(r'^\s*(\d{1,3})\s+(.+?)\s+(\d{1,3})\s*$', raw)
    if match and 1 <= int(match.group(1)) <= 600 and 1 <= int(match.group(3)) <= 541:
        comparative.append({'oldNumber': int(match.group(1)), 'title': match.group(2).strip(), 'newNumber': int(match.group(3))})

out = Path('/home/ubuntu/projeto-sementes/shared/hbj-data.ts')
out.write_text(
    '// Generated from HBJNOVO-1.pdf. Do not edit manually.\n'
    'export type HbjHymn = { number: number; title: string; lyrics: string };\n'
    'export type HbjThemeEntry = { group: string; topic: string; number: number; title: string };\n'
    'export type HbjComparison = { oldNumber: number; title: string; newNumber: number };\n\n'
    f'export const HBJ_HYMNS: HbjHymn[] = {json.dumps(hymns, ensure_ascii=False, indent=2)};\n\n'
    f'export const HBJ_THEMES: HbjThemeEntry[] = {json.dumps(sections, ensure_ascii=False, indent=2)};\n\n'
    f'export const HBJ_COMPARISON: HbjComparison[] = {json.dumps(comparative, ensure_ascii=False, indent=2)};\n',
    encoding='utf-8',
)
print(f'generated {out} hymns={len(hymns)} themes={len(sections)} comparative={len(comparative)}')
