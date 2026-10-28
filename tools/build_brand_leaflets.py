#!/usr/bin/env python3
"""Build 1-page lightweight leaflets for every branded catalog product.

Uses only the official product name, published description/specs and the
real product photo. Does not invent technical data.
Output: site/img/fichas/<slug>.pdf
"""
from __future__ import annotations

import io
import json
import re
import urllib.request
from pathlib import Path

from PIL import Image
from reportlab.lib.colors import HexColor, white
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
    "paletizador-nivel-inferior-columbia-fl3000": "site/img/productos/fl3000.jpg",
    "paletizador-alto-nivel-columbia-hl7200": "site/img/productos/hl7200.jpg",
    "celda-paletizado-robotico-columbia-ai1800": "site/img/productos/ai1800.jpg",
    "paletizador-compacto-envolvedora-columbia-fl1000sw": "site/img/productos/fl1000sw.jpg",
    "bandas-intralox-serie-800": "site/img/products/bandas-intralox-serie-800.jpg",
    "bandas-intralox-serie-1400": "site/img/products/bandas-intralox-serie-1400.jpg",
    "bandas-intralox-serie-900": "site/img/products/bandas-intralox-serie-900.jpg",
    "bandas-intralox-arb": "site/img/products/bandas-intralox-arb.jpg",
    "bandas-intralox-thermodrive": "site/img/products/bandas-intralox-thermodrive.jpg",
    "pfx-movex": "site/img/products/pfx-movex.jpg",
    "blulub-movex": "site/img/products/blulub-movex.jpg",
    "zero-contact-movex": "site/img/products/zero-contact-movex.jpg",
    "zero-atp-pro-movex": "site/img/products/zero-atp-pro-movex.jpg",
    "secado-frutas-sonic": "site/img/products/secado-frutas-sonic.jpg",
    "smart-tunnel-sonic": "site/img/products/smart-tunnel-sonic.jpg",
    "secado-estanques-sonic": "site/img/products/secado-estanques-sonic.jpg",
    "minipal-columbia": "site/img/products/minipal-columbia.jpg",
    "pintura-columbia": "site/img/products/pintura-columbia.jpg",
    "empacado-fresco-columbia": "site/img/products/empacado-fresco-columbia.jpg",
    "quimica-columbia": "site/img/products/quimica-columbia.jpg",
    "ad-control-interroll": "site/img/products/ad-control-interroll.jpg",
    "mototambor-dm-0113-interroll": "site/img/products/mototambor-dm-0113-interroll.jpg",
    "paletizado-sacos-columbia": "site/img/products/paletizado-sacos-columbia.jpg",
}


def register_fonts() -> None:
    pdfmetrics.registerFont(TTFont("Sans", FONT_REG))
    pdfmetrics.registerFont(TTFont("Sans-Bold", FONT_BOLD))


def parse_ficha(raw: str) -> tuple[str, list[tuple[str, str]]]:
    text = (raw or "").replace("\r\n", "\n").strip()
    idx = text.rfind("Ficha técnica:")
    if idx >= 0:
        text = text[:idx].strip()
    vidx = text.rfind("\nVideo:")
    if vidx >= 0:
        text = text[:vidx].strip()
    elif text.startswith("Video:"):
        text = ""
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
            if key.lower() in {"ficha", "fuente"} or not key or not val:
                continue
            specs.append((key, val))
    else:
        detail = text
    return detail, specs


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


def draw_leaflet(path: Path, product: dict, photo: bytes | None) -> None:
    name = product["name"]
    slug = product["slug"]
    brand = (product.get("brand_name") or "LPAEZSIS").strip()
    detail, specs = parse_ficha(product.get("description") or "")
    mode = "COMPRAR" if product.get("sale_mode") == "buy" else "COTIZAR"
    sku = ""
    m = re.search(
        r"(?:C[oó]digo(?:\s*/\s*P/?N)?|Cod\.)\s+([A-Z0-9][A-Z0-9.\-]{2,})",
        detail + " " + (product.get("description") or ""),
        re.I,
    )
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
    c.drawRightString(w - m_r, h - 9.2 * mm, brand)
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


def load_products() -> list[dict]:
    with urllib.request.urlopen(API + "/api/products", timeout=30) as res:
        data = json.loads(res.read().decode("utf-8"))
    return [p for p in (data.get("products") or []) if p.get("brand_slug") and p.get("slug")]


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--slugs", default="", help="Comma-separated slugs; empty = all branded products")
    args = parser.parse_args()
    only = {s.strip() for s in args.slugs.split(",") if s.strip()}

    register_fonts()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    tmp = ROOT / ".tmp" / "leaflet-photos"
    tmp.mkdir(parents=True, exist_ok=True)
    built = []
    skipped = []
    for prod in load_products():
        slug = prod.get("slug") or ""
        if only and slug not in only:
            continue
        img = (prod.get("image_url") or "").strip()
        if not img:
            print("skip no photo", slug)
            skipped.append(slug)
            continue
        local = ROOT / LOCAL_PHOTOS[slug] if slug in LOCAL_PHOTOS else None
        if local and local.is_file():
            photo_path = local
        else:
            ext = ".jpg"
            low = img.lower()
            if ".png" in low:
                ext = ".png"
            elif ".webp" in low:
                ext = ".webp"
            photo_path = download(img, tmp / f"{slug}{ext}")
        if not photo_path:
            print("skip no usable photo", slug)
            skipped.append(slug)
            continue
        photo = compress_photo(photo_path)
        out = OUT_DIR / f"{slug}.pdf"
        draw_leaflet(out, prod, photo)
        print(f"ok {prod.get('brand_slug')} {slug} {out.stat().st_size}")
        built.append(slug)
    print(json.dumps({"built": built, "count": len(built), "skipped": skipped}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
