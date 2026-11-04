#!/usr/bin/env python3
"""Copy public radio directory data into the bundled PromessaMS knowledge files."""
import json
from pathlib import Path
import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://promessams-gt8vmutx.manus.space'
programs = []
churches = []
for route in ['programacao', 'igrejas']:
    response = requests.get(f'{BASE}/{route}/', timeout=45)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, 'html.parser')
    for h in soup.find_all('h2'):
        card = h.parent
        # Each card contains its heading, descriptive paragraphs and its link.
        while card and not card.find('a', href=True):
            card = card.parent
        if card is None:
            continue
        paragraphs = [p.get_text(' ', strip=True) for p in card.find_all('p')]
        link = card.find('a', href=True)['href']
        name = h.get_text(' ', strip=True)
        if route == 'igrejas':
            if 'maps.' not in link or len(paragraphs) < 2:
                raise ValueError(f'Unexpected church card: {name} {paragraphs} {link}')
            churches.append({'name': name, 'city': paragraphs[0], 'address': paragraphs[1], 'mapUrl': link})
        else:
            texts = list(card.stripped_strings)
            host = next((p for p in paragraphs if p and 'WhatsApp' not in p), '')
            # Program weekday/time labels are separate elements before the title.
            heading_pos = texts.index(name)
            before = texts[:heading_pos]
            programs.append({'name': name, 'schedule': ' · '.join(before), 'host': host, 'contactUrl': link})
if len(programs) != 5 or len(churches) != 35:
    raise ValueError(f'Expected 5 programs and 35 churches, got {len(programs)}, {len(churches)}')
content = '// Copied from the public institutional directory on 2026-11-04.\n'
content += '// Bundled data: users never navigate to the source domain to read it.\n'
content += 'export const RADIO_PROGRAMS = ' + json.dumps(programs, ensure_ascii=False, indent=2) + ' as const;\n\n'
content += 'export const REGIONAL_CHURCHES = ' + json.dumps(churches, ensure_ascii=False, indent=2) + ' as const;\n'
(ROOT / 'shared/radio-community.ts').write_text(content, encoding='utf-8')
(ROOT / 'shared/radio-community-source.json').write_text(json.dumps({'source': BASE, 'retrieved': '2026-11-04', 'programs': programs, 'churches': churches}, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(programs, ensure_ascii=False, indent=2))
print('Imported churches:', len(churches))
