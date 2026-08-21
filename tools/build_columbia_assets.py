#!/usr/bin/env python3
"""Generate Columbia Machine logo, product illustrations and technical PDFs."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.colors import Color, HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
BRAND_DIR = ROOT / "site" / "img" / "brand"
PRODUCT_DIR = ROOT / "site" / "img" / "products"
FICHA_DIR = ROOT / "site" / "img" / "fichas"

NAVY = (11, 31, 58, 255)
NAVY_RGB = (11, 31, 58)
GOLD = (201, 162, 39, 255)
GOLD_RGB = (201, 162, 39)
STEEL = (70, 92, 118, 255)
LIGHT = (232, 238, 246, 255)

PRODUCTS = [
    {
        "code": "FL3000",
        "pdf": "ficha_tecnica_fl3000_columbia.pdf",
        "slug": "paletizador-nivel-inferior-columbia-fl3000",
        "image": "fl3000_columbia.jpg",
        "image_aliases": ["columbia-fl3000.png"],
        "name": "Paletizador de Nivel Inferior Columbia FL3000",
        "summary": (
            "Paletizador automático a nivel de piso de velocidad media-alta (30-40 CPM), "
            "diseñado para el manejo seguro y eficiente de cajas, charolas y paquetes."
        ),
        "detail": (
            "El Columbia FL3000 resuelve los cuellos de botella en el final de línea "
            "permitiendo un paletizado continuo a nivel de piso. Su diseño ergonómico "
            "facilita la inspección y mantenimiento sin necesidad de plataformas elevadas, "
            "optimizando el flujo de embalaje y garantizando patrones de estibado estables."
        ),
        "specs": [
            ("Velocidad", "30 a 40 CPM (Cajas/Paquetes por minuto)"),
            ("Nivel de Entrada", "Nivel de Piso (Floor Level)"),
            ("Tipos de Empaque", "Cajas de cartón, charolas (trays) y paquetes envueltos"),
            ("Control", "HMI Táctil intuitivo"),
        ],
        "kind": "floor",
    },
    {
        "code": "HL7200",
        "pdf": "ficha_tecnica_hl7200_columbia.pdf",
        "slug": "paletizador-alto-nivel-columbia-hl7200",
        "image": "hl7200_columbia.jpg",
        "image_aliases": ["columbia-hl7200.png"],
        "name": "Paletizador de Alto Nivel Columbia HL7200",
        "summary": (
            "Paletizador de alta velocidad (hasta 120 CPM) de entrada superior, ideal para "
            "líneas masivas de embotellado, alimentos y consumo masivo."
        ),
        "detail": (
            "Diseñado para plantas de producción masiva con altos volúmenes de salida, el HL7200 "
            "recibe el producto desde líneas elevadas para formar pallets a velocidades de hasta "
            "120 cajas por minuto. Maximiza la eficiencia operativa, reduce los tiempos de parada "
            "y garantiza un manejo ultra suave de productos."
        ),
        "specs": [
            ("Velocidad", "Hasta 120 CPM"),
            ("Nivel de Entrada", "Alto Nivel (High Level)"),
            ("Patrones", "Formación multipatrón electrónica programable"),
            ("Aplicaciones", "Embotellado, enlatado, alimentos y consumo masivo"),
        ],
        "kind": "high",
    },
    {
        "code": "Ai1800",
        "pdf": "ficha_tecnica_ai1800_columbia.pdf",
        "slug": "celda-paletizado-robotico-columbia-ai1800",
        "image": "ai1800_columbia.jpg",
        "image_aliases": ["columbia-ai1800.png"],
        "name": "Celda de Paletizado Robótico Columbia-Okura Ai1800",
        "summary": (
            "Robot industrial de paletizado de alta precisión para el manejo versátil de sacos, "
            "cajas, baldes y múltiples líneas simultáneas."
        ),
        "detail": (
            "Desarrollado bajo la alianza Columbia-Okura, el robot Ai1800 resuelve los desafíos "
            "de empaques complejos y variables en planta. Su brazo articulado de diseño propio "
            "permite manipular simultáneamente sacos, baldes, cajas o atados con mínima ocupación "
            "de espacio y máxima adaptabilidad."
        ),
        "specs": [
            ("Rendimiento", "> 20 cajas/min o hasta 20 sacos/min"),
            ("Tipos de Carga", "Sacos, Cajas, Charolas, Baldes (Pails)"),
            ("Arquitectura", "Robot articulado de 4 ejes dedicado a paletizado"),
            ("Configuración", "Celda multilínea con cabezal/gripper adaptable"),
        ],
        "kind": "robot",
    },
    {
        "code": "FL1000-SW",
        "pdf": "ficha_tecnica_fl1000sw_columbia.pdf",
        "slug": "paletizador-compacto-envolvedora-columbia-fl1000sw",
        "image": "fl1000sw_columbia.jpg",
        "image_aliases": ["columbia-fl1000sw.png"],
        "name": "Paletizador Compacto con Envolvedora Integrada Columbia FL1000-SW",
        "summary": (
            "Sistema híbrido que integra paletizado automático a nivel de piso y envoltura con "
            "película estirable (Stretch Wrap) en una sola huella reducida."
        ),
        "detail": (
            "El FL1000-SW combina en una sola máquina el apilado y el emplayado del pallet. "
            "Elimina transportadores de conexión adicionales, ahorra hasta un 40% de espacio en "
            "planta y entrega tarimas completamente aseguradas y listas para su almacenamiento."
        ),
        "specs": [
            ("Velocidad", "Hasta 20 CPM"),
            ("Integración", "Paletizador a nivel de piso + Envolvedora Stretch Wrap"),
            ("Ahorro de espacio", "Reducción de footprint de hasta un 40%"),
        ],
        "kind": "compact",
    },
]


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def rounded_rect(draw: ImageDraw.ImageDraw, box, fill, radius: int) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill)


def make_logo() -> None:
    BRAND_DIR.mkdir(parents=True, exist_ok=True)
    w, h = 300, 120
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Geometric mark: stacked parallelograms (industrial pallet layers)
    mark = [(10, 28), (52, 28), (64, 52), (22, 52)]
    d.polygon(mark, fill=NAVY)
    mark2 = [(18, 56), (60, 56), (72, 80), (30, 80)]
    d.polygon(mark2, fill=GOLD)
    mark3 = [(26, 84), (68, 84), (80, 92), (38, 92)]
    d.polygon(mark3, fill=STEEL)

    d.text((92, 28), "COLUMBIA", font=font(28, True), fill=NAVY)
    d.text((92, 62), "MACHINE", font=font(18, True), fill=GOLD_RGB + (255,))
    d.line((92, 58, 286, 58), fill=GOLD, width=2)

    dest = BRAND_DIR / "columbia-machine.png"
    img.save(dest, "PNG")
    print("logo", dest, img.size)


def draw_pallet(d: ImageDraw.ImageDraw, x: int, y: int, scale: float = 1.0) -> None:
    w, h = int(110 * scale), int(28 * scale)
    d.rounded_rectangle((x, y, x + w, y + h), 4, fill=(92, 64, 38, 255))
    d.rectangle((x + 8, y + 6, x + w - 8, y + h - 8), fill=(140, 98, 52, 255))
    for i in range(3):
        bx = x + 10 + i * int(34 * scale)
        d.rectangle((bx, y + h - 6, bx + int(22 * scale), y + h + int(8 * scale)), fill=(70, 48, 28, 255))


def draw_cases(d: ImageDraw.ImageDraw, x: int, y: int, rows: int, cols: int, scale: float = 1.0) -> None:
    cw, ch = int(28 * scale), int(18 * scale)
    for r in range(rows):
        for c in range(cols):
            xx = x + c * (cw + 4)
            yy = y - r * (ch + 3)
            color = GOLD if (r + c) % 2 == 0 else (46, 78, 122, 255)
            d.rounded_rectangle((xx, yy, xx + cw, yy + ch), 3, fill=color)
            d.rectangle((xx + 4, yy + 4, xx + cw - 4, yy + 8), fill=(255, 255, 255))


def make_product_image(product: dict) -> None:
    PRODUCT_DIR.mkdir(parents=True, exist_ok=True)
    w, h = 960, 720
    bg = Image.new("RGB", (w, h), (245, 247, 250))
    d = ImageDraw.Draw(bg)
    # High-contrast frame so the asset is visible on light catalog cards.
    d.rectangle((0, 0, w, h), fill=(11, 31, 58))
    d.rounded_rectangle((28, 28, w - 28, h - 28), 28, fill=(248, 250, 252))
    d.rectangle((28, 28, w - 28, 108), fill=(11, 31, 58))
    d.text((52, 48), "COLUMBIA MACHINE", font=font(26, True), fill=(255, 255, 255))
    d.text((52, 80), "Paletizado · LPAEZsis", font=font(16), fill=(201, 162, 39))

    kind = product["kind"]
    if kind == "floor":
        d.rounded_rectangle((90, 200, 870, 560), 22, fill=(226, 232, 240))
        d.rounded_rectangle((130, 230, 520, 530), 16, fill=(11, 31, 58))
        d.rounded_rectangle((160, 260, 490, 430), 10, fill=(30, 64, 110))
        draw_cases(d, 190, 390, 4, 4, 1.2)
        draw_pallet(d, 560, 500, 1.45)
        draw_cases(d, 590, 460, 3, 3, 1.15)
        d.rectangle((130, 530, 820, 552), fill=(70, 92, 118))
    elif kind == "high":
        d.rectangle((90, 170, 160, 560), fill=(11, 31, 58))
        d.rectangle((160, 170, 860, 230), fill=(70, 92, 118))
        d.polygon([(200, 230), (300, 230), (250, 370), (160, 370)], fill=(201, 162, 39))
        d.rounded_rectangle((280, 280, 840, 560), 16, fill=(226, 232, 240))
        d.rounded_rectangle((320, 250, 800, 520), 12, fill=(11, 31, 58))
        draw_cases(d, 370, 440, 5, 6, 1.1)
        draw_pallet(d, 380, 520, 1.7)
    elif kind == "robot":
        d.ellipse((400, 420, 560, 560), fill=(70, 92, 118))
        d.rectangle((460, 230, 500, 460), fill=(11, 31, 58))
        d.polygon([(470, 230), (700, 180), (730, 230), (500, 290)], fill=(201, 162, 39))
        d.ellipse((680, 160, 790, 270), fill=(11, 31, 58))
        d.rounded_rectangle((120, 480, 380, 580), 10, fill=(226, 232, 240))
        draw_pallet(d, 620, 510, 1.35)
        draw_cases(d, 650, 470, 3, 3, 1.05)
        d.arc((260, 150, 820, 540), 200, 20, fill=(70, 92, 118), width=14)
    else:
        d.rounded_rectangle((90, 220, 470, 560), 18, fill=(11, 31, 58))
        draw_cases(d, 140, 430, 4, 4, 1.2)
        d.rounded_rectangle((500, 220, 860, 560), 18, fill=(24, 52, 92))
        d.ellipse((530, 260, 830, 430), fill=(70, 92, 118))
        d.arc((530, 260, 830, 430), 200, 40, fill=(201, 162, 39), width=16)
        draw_pallet(d, 560, 490, 1.3)

    d.rectangle((28, h - 108, w - 28, h - 28), fill=(11, 31, 58))
    d.text((52, h - 92), product["code"], font=font(32, True), fill=(201, 162, 39))
    d.text((52, h - 56), product["name"][:64], font=font(16), fill=(255, 255, 255))

    dest = PRODUCT_DIR / product["image"]
    rgb = bg.convert("RGB")
    rgb.save(dest, "JPEG", quality=90, optimize=True)
    print("image", dest)
    for alias in product.get("image_aliases") or []:
        alias_path = PRODUCT_DIR / alias
        if alias_path.suffix.lower() == ".png":
            bg.save(alias_path, "PNG")
        else:
            rgb.save(alias_path, "JPEG", quality=90, optimize=True)
        print("alias", alias_path)


def make_pdf(product: dict) -> None:
    FICHA_DIR.mkdir(parents=True, exist_ok=True)
    dest = FICHA_DIR / product["pdf"]
    c = canvas.Canvas(str(dest), pagesize=A4)
    width, height = A4
    navy = HexColor("#0B1F3A")
    gold = HexColor("#C9A227")
    muted = HexColor("#4A5C76")

    c.setFillColor(navy)
    c.rect(0, height - 38 * mm, width, 38 * mm, fill=1, stroke=0)
    c.setFillColor(gold)
    c.rect(0, height - 40 * mm, width, 2.2 * mm, fill=1, stroke=0)

    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(18 * mm, height - 16 * mm, "LPAEZsis  ·  Ficha técnica")
    c.setFont("Helvetica-Bold", 18)
    c.drawString(18 * mm, height - 28 * mm, "COLUMBIA MACHINE")
    c.setFont("Helvetica", 10)
    c.drawRightString(width - 18 * mm, height - 16 * mm, product["code"])
    c.drawRightString(width - 18 * mm, height - 28 * mm, "Columbia-Okura LLC")

    y = height - 54 * mm
    c.setFillColor(navy)
    c.setFont("Helvetica-Bold", 16)
    for line in _wrap(product["name"], 52):
        c.drawString(18 * mm, y, line)
        y -= 7 * mm

    c.setFillColor(gold)
    c.rect(18 * mm, y + 2 * mm, 28 * mm, 1.4 * mm, fill=1, stroke=0)
    y -= 8 * mm

    c.setFillColor(muted)
    c.setFont("Helvetica-Oblique", 10)
    for line in _wrap(product["summary"], 95):
        c.drawString(18 * mm, y, line)
        y -= 5.2 * mm

    y -= 4 * mm
    c.setFillColor(navy)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(18 * mm, y, "Descripción")
    y -= 7 * mm
    c.setFillColor(HexColor("#1B2A40"))
    c.setFont("Helvetica", 10)
    for line in _wrap(product["detail"], 95):
        c.drawString(18 * mm, y, line)
        y -= 5.2 * mm

    y -= 6 * mm
    c.setFillColor(navy)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(18 * mm, y, "Especificaciones técnicas")
    y -= 3 * mm
    c.setFillColor(gold)
    c.rect(18 * mm, y, 42 * mm, 1.1 * mm, fill=1, stroke=0)
    y -= 8 * mm

    row_h = 10 * mm
    table_x = 18 * mm
    table_w = width - 36 * mm
    for i, (label, value) in enumerate(product["specs"]):
        bg = HexColor("#F4F2EC") if i % 2 == 0 else white
        c.setFillColor(bg)
        c.rect(table_x, y - 3 * mm, table_w, row_h, fill=1, stroke=0)
        c.setFillColor(navy)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(table_x + 4 * mm, y, label)
        c.setFont("Helvetica", 9)
        c.setFillColor(muted)
        c.drawString(table_x + 62 * mm, y, value)
        y -= row_h

    y -= 8 * mm
    c.setFillColor(HexColor("#F4F2EC"))
    c.roundRect(18 * mm, 22 * mm, width - 36 * mm, 28 * mm, 4 * mm, fill=1, stroke=0)
    c.setFillColor(navy)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(24 * mm, 42 * mm, "Modalidad: COTIZAR")
    c.setFont("Helvetica", 9)
    c.setFillColor(muted)
    c.drawString(24 * mm, 34 * mm, "Solicite evaluación de paletizado a LPAEZsis-Soluciones Industriales SpA.")
    c.drawString(24 * mm, 28 * mm, "prueba1.lpaezsis.cl  ·  Distribuidor Columbia Machine / Columbia-Okura en Chile")

    c.setFillColor(navy)
    c.rect(0, 0, width, 12 * mm, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica", 8)
    c.drawString(18 * mm, 5 * mm, "Documento comercial de referencia. Especificaciones sujetas a configuración de línea.")
    c.drawRightString(width - 18 * mm, 5 * mm, product["pdf"])

    c.showPage()
    c.save()

    slug_copy = FICHA_DIR / f"{product['slug']}.pdf"
    slug_copy.write_bytes(dest.read_bytes())
    print("pdf", dest.name, "->", slug_copy.name)


def _wrap(text: str, width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    cur = ""
    for w in words:
        trial = (cur + " " + w).strip()
        if len(trial) <= width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines or [text]


def main() -> None:
    make_logo()
    for product in PRODUCTS:
        make_product_image(product)
        make_pdf(product)


if __name__ == "__main__":
    main()
