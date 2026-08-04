"""Build the branded 1200x630 Open Graph image from project-owned sources."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
BACKGROUND = ROOT / "scripts/assets/social-preview-background.png"
OUTPUT = ROOT / "client/public/og/social-preview.png"
HERO_OUTPUT = ROOT / "client/public/hero/illustration-background.webp"


def main() -> None:
    background = Image.open(BACKGROUND).convert("RGB")
    HERO_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    ImageOps.fit(background, (1536, 1024), method=Image.Resampling.LANCZOS).save(
        HERO_OUTPUT, format="WEBP", quality=82, method=6
    )
    canvas = ImageOps.fit(background, (1200, 630), method=Image.Resampling.LANCZOS)
    canvas = canvas.convert("RGBA")

    draw = ImageDraw.Draw(canvas)
    script_font_path = Path("C:/Windows/Fonts/segoescb.ttf")
    sans_font_path = Path("C:/Windows/Fonts/arial.ttf")
    title_font = ImageFont.truetype(str(script_font_path), 104)
    font = ImageFont.truetype(str(sans_font_path), 24)
    title = "Mery Palencia"
    title_box = draw.textbbox((0, 0), title, font=title_font)
    title_x = (1200 - (title_box[2] - title_box[0])) // 2
    draw.text((title_x, 205), title, font=title_font, fill=(247, 250, 250, 255))

    subtitle = "ILUSTRACIÓN DIGITAL · DISEÑO DE PERSONAJES"
    box = draw.textbbox((0, 0), subtitle, font=font)
    x = (1200 - (box[2] - box[0])) // 2
    draw.text((x, 405), subtitle, font=font, fill=(184, 205, 207, 255))

    canvas.convert("RGB").save(OUTPUT, format="PNG", optimize=True)
    print(f"Created {OUTPUT} ({OUTPUT.stat().st_size} bytes)")
    print(f"Created {HERO_OUTPUT} ({HERO_OUTPUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
