from PIL import Image
from pathlib import Path

assets = Path("assets/images")
logo = Image.open(assets / "projeto-sementes-logo.png").convert("RGBA")

# Main Expo icon: preserve the complete symbol on a clean square canvas.
canvas = Image.new("RGBA", (1024, 1024), (252, 251, 248, 255))
fit = logo.copy()
fit.thumbnail((820, 820), Image.Resampling.LANCZOS)
canvas.alpha_composite(fit, ((1024 - fit.width) // 2, (1024 - fit.height) // 2))
canvas.convert("RGB").save(assets / "icon.png", optimize=True)

# Android adaptive foreground: keep generous safe-area padding for launcher masks.
foreground = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
fit_fg = logo.copy()
fit_fg.thumbnail((360, 360), Image.Resampling.LANCZOS)
foreground.alpha_composite(fit_fg, ((512 - fit_fg.width) // 2, (512 - fit_fg.height) // 2))
foreground.save(assets / "android-icon-foreground.png", optimize=True)

# Solid adaptive background matching the app brand.
Image.new("RGBA", (512, 512), (233, 247, 240, 255)).save(assets / "android-icon-background.png", optimize=True)
print("prepared", assets / "icon.png", assets / "android-icon-foreground.png", assets / "android-icon-background.png")
