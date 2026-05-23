#!/usr/bin/env python3
"""Regenera favicon.* desde public/favicon.svg (mismo diseño que AppLogo)."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "frontend" / "public"
APP = ROOT / "backend" / "src" / "app"

BRAND = "#2563eb"
RX_RATIO = 6 / 32  # rounded-lg proporcional a AppLogo


def draw_mark(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    r = max(2, int(size * RX_RATIO))
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=r, fill=BRAND)
    font_size = int(size * 0.56)
    try:
        font = ImageFont.truetype("arialbd.ttf", font_size)
    except OSError:
        try:
            font = ImageFont.truetype("segoeuib.ttf", font_size)
        except OSError:
            font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), "V", font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1] + size * 0.02
    draw.text((x, y), "V", fill="#ffffff", font=font)
    return img


def main() -> None:
    svg_src = OUT / "favicon.svg"
    if not svg_src.exists():
        raise SystemExit(f"Falta {svg_src}")

    for size, name in [
        (32, "favicon-32.png"),
        (180, "apple-touch-icon.png"),
        (192, "icon-192.png"),
        (512, "icon-512.png"),
    ]:
        draw_mark(size).save(OUT / name, "PNG")

    img32 = draw_mark(32)
    img32.save(OUT / "favicon.ico", format="ICO", sizes=[(32, 32)])

    APP.mkdir(parents=True, exist_ok=True)
    img32.save(APP / "favicon.ico", format="ICO", sizes=[(32, 32)])
    draw_mark(180).save(APP / "apple-icon.png", "PNG")
    svg_src.read_text(encoding="utf-8")
    (APP / "icon.svg").write_text(svg_src.read_text(encoding="utf-8"), encoding="utf-8")

    print("Favicon regenerado (color #2563eb, V como AppLogo)")


if __name__ == "__main__":
    main()
