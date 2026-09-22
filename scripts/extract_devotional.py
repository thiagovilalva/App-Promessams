import json, re, zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

source = Path('/home/ubuntu/upload/Devocional_365_Pão-Diário-Na-Missão.docx')
out = Path('shared/pao-diario-data.ts')
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with zipfile.ZipFile(source) as z:
    root = ET.fromstring(z.read('word/document.xml'))
paragraphs = []
for p in root.findall('.//w:body/w:p', ns):
    text = ''.join((t.text or '') for t in p.findall('.//w:t', ns)).strip()
    if text:
        paragraphs.append(re.sub(r'\s+', ' ', text))

days = []
current = None
section = None
for text in paragraphs:
    m = re.fullmatch(r'DIA\s+(\d+)', text, re.I)
    if m:
        if current:
            days.append(current)
        current = {'day': int(m.group(1)), 'title': '', 'reading': '', 'reflection': '', 'prayer': '', 'action': ''}
        section = 'title'
        continue
    if not current:
        continue
    upper = text.upper()
    if upper == 'PALAVRA DE DEUS': section = 'reading'; continue
    if upper == 'REFLEXÃO': section = 'reflection'; continue
    if upper == 'PONTO DE ORAÇÃO': section = 'prayer'; continue
    if upper in ('DESAFIO / AÇÃO', 'DESAFIO/ AÇÃO', 'DESAFIO / ACAO'): section = 'action'; continue
    if section == 'title' and not current['title']:
        current['title'] = text
    elif section:
        current[section] += (' ' if current[section] else '') + text
if current:
    days.append(current)
days = [d for d in days if 1 <= d['day'] <= 365]
days.sort(key=lambda d: d['day'])
for d in days:
    for key in ('title','reading','reflection','prayer','action'):
        d[key] = d[key].strip()
assert len(days) >= 365, len(days)
# Keep exactly one entry per day, preferring the first if the source repeats pagination markers.
unique = {d['day']: d for d in days}
days = [unique[i] for i in range(1, 366)]
text = '// Generated from Devocional_365_Pão-Diário-Na-Missão.docx. Do not edit manually.\n\n'
text += 'export type DevotionalDay = { day: number; title: string; reading: string; reflection: string; prayer: string; action: string };\n\n'
text += 'export const PAO_DIARIO_DAYS: DevotionalDay[] = ' + json.dumps(days, ensure_ascii=False, indent=2) + ';\n'
out.write_text(text, encoding='utf-8')
print(f'generated {out} with {len(days)} days, {out.stat().st_size} bytes')
