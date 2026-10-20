#!/usr/bin/env python3
"""Build 1-page lightweight leaflets for Sonic Air Systems products.

Uses only official name, description, specs and the real product photo.
Does not invent technical data. Output: site/img/fichas/<slug>.pdf
"""
from __future__ import annotations

import io
import json
import re
import urllib.request
from pathlib import Path

from PIL import Image
from reportlab.lib.colors import Color, HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "site" / "img" / "fichas"
API = "https://www.lpaezsis.cl"
FONT_REG = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"

NAVY = HexColor("#1a2a4a")
RED = HexColor("#c8102e")
LINE = HexColor("#d8dbe2")
INK = HexColor("#1c1c1c")
MUTED = HexColor("#5a5f6a")
BG = HexColor("#f4f5f7")

LOCAL_PHOTOS = {
    "blower-sonic-s70": "site/img/products/blower-sonic-s70.jpg",
    "blower-sonic-s85": "site/img/products/blower-sonic-s85.jpg",
    "blower-sonic-s100": "site/img/products/blower-sonic-s100.jpg",
    "blower-sonic-s150": "site/img/products/blower-sonic-s150.jpg",
    "blower-sonic-s200": "site/img/products/blower-sonic-s200.jpg",
    "blower-sonic-s300": "site/img/products/blower-sonic-s300.jpg",
    "blower-sonic-s350": "site/img/products/blower-sonic-s350.jpg",
    "flexible-neopreno-3-12pies-sonic": "site/img/products/A07-10434.jpg",
    "correa-sonic-70-85": "site/img/products/A07-13474.jpg",
    "correa-sonic-100-150": "site/img/products/A07-13474.jpg",
    "filtro-poliester-s-75-85-100": "site/img/products/A07-10317.jpg",
    "filtro-poliester-s-100-150": "site/img/products/A07-10317.jpg",
    "filtro-completo-poliester-s-70-85-100-con-indicador": "site/img/products/A07-10976.jpg",
    "cartucho-rodamientos-s-100-150": "site/img/products/A07-14452.jpg",
    "cartucho-rodamientos-s-70-85": "site/img/products/A07-14452.jpg",
    "impeller-sonic-70-100": "site/img/products/A07-10015.jpg",
    "impeller-sonic-85-150": "site/img/products/A07-10015.jpg",
    "tensor-correa-sonic-todos-los-modelos": "site/img/products/A07-13455.png",
}


def register_fonts() -> None:
    pdfmetrics.registerFont(TTFont("Sans", FONT_REG))
    pdfmetrics.registerFont(TTFont("Sans-Bold", FONT_BOLD))


def parse_ficha(raw: str) -> tuple[str, list[tuple[str, str]], str]:
    text = (raw or "").replace("\r\n", "\n").strip()
    datasheet = ""
    idx = text.rfind("Ficha técnica:")
    if idx >= 0:
        datasheet = text[idx + len("Ficha técnica:") :].strip().split("\n", 1)[0].strip()
        text = text[:idx].strip()
    specs: list[tuple[str, str]] = []
    sidx = text.find("Especificaciones técnicas:")
    if sidx >= 0:
        detail = text[:sidx].strip()
        for line in text[sidx + len("Especificaciones técnicas:") :].split("\n"):
            cleaned = re.sub(r"^[•\-\*]\s*", "", line).strip()
            if not cleaned or ":" not in cleaned:
                continue
            key, val = cleaned.split(":", 1)
            key, val = key.strip(), val.strip()
            if key.lower() == "ficha":
                continue
            if key and val:
                specs.append((key, val))
    else:
        detail = text
    return detail, specs, datasheet


def compress_photo(path: Path) -> bytes:
    im = Image.open(path).convert("RGB")
    im.thumbnail((900, 900), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=72, optimize=True, progressive=True)
    return buf.getvalue()


def download(url: str, dest: Path) -> Path | None:
    if not url:
        return None
    if url.startswith("/"):
        url = API + url
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "LPAEZSIS-leaflet/1"})
        dest.write_bytes(urllib.request.urlopen(req, timeout=30).read())
        return dest if dest.stat().st_size > 800 else None
    except Exception as exc:
        print("skip photo", url, exc)
        return None


