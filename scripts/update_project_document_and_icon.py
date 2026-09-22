import json, re, shutil, zipfile
from pathlib import Path
from xml.etree import ElementTree as ET
from PIL import Image

root = Path('/home/ubuntu/projeto-sementes')
# Preserve the PDF supplied by the user alongside the generated text.
source_pdf = Path('/home/ubuntu/upload/Projeto_Sementes_Revisado11092026.pdf')
(root / 'assets/documents').mkdir(parents=True, exist_ok=True)
shutil.copy2(source_pdf, root / 'assets/documents/Projeto_Sementes_Revisado11092026.pdf')

# Extract the PDF layout text already produced by pdftotext, removing only page separators.
pdf_text = Path('/tmp/projeto-sementes-revisado.txt').read_text(encoding='utf-8')
pdf_text = pdf_text.replace('\f', '\n').strip()
(root / 'shared/project-full-document.ts').write_text(
    '// Generated from Projeto_Sementes_Revisado11092026.pdf. Keep this file read-only in the admin UI.\n'
    + 'export const PROJECT_FULL_DOCUMENT = ' + json.dumps(pdf_text, ensure_ascii=False) + ';\n', encoding='utf-8'
)

# Prepare the user-provided profile image as app icon assets without changing its aspect ratio.
src = Path('/tmp/promessams-icon.jpg')
im = Image.open(src).convert('RGB')
side = min(im.size)
left = (im.width - side) // 2
upper = (im.height - side) // 2
square = im.crop((left, upper, left + side, upper + side)).resize((1024, 1024), Image.Resampling.LANCZOS)
square.save(root / 'assets/images/icon.png', format='PNG', optimize=True)
# Adaptive foreground is transparent-safe, while background is a matching solid color.
square.save(root / 'assets/images/android-icon-foreground.png', format='PNG', optimize=True)
Image.new('RGB', (1024, 1024), '#F3F8F4').save(root / 'assets/images/android-icon-background.png', format='PNG', optimize=True)
square.resize((512, 512), Image.Resampling.LANCZOS).save(root / 'assets/images/android-icon-monochrome.png', format='PNG', optimize=True)
square.resize((256, 256), Image.Resampling.LANCZOS).save(root / 'assets/images/favicon.png', format='PNG', optimize=True)
print('document_bytes', (root / 'shared/project-full-document.ts').stat().st_size)
print('icon_source', im.size, 'icon_output', square.size)
