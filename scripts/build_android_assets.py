"""Generate branded Android launcher and splash resources deterministically."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
RES = ROOT / "admin/android/app/src/main/res"
SCRIPT_FONT = Path("C:/Windows/Fonts/segoescb.ttf")
SANS_FONT = Path("C:/Windows/Fonts/arialbd.ttf")
BACKGROUND = (5, 10, 15, 255)
ACCENT = (29, 219, 192, 255)
WHITE = (247, 250, 250, 255)
MUTED = (165, 185, 188, 255)


def centered_text(draw, canvas_size, y, text, font, fill):
    box = draw.textbbox((0, 0), text, font=font)
    width = box[2] - box[0]
    draw.text(((canvas_size[0] - width) / 2, y - box[1]), text, font=font, fill=fill)


def fitted_font(draw, text, font_path, preferred_size, max_width):
    size = preferred_size
    while size > 12:
        font = ImageFont.truetype(str(font_path), size)
        box = draw.textbbox((0, 0), text, font=font)
        if box[2] - box[0] <= max_width:
            return font
        size -= 2
    return ImageFont.truetype(str(font_path), 12)


def launcher(size: int, foreground_only: bool = False) -> Image.Image:
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0) if foreground_only else BACKGROUND)
    draw = ImageDraw.Draw(image)
    center = size / 2
    radius = size * (0.29 if foreground_only else 0.37)
    draw.ellipse(
        (center - radius, center - radius, center + radius, center + radius),
        outline=ACCENT,
        width=max(2, round(size * 0.018)),
    )
    script = ImageFont.truetype(str(SCRIPT_FONT), round(size * 0.42))
    label = ImageFont.truetype(str(SANS_FONT), round(size * 0.075))
    centered_text(draw, (size, size), size * 0.24, "MP", script, WHITE)
    admin_box = draw.textbbox((0, 0), "ADMIN", font=label)
    letter_spacing = max(1, round(size * 0.008))
    admin_width = (admin_box[2] - admin_box[0]) + letter_spacing * 4
    x = (size - admin_width) / 2
    for character in "ADMIN":
        draw.text((x, size * 0.66), character, font=label, fill=MUTED)
        char_box = draw.textbbox((0, 0), character, font=label)
        x += char_box[2] - char_box[0] + letter_spacing
    return image


def splash(width: int, height: int) -> Image.Image:
    image = Image.new("RGB", (width, height), BACKGROUND[:3])
    draw = ImageDraw.Draw(image)
    short = min(width, height)
    title = fitted_font(
        draw,
        "Mery Palencia",
        SCRIPT_FONT,
        max(42, round(short * 0.13)),
        width * 0.78,
    )
    label = ImageFont.truetype(str(SANS_FONT), max(12, round(short * 0.026)))
    center_y = height * 0.43
    centered_text(draw, (width, height), center_y, "Mery Palencia", title, WHITE[:3])
    centered_text(draw, (width, height), center_y + short * 0.17, "ADMIN", label, ACCENT[:3])
    line_width = short * 0.24
    draw.rounded_rectangle(
        ((width - line_width) / 2, center_y + short * 0.235,
         (width + line_width) / 2, center_y + short * 0.242),
        radius=max(1, round(short * 0.004)),
        fill=ACCENT[:3],
    )
    return image


def main() -> None:
    launcher_sizes = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }
    foreground_sizes = {
        "mipmap-mdpi": 108,
        "mipmap-hdpi": 162,
        "mipmap-xhdpi": 216,
        "mipmap-xxhdpi": 324,
        "mipmap-xxxhdpi": 432,
    }

    for folder, size in launcher_sizes.items():
        destination = RES / folder
        icon = launcher(size)
        icon.save(destination / "ic_launcher.png", optimize=True)
        icon.save(destination / "ic_launcher_round.png", optimize=True)
        launcher(foreground_sizes[folder], foreground_only=True).save(
            destination / "ic_launcher_foreground.png", optimize=True
        )

    for target in RES.glob("drawable*/splash.png"):
        with Image.open(target) as current:
            dimensions = current.size
        splash(*dimensions).save(target, optimize=True)

    print("Generated Android icons and splash resources.")


if __name__ == "__main__":
    main()