def wrap(c: canvas.Canvas, text: str, font: str, size: float, max_w: float) -> list[str]:
    words = (text or "").split()
    lines: list[str] = []
    cur = ""
    for w in words:
        trial = (cur + " " + w).strip()
        if c.stringWidth(trial, font, size) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines or [""]


def draw_leaflet(path: Path, product: dict, photo: bytes | None) -> None:
    name = product["name"]
    slug = product["slug"]
    detail, specs, _official = parse_ficha(product.get("description") or "")
    mode = "COMPRAR" if product.get("sale_mode") == "buy" else "COTIZAR"
    sku = ""
    m = re.search(r"Cod(?:igo)?\s*([A-Z0-9.\-]+)", detail + " " + (product.get("description") or ""), re.I)
    if m:
        sku = m.group(1)

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
    c.drawRightString(w - m_r, h - 9.2 * mm, "Sonic Air Systems")
    c.drawRightString(w - m_r, h - 13.6 * mm, "Ficha técnica · 1 página")

    y = h - 34 * mm
    c.setFillColor(INK)
    c.setFont("Sans-Bold", 16)
    for line in wrap(c, name, "Sans-Bold", 16, inner):
        c.drawString(m_l, y, line)
        y -= 6.2 * mm
    if sku:
        c.setFillColor(MUTED)
        c.setFont("Sans", 9)
        c.drawString(m_l, y, f"Código / P/N  {sku}")
        y -= 5 * mm
    c.setFillColor(RED)
    c.setFont("Sans-Bold", 8)
    c.drawString(m_l, y, mode)
    y -= 6 * mm

    if photo:
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

    if detail:
        c.setFillColor(INK)
        c.setFont("Sans", 9.2)
        for line in wrap(c, detail, "Sans", 9.2, inner)[:6]:
            c.drawString(m_l, y, line)
            y -= 4.4 * mm
        y -= 2 * mm

    if specs:
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
            c.drawString(m_l + 2 * mm, y, key)
            c.setFillColor(INK)
            c.setFont("Sans", 8.2)
            val_lines = wrap(c, val, "Sans", 8.2, inner - 48 * mm)
            c.drawString(m_l + 46 * mm, y, val_lines[0])
            y -= row_h
            for extra in val_lines[1:]:
                c.drawString(m_l + 46 * mm, y, extra)
                y -= 4 * mm

    c.setFillColor(NAVY)
    c.rect(0, 0, w, 18 * mm, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Sans", 7.4)
    source = "Fuente: ficha oficial Sonic Air Systems."
    c.drawString(m_l, 10.2 * mm, source)
    c.drawString(m_l, 6.2 * mm, "LPAEZSIS · Chile · www.lpaezsis.cl · Cotización o compra según producto.")
    c.setFont("Sans", 7)
    c.drawRightString(w - m_r, 8 * mm, slug)
    c.save()


def load_sonic_products() -> list[dict]:
    with urllib.request.urlopen(API + "/api/brands/sonic-air-systems", timeout=25) as res:
        data = json.loads(res.read().decode("utf-8"))
    return list(data.get("products") or [])


def main() -> None:
    register_fonts()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    tmp = ROOT / ".tmp" / "leaflet-photos"
    tmp.mkdir(parents=True, exist_ok=True)
    products = load_sonic_products()
    built = []
    for prod in products:
        slug = prod.get("slug") or ""
        img = (prod.get("image_url") or "").strip()
        if not slug or not img:
            print("skip no photo", slug)
            continue
        local = ROOT / LOCAL_PHOTOS[slug] if slug in LOCAL_PHOTOS else None
        if local and local.is_file():
            photo_path = local
        else:
            ext = ".jpg"
            if ".png" in img.lower():
                ext = ".png"
            elif ".webp" in img.lower():
                ext = ".webp"
            photo_path = download(img, tmp / f"{slug}{ext}")
        if not photo_path:
            print("skip no usable photo", slug)
            continue
        photo = compress_photo(photo_path)
        out = OUT_DIR / f"{slug}.pdf"
        draw_leaflet(out, prod, photo)
        print(f"ok {slug} {out.stat().st_size} bytes")
        built.append(slug)
    print(json.dumps({"built": built, "count": len(built)}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
