import json
from pathlib import Path

source = Path('/tmp/ministerios-regionais-slides.txt')
out = Path('shared/regional-ministries-slides.ts')
text = source.read_text(errors='replace')
out.write_text(
    '// Generated from Ministerios_Regionais_Apresentacao_Completa_88_slides.pptx. Do not edit manually.\n'
    + 'export const REGIONAL_MINISTRIES_SLIDES = ' + json.dumps(text, ensure_ascii=False) + ';\n'
)
print(f'generated {out} ({len(text)} chars)')
