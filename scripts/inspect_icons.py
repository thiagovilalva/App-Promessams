from PIL import Image
from pathlib import Path

for name in ["icon.png", "projeto-sementes-logo.png", "android-icon-foreground.png", "android-icon-background.png"]:
    path = Path("assets/images") / name
    image = Image.open(path)
    print(name, image.size, image.mode)
