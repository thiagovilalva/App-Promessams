from pathlib import Path

source = Path('/tmp/apostila-ministerios-regionais.txt')
out = Path('shared/regional-ministries-document.ts')
text = source.read_text(errors='replace').replace('\x0c', '\n\n')
# Normalize repeated page whitespace while preserving the apostila's wording.
text = '\n'.join(line.rstrip() for line in text.splitlines())
text = '\n'.join(line for line in text.split('\n') if line.strip() or (line == '' and False))
out.write_text(
    '// Generated from Apostila_Ministerios_Regionais_Base_Sementes.pdf. Do not edit manually.\n'
    + 'export const REGIONAL_MINISTRIES_DOCUMENT = ' + repr(text).replace('\\x27', "\\'") + ';\n'
)
print(f'generated {out} ({len(text)} chars)')
