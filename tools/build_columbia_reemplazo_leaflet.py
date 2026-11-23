#!/usr/bin/env python3
"""1-page leaflet for Columbia/Okura robot-arm replacement.

Uses only the official reel still and published manufacturer copy.
Does not invent technical data. Output: site/img/fichas/<slug>.pdf
"""
from __future__ import annotations

import io
import json
from pathlib import Path

from PIL import Image
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data" / "columbia_reemplazo_robot_catalog.json"
OUT_DIR = ROOT / "site" / "img" / "fichas"
FONT_REG = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"

NAVY = HexColor("#1a2a4a")
RED = HexColor("#c8102e")
INK = HexColor("#1c1c1c")
MUTED = HexColor("#5a5f6a")
BG = HexColor("#f4f5f7")


def wrap(c: canvas.Canvas, text: str, font: str, size: float, max_w: float) -> list[str]:
    words = (text or "").split()
    lines: list[str] = []
    cur = ""
    for word in words:
        trial = (cur + " " + word).strip()
        if c.stringWidth(trial, font, size) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines or [""]


def compress_photo(path: Path) -> bytes:
    im = Image.open(path).convert("RGB")
    im.thumbnail((900, 900), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=72, optimize=True, progressive=True)
    return buf.getvalue()


def draw_leaflet(path: Path, product: dict, brand: str, photo: bytes) -> None:
    name = product["name"]
    slug = product["slug"]
    detail = product["detail"]
    specs = product["specs"]

    c = canvas.Canvas(str(path), pagesize=A4)
    c.setTitle(f"Ficha técnica · {name}")
    c.setAuthor("LPAEZSIS")
    w, h = A4
    m_l, m_r = 16 * mm, 16 * mm
    inner = w - m_l - m_r

    c.setFillColor(NAVY)
    c.rect(0, h - 22 * mm, w, 22 * mm, fill=1, stroke=0)
    c.setFillColor(RED)
    c.rect(0, h - 23.4 * mm, w, 1.4 * mm, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Sans-Bold", 13)
    c.drawString(m_l, h - 11 * mm, "LPAEZSIS")
    c.setFont("Sans", 8.5)
    c.drawRightString(w - m_r, h - 9.2 * mm, brand)
    c.drawRightString(w - m_r, h - 13.6 * mm, "Ficha técnica · 1 página")

    y = h - 34 * mm
    c.setFillColor(INK)
    c.setFont("Sans-Bold", 16)
    for line in wrap(c, name, "Sans-Bold", 16, inner):
        c.drawString(m_l, y, line)
        y -= 6.2 * mm
    c.setFillColor(RED)
    c.setFont("Sans-Bold", 8)
    c.drawString(m_l, y, "COTIZAR")
    y -= 6 * mm

    img = Image.open(io.BytesIO(photo))
    max_w, max_h = inner, 78 * mm
    ratio = min(max_w / img.width, max_h / img.height)
    dw, dh = img.width * ratio, img.height * ratio
    c.setFillColor(BG)
    c.roundRect(m_l, y - dh - 4 * mm, inner, dh + 8 * mm, 3, fill=1, stroke=0)
    tmp_jpg = path.with_suffix(".photo.jpg")
    tmp_jpg.write_bytes(photo)
    c.drawImage(str(tmp_jpg), m_l + (inner - dw) / 2, y - dh, width=dw, height=dh, mask="auto")
    tmp_jpg.unlink(missing_ok=True)
    y -= dh + 10 * mm

    c.setFillColor(INK)
    c.setFont("Sans", 9.2)
    for line in wrap(c, detail, "Sans", 9.2, inner)[:7]:
        c.drawString(m_l, y, line)
        y -= 4.4 * mm
    y -= 2 * mm

    c.setFillColor(NAVY)
    c.setFont("Sans-Bold", 10)
    c.drawString(m_l, y, "Datos técnicos")
    y -= 2 * mm
    c.setStrokeColor(RED)
    c.setLineWidth(1)
    c.line(m_l, y, m_l + 28 * mm, y)
    y -= 5.5 * mm
    row_h = 6.2 * mm
    for i, (key, val) in enumerate(specs[:10]):
        if y < 28 * mm:
            break
        if i % 2 == 0:
            c.setFillColor(BG)
            c.rect(m_l, y - 1.8 * mm, inner, row_h, fill=1, stroke=0)
        c.setFillColor(MUTED)
        c.setFont("Sans", 8)
        c.drawString(m_l + 2 * mm, y, key[:42])
        c.setFillColor(INK)
        c.setFont("Sans", 8.2)
        val_lines = wrap(c, val, "Sans", 8.2, inner - 52 * mm)
        c.drawString(m_l + 50 * mm, y, val_lines[0])
        y -= row_h
        for extra in val_lines[1:]:
            if y < 28 * mm:
                break
            c.drawString(m_l + 50 * mm, y, extra)
            y -= 4 * mm

    c.setFillColor(NAVY)
    c.rect(0, 0, w, 18 * mm, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Sans", 7.4)
    c.drawString(m_l, 10.2 * mm, "Fuente: datos y foto publicados del fabricante.")
    c.drawString(m_l, 6.2 * mm, "LPAEZSIS · Chile · www.lpaezsis.cl · Cotización o compra según producto.")
    c.setFont("Sans", 7)
    c.drawRightString(w - m_r, 8 * mm, slug[:42])
    c.showPage()
    c.save()


def main() -> None:
    pdfmetrics.registerFont(TTFont("Sans", FONT_REG))
    pdfmetrics.registerFont(TTFont("Sans-Bold", FONT_BOLD))
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    brand = catalog["brand"]["name"]
    for prod in catalog["products"]:
        photo_path = ROOT / "site" / prod["image_url"]
        if not photo_path.is_file():
            raise SystemExit(f"Falta foto real {photo_path}")
        out = OUT_DIR / f"{prod['slug']}.pdf"
        draw_leaflet(out, prod, brand, compress_photo(photo_path))
        print("ok", prod["slug"], out.stat().st_size)


if __name__ == "__main__":
    main()
