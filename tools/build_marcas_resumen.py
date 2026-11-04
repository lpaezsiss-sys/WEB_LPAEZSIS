#!/usr/bin/env python3
"""Build a lightweight brand-overview PDF for email / WhatsApp.

Uses only published brand copy and real catalog photos. Does not invent
capacities, CPM or stock photography.
Output: site/img/fichas/lpaez-representaciones-industriales.pdf
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
DATA = ROOT / "data" / "marcas_resumen.json"
OUT = ROOT / "site" / "img" / "fichas" / "lpaez-representaciones-industriales.pdf"
FONT_REG = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
FONT_ITAL = "/usr/share/fonts/truetype/liberation/LiberationSans-Italic.ttf"

NAVY = HexColor("#1a2a4a")
NAVY_DEEP = HexColor("#121c33")
RED = HexColor("#c8102e")
INK = HexColor("#1c1c1c")
MUTED = HexColor("#5a5f6a")
BG = HexColor("#f4f5f7")
LINE = HexColor("#d8dbe2")
CHIP_BG = HexColor("#eef1f6")


def register_fonts() -> None:
    pdfmetrics.registerFont(TTFont("Sans", FONT_REG))
    pdfmetrics.registerFont(TTFont("Sans-Bold", FONT_BOLD))
    if Path(FONT_ITAL).is_file():
        pdfmetrics.registerFont(TTFont("Sans-Italic", FONT_ITAL))
    else:
        pdfmetrics.registerFont(TTFont("Sans-Italic", FONT_REG))


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


def compress_photo(path: Path, max_side: int = 520, quality: int = 62) -> bytes | None:
    if not path.is_file():
        return None
    try:
        im = Image.open(path)
        if im.mode in {"RGBA", "P"}:
            bg = Image.new("RGB", im.size, (255, 255, 255))
            bg.paste(im.convert("RGBA"), mask=im.convert("RGBA").split()[-1] if im.mode == "RGBA" else None)
            im = bg
        else:
            im = im.convert("RGB")
        im.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, "JPEG", quality=quality, optimize=True, progressive=True)
        return buf.getvalue()
    except Exception:
        return None


def photo_reader(path: Path):
    data = compress_photo(path)
    if not data:
        return None, 0, 0
    im = Image.open(io.BytesIO(data))
    tmp = path.with_suffix(".pdfphoto.jpg")
    tmp.write_bytes(data)
    return tmp, im.width, im.height


def draw_footer(c: canvas.Canvas, doc: dict, page: int, total: int) -> None:
    w, _ = A4
    c.setFillColor(NAVY)
    c.rect(0, 0, w, 14 * mm, fill=1, stroke=0)
    c.setFillColor(RED)
    c.rect(0, 14 * mm, w, 1.1 * mm, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Sans", 7)
    c.drawString(14 * mm, 8.2 * mm, f"{doc['web']}  ·  {doc['email']}  ·  {doc['whatsapp']}")
    c.drawRightString(w - 14 * mm, 8.2 * mm, f"{page} / {total}")
    c.setFont("Sans", 6.2)
    c.drawString(14 * mm, 4.2 * mm, doc["footer"])


def draw_logo(c: canvas.Canvas, path: Path, x: float, y: float, box_w: float, box_h: float) -> None:
    if not path.is_file():
        return
    try:
        im = Image.open(path)
        if im.mode not in {"RGB", "RGBA"}:
            im = im.convert("RGBA")
        ratio = min(box_w / im.width, box_h / im.height)
        dw, dh = im.width * ratio, im.height * ratio
        tmp = path.with_name(path.stem + ".pdflogo.png")
        im.save(tmp, "PNG")
        c.drawImage(
            str(tmp),
            x,
            y + (box_h - dh) / 2,
            width=dw,
            height=dh,
            mask="auto",
        )
        tmp.unlink(missing_ok=True)
    except Exception:
        return


def draw_photo_card(c: canvas.Canvas, photo: dict, x: float, y: float, box_w: float, box_h: float) -> None:
    path = ROOT / photo["file"]
    c.setFillColor(BG)
    c.roundRect(x, y, box_w, box_h, 3, fill=1, stroke=0)
    tmp, pw, ph = photo_reader(path)
    inner_h = box_h - 9 * mm
    if tmp and pw and ph:
        ratio = min((box_w - 4 * mm) / pw, inner_h / ph)
        dw, dh = pw * ratio, ph * ratio
        c.drawImage(
            str(tmp),
            x + (box_w - dw) / 2,
            y + 8 * mm + (inner_h - dh) / 2,
            width=dw,
            height=dh,
            mask="auto",
        )
        tmp.unlink(missing_ok=True)
    c.setFillColor(MUTED)
    c.setFont("Sans", 7)
    cap = photo.get("caption") or ""
    for i, line in enumerate(wrap(c, cap, "Sans", 7, box_w - 6 * mm)[:2]):
        c.drawCentredString(x + box_w / 2, y + 3.2 * mm - i * 3.2 * mm, line)


def draw_chips(c: canvas.Canvas, chips: list[str], x: float, y: float, max_w: float) -> float:
    cx, cy = x, y
    row_h = 6.2 * mm
    for chip in chips:
        label = f"  {chip}  "
        tw = c.stringWidth(label, "Sans", 7.4) + 3 * mm
        if cx + tw > x + max_w:
            cx = x
            cy -= row_h
        c.setFillColor(CHIP_BG)
        c.roundRect(cx, cy - 1.6 * mm, tw, 5.4 * mm, 2.2, fill=1, stroke=0)
        c.setFillColor(NAVY)
        c.setFont("Sans", 7.4)
        c.drawString(cx + 1.6 * mm, cy, chip)
        cx += tw + 2.2 * mm
    return cy - 4 * mm


def draw_cover(c: canvas.Canvas, data: dict, total: int) -> None:
    doc = data["document"]
    brands = data["brands"]
    w, h = A4
    c.setFillColor(NAVY_DEEP)
    c.rect(0, 0, w, h, fill=1, stroke=0)
    c.setFillColor(RED)
    c.rect(0, h - 6 * mm, w, 6 * mm, fill=1, stroke=0)

    logo = ROOT / "site/img/brand/logo-mark-white.png"
    if not logo.is_file():
        logo = ROOT / "site/img/brand/logo-white.png"
    draw_logo(c, logo, 16 * mm, h - 38 * mm, 18 * mm, 18 * mm)

    c.setFillColor(white)
    c.setFont("Sans", 9)
    c.drawString(38 * mm, h - 24 * mm, "LPAEZ")
    c.setFont("Sans-Italic", 9)
    c.drawString(38 * mm, h - 28.5 * mm, "Soluciones Industriales")

    c.setFont("Sans-Bold", 22)
    y = h - 58 * mm
    for line in wrap(c, doc["title"], "Sans-Bold", 22, w - 32 * mm):
        c.drawString(16 * mm, y, line)
        y -= 9 * mm
    c.setFillColor(RED)
    c.rect(16 * mm, y + 2 * mm, 28 * mm, 1.4 * mm, fill=1, stroke=0)
    y -= 8 * mm
    c.setFillColor(HexColor("#d7dce8"))
    c.setFont("Sans", 11)
    for line in wrap(c, doc["subtitle"], "Sans", 11, w - 32 * mm):
        c.drawString(16 * mm, y, line)
        y -= 5.4 * mm

    y -= 4 * mm
    c.setFillColor(HexColor("#c5cddd"))
    c.setFont("Sans", 9)
    for line in wrap(c, doc["cover_lead"], "Sans", 9, w - 32 * mm)[:6]:
        c.drawString(16 * mm, y, line)
        y -= 4.4 * mm

    y -= 6 * mm
    c.setFillColor(white)
    c.setFont("Sans-Bold", 8)
    c.drawString(16 * mm, y, "ORDEN DE LECTURA")
    y -= 6 * mm
    c.setFont("Sans", 8.4)
    order = "  →  ".join(b["display"] for b in brands[:6]) + "  →  …"
    for line in wrap(c, order, "Sans", 8.4, w - 32 * mm):
        c.drawString(16 * mm, y, line)
        y -= 4.2 * mm

    y -= 8 * mm
    groups = [
        ("Soplado y secado", "Humedad de envase, fruta, estanques y aire de proceso.", "Sonic · Elektror · Apply"),
        ("Transporte e higiene", "Bandas, clasificación, cajas, granel y líneas de envase.", "Movex · Intralox · Interroll · Cablevey · LYC"),
        ("Paletizado y fin de línea", "Cajas, sacos, formado de cajas y salas limpias.", "Columbia/Okura · COMBI · ISODUR · HAIDA"),
    ]
    col_w = (w - 40 * mm) / 3
    for i, (title, body, names) in enumerate(groups):
        gx = 16 * mm + i * (col_w + 4 * mm)
        c.setFillColor(HexColor("#1c2744"))
        c.roundRect(gx, y - 40 * mm, col_w, 42 * mm, 3, fill=1, stroke=0)
        c.setFillColor(RED)
        c.rect(gx, y - 1.2 * mm, 14 * mm, 1.2 * mm, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Sans-Bold", 8.4)
        c.drawString(gx + 3 * mm, y - 8 * mm, title)
        c.setFillColor(HexColor("#c5cddd"))
        c.setFont("Sans", 7.3)
        ty = y - 14 * mm
        for line in wrap(c, body, "Sans", 7.3, col_w - 6 * mm):
            c.drawString(gx + 3 * mm, ty, line)
            ty -= 3.5 * mm
        c.setFillColor(HexColor("#9aa3b5"))
        c.setFont("Sans", 6.5)
        ty -= 1.2 * mm
        for line in wrap(c, names, "Sans", 6.5, col_w - 6 * mm):
            c.drawString(gx + 3 * mm, ty, line)
            ty -= 3.1 * mm

    c.setFillColor(white)
    c.roundRect(14 * mm, 42 * mm, w - 28 * mm, 32 * mm, 4, fill=1, stroke=0)
    logos = []
    for b in brands:
        p = ROOT / b["logo"]
        if p.is_file():
            logos.append(p)
    if logos:
        box_w = (w - 40 * mm) / min(8, len(logos))
        for i, p in enumerate(logos[:8]):
            draw_logo(c, p, 20 * mm + i * box_w, 48 * mm, box_w - 3 * mm, 20 * mm)

    c.setFillColor(white)
    c.setFont("Sans-Bold", 9)
    c.drawString(16 * mm, 34 * mm, doc["company"])
    c.setFont("Sans", 8)
    c.drawString(16 * mm, 29 * mm, f"{doc['legal']}  ·  {doc['founded']}  ·  {doc['seat']}")
    c.drawString(16 * mm, 24 * mm, f"{doc['email']}  ·  WhatsApp {doc['whatsapp']}  ·  {doc['web']}")
    c.setFillColor(RED)
    c.rect(0, 0, w, 16 * mm, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Sans", 8)
    c.drawString(16 * mm, 7 * mm, "PDF liviano para correo y WhatsApp  ·  Cotización según aplicación")
    c.drawRightString(w - 16 * mm, 7 * mm, f"1 / {total}")


def draw_hero(c: canvas.Canvas, brand: dict, doc: dict, page: int, total: int, index_label: str) -> None:
    w, h = A4
    c.setFillColor(white)
    c.rect(0, 0, w, h, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.rect(0, h - 22 * mm, w, 22 * mm, fill=1, stroke=0)
    c.setFillColor(RED)
    c.rect(0, h - 23.4 * mm, w, 1.4 * mm, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Sans-Bold", 11)
    c.drawString(14 * mm, h - 11 * mm, "LPAEZ Soluciones Industriales")
    c.setFont("Sans", 8)
    c.drawRightString(w - 14 * mm, h - 9 * mm, index_label)
    c.drawRightString(w - 14 * mm, h - 13.4 * mm, brand["kicker"].upper())

    y = h - 36 * mm
    draw_logo(c, ROOT / brand["logo"], 14 * mm, y - 4 * mm, 28 * mm, 14 * mm)
    c.setFillColor(INK)
    c.setFont("Sans-Bold", 18)
    c.drawString(46 * mm, y + 4 * mm, brand["display"])
    c.setFillColor(MUTED)
    c.setFont("Sans", 8.5)
    c.drawString(46 * mm, y - 1.5 * mm, brand.get("origin") or "")

    y -= 16 * mm
    c.setFillColor(INK)
    c.setFont("Sans", 9.5)
    for line in wrap(c, brand["pitch"], "Sans", 9.5, w - 28 * mm):
        c.drawString(14 * mm, y, line)
        y -= 4.6 * mm

    y -= 3 * mm
    c.setFillColor(RED)
    c.setFont("Sans-Bold", 8)
    c.drawString(14 * mm, y, "APLICACIONES INDUSTRIALES")
    y -= 8 * mm
    y = draw_chips(c, brand["applications"], 14 * mm, y, w - 28 * mm)

    photos = [p for p in brand.get("photos") or [] if (ROOT / p["file"]).is_file()]
    if photos:
        y -= 4 * mm
        gap = 4 * mm
        box_w = (w - 28 * mm - gap) / min(2, len(photos))
        box_h = 108 * mm
        for i, ph in enumerate(photos[:2]):
            draw_photo_card(c, ph, 14 * mm + i * (box_w + gap), y - box_h, box_w, box_h)
        y -= box_h + 8 * mm

    c.setFillColor(MUTED)
    c.setFont("Sans-Italic", 8)
    for line in wrap(c, brand.get("line") or "", "Sans-Italic", 8, w - 28 * mm):
        c.drawString(14 * mm, y, line)
        y -= 4 * mm

    draw_footer(c, doc, page, total)


def draw_compact_brand(c: canvas.Canvas, brand: dict, x: float, y_top: float, box_w: float, box_h: float) -> None:
    c.setFillColor(BG)
    c.roundRect(x, y_top - box_h, box_w, box_h, 4, fill=1, stroke=0)
    c.setFillColor(RED)
    c.rect(x, y_top - 1.2 * mm, 22 * mm, 1.2 * mm, fill=1, stroke=0)

    pad = 4.5 * mm
    inner_x = x + pad
    inner_w = box_w - 2 * pad
    y = y_top - 8 * mm
    draw_logo(c, ROOT / brand["logo"], inner_x, y - 3 * mm, 22 * mm, 10 * mm)
    c.setFillColor(NAVY)
    c.setFont("Sans-Bold", 11)
    c.drawString(inner_x + 25 * mm, y + 2 * mm, brand["display"])
    c.setFillColor(RED)
    c.setFont("Sans-Bold", 7)
    c.drawString(inner_x + 25 * mm, y - 2.4 * mm, brand["kicker"].upper())
    c.setFillColor(MUTED)
    c.setFont("Sans", 7)
    c.drawString(inner_x + 25 * mm, y - 6.2 * mm, (brand.get("origin") or "")[:62])

    y -= 14 * mm
    c.setFillColor(INK)
    c.setFont("Sans", 8)
    for line in wrap(c, brand["pitch"], "Sans", 8, inner_w)[:4]:
        c.drawString(inner_x, y, line)
        y -= 3.8 * mm

    y -= 1.5 * mm
    y = draw_chips(c, brand["applications"][:5], inner_x, y, inner_w)

    photos = [p for p in brand.get("photos") or [] if (ROOT / p["file"]).is_file()]
    if photos:
        y -= 2 * mm
        gap = 3 * mm
        ph_w = (inner_w - gap) / min(2, len(photos)) if len(photos) > 1 else inner_w
        ph_h = 42 * mm
        for i, ph in enumerate(photos[:2]):
            draw_photo_card(c, ph, inner_x + i * (ph_w + gap), y - ph_h, ph_w, ph_h)
        y -= ph_h + 6 * mm
    else:
        y -= 3 * mm
        c.setFillColor(MUTED)
        c.setFont("Sans-Italic", 7.5)
        note = "Se cotiza por proyecto."
        for line in wrap(c, note, "Sans-Italic", 7.5, inner_w):
            c.drawString(inner_x, y, line)
            y -= 3.6 * mm

    c.setFillColor(MUTED)
    c.setFont("Sans-Italic", 7.2)
    for line in wrap(c, brand.get("line") or "", "Sans-Italic", 7.2, inner_w)[:3]:
        c.drawString(inner_x, y, line)
        y -= 3.4 * mm


def draw_pair(c: canvas.Canvas, a: dict, b: dict | None, doc: dict, page: int, total: int) -> None:
    w, h = A4
    c.setFillColor(white)
    c.rect(0, 0, w, h, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.rect(0, h - 18 * mm, w, 18 * mm, fill=1, stroke=0)
    c.setFillColor(RED)
    c.rect(0, h - 19.2 * mm, w, 1.2 * mm, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Sans-Bold", 10)
    c.drawString(14 * mm, h - 9 * mm, "LPAEZ Soluciones Industriales")
    c.setFont("Sans", 8)
    c.drawRightString(w - 14 * mm, h - 9 * mm, "Representaciones")

    box_w = w - 24 * mm
    box_h = (h - 40 * mm - 14 * mm) / 2 - 3 * mm
    draw_compact_brand(c, a, 12 * mm, h - 24 * mm, box_w, box_h)
    if b:
        draw_compact_brand(c, b, 12 * mm, h - 24 * mm - box_h - 6 * mm, box_w, box_h)
    else:
        # CTA panel
        y = 36 * mm
        c.setFillColor(NAVY)
        c.roundRect(12 * mm, 20 * mm, box_w, 48 * mm, 4, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Sans-Bold", 12)
        c.drawString(18 * mm, 56 * mm, "¿Le encaja alguna aplicación?")
        c.setFont("Sans", 9)
        c.drawString(18 * mm, 49 * mm, "WhatsApp o correo. Indicamos marca, envase y cadencia de línea.")
        c.setFont("Sans-Bold", 10)
        c.drawString(18 * mm, 40 * mm, doc["whatsapp"] + "  ·  " + doc["email"])
        c.setFont("Sans", 8.5)
        c.drawString(18 * mm, 33 * mm, doc["web"] + "  ·  " + doc["catalog"])
        c.setFillColor(RED)
        c.setFont("Sans-Bold", 8)
        c.drawString(18 * mm, 26 * mm, "COTIZACIÓN SIN COMPROMISO")
    draw_footer(c, doc, page, total)


def draw_trio(c: canvas.Canvas, brands: list[dict], doc: dict, page: int, total: int) -> None:
    w, h = A4
    c.setFillColor(white)
    c.rect(0, 0, w, h, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.rect(0, h - 18 * mm, w, 18 * mm, fill=1, stroke=0)
    c.setFillColor(RED)
    c.rect(0, h - 19.2 * mm, w, 1.2 * mm, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Sans-Bold", 10)
    c.drawString(14 * mm, h - 9 * mm, "LPAEZ Soluciones Industriales")
    c.setFont("Sans", 8)
    c.drawRightString(w - 14 * mm, h - 9 * mm, "Proyectos de fin de línea")

    y = h - 28 * mm
    box_w = w - 24 * mm
    box_h = 60 * mm
    for brand in brands[:3]:
        c.setFillColor(BG)
        c.roundRect(12 * mm, y - box_h, box_w, box_h, 3, fill=1, stroke=0)
        c.setFillColor(RED)
        c.rect(12 * mm, y - 1.1 * mm, 18 * mm, 1.1 * mm, fill=1, stroke=0)
        draw_logo(c, ROOT / brand["logo"], 16 * mm, y - 16 * mm, 22 * mm, 10 * mm)
        c.setFillColor(NAVY)
        c.setFont("Sans-Bold", 11)
        c.drawString(42 * mm, y - 8 * mm, brand["display"])
        c.setFillColor(RED)
        c.setFont("Sans-Bold", 7)
        c.drawString(42 * mm, y - 12.4 * mm, brand["kicker"].upper())
        c.setFillColor(INK)
        c.setFont("Sans", 8)
        ty = y - 20 * mm
        for line in wrap(c, brand["pitch"], "Sans", 8, box_w - 12 * mm)[:3]:
            c.drawString(16 * mm, ty, line)
            ty -= 3.7 * mm
        ty = draw_chips(c, brand["applications"][:4], 16 * mm, ty - 1.6 * mm, box_w - 12 * mm)
        ty -= 3.2 * mm
        c.setFillColor(MUTED)
        c.setFont("Sans-Italic", 7.5)
        for line in wrap(c, brand.get("line") or "", "Sans-Italic", 7.5, box_w - 12 * mm)[:2]:
            c.drawString(16 * mm, ty, line)
            ty -= 3.5 * mm
        y -= box_h + 3.2 * mm

    c.setFillColor(NAVY)
    c.roundRect(12 * mm, 18 * mm, box_w, 28 * mm, 3, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Sans-Bold", 11)
    c.drawString(18 * mm, 36 * mm, "¿Le encaja alguna aplicación?")
    c.setFont("Sans", 8.5)
    c.drawString(18 * mm, 30 * mm, "WhatsApp o correo. Indique marca, envase y aplicación de línea.")
    c.setFont("Sans-Bold", 9)
    c.drawString(18 * mm, 23 * mm, f"{doc['whatsapp']}   ·   {doc['email']}   ·   {doc['web']}")
    draw_footer(c, doc, page, total)


def draw_close(c: canvas.Canvas, data: dict, page: int, total: int) -> None:
    doc = data["document"]
    w, h = A4
    c.setFillColor(NAVY_DEEP)
    c.rect(0, 0, w, h, fill=1, stroke=0)
    c.setFillColor(RED)
    c.rect(0, h - 6 * mm, w, 6 * mm, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Sans-Bold", 18)
    c.drawString(18 * mm, h - 40 * mm, "Siguiente paso")
    c.setFillColor(RED)
    c.rect(18 * mm, h - 46 * mm, 28 * mm, 1.4 * mm, fill=1, stroke=0)
    c.setFillColor(HexColor("#d7dce8"))
    c.setFont("Sans", 10)
    y = h - 58 * mm
    text = (
        "Envíe este PDF por correo o WhatsApp. Para cotizar, indique marca, "
        "producto o envase, y la aplicación de línea. LPAEZ responde en horario "
        "laboral Chile, lunes a viernes."
    )
    for line in wrap(c, text, "Sans", 10, w - 36 * mm):
        c.drawString(18 * mm, y, line)
        y -= 5 * mm
    y -= 8 * mm
    c.setFillColor(white)
    c.setFont("Sans-Bold", 12)
    c.drawString(18 * mm, y, "WhatsApp  " + doc["whatsapp"])
    y -= 8 * mm
    c.drawString(18 * mm, y, doc["email"])
    y -= 8 * mm
    c.setFont("Sans", 11)
    c.drawString(18 * mm, y, doc["web"])
    y -= 8 * mm
    c.drawString(18 * mm, y, f"{doc['phone']}  ·  {doc['phone2']}")
    y -= 16 * mm
    c.setFillColor(HexColor("#9aa3b5"))
    c.setFont("Sans", 8)
    c.drawString(18 * mm, y, doc["legal"] + "  ·  " + doc["seat"] + "  ·  fundada " + doc["founded"])
    y -= 5 * mm
    c.drawString(18 * mm, y, doc["footer"])
    c.setFillColor(RED)
    c.rect(0, 0, w, 16 * mm, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Sans", 8)
    c.drawString(18 * mm, 7 * mm, "LPAEZ Soluciones Industriales")
    c.drawRightString(w - 18 * mm, 7 * mm, f"{page} / {total}")


def page_plan(brands: list[dict]) -> list[tuple]:
    heroes = [b for b in brands if b.get("hero")]
    pictured = [b for b in brands if not b.get("hero") and b.get("photos")]
    text_only = [b for b in brands if not b.get("hero") and not b.get("photos")]
    plan: list[tuple] = [("cover", None)]
    for i, b in enumerate(heroes, start=1):
        plan.append(("hero", b, f"0{i}  ·  {b['display']}"))
    i = 0
    while i < len(pictured):
        a = pictured[i]
        b = pictured[i + 1] if i + 1 < len(pictured) else None
        plan.append(("pair", a, b))
        i += 2
    if text_only:
        plan.append(("trio", text_only))
    else:
        plan.append(("close", None))
    return plan


def main() -> None:
    register_fonts()
    data = json.loads(DATA.read_text(encoding="utf-8"))
    plan = page_plan(data["brands"])
    total = len(plan)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUT), pagesize=A4)
    c.setTitle(data["document"]["title"] + " · " + data["document"]["company"])
    c.setAuthor(data["document"]["company"])
    c.setSubject("Resumen de marcas representadas para prospectos industriales")
    for i, item in enumerate(plan, start=1):
        kind = item[0]
        if kind == "cover":
            draw_cover(c, data, total)
        elif kind == "hero":
            draw_hero(c, item[1], data["document"], i, total, item[2])
        elif kind == "pair":
            draw_pair(c, item[1], item[2], data["document"], i, total)
        elif kind == "trio":
            draw_trio(c, item[1], data["document"], i, total)
        elif kind == "close":
            draw_close(c, data, i, total)
        c.showPage()
    c.save()
    kb = OUT.stat().st_size / 1024
    print(f"ok {OUT.relative_to(ROOT)} {OUT.stat().st_size} bytes ({kb:.0f} KB) pages={total}")


if __name__ == "__main__":
    main()
