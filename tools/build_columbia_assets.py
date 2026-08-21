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
        "image": "columbia-fl3000.png",
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
        "image": "columbia-hl7200.png",
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
        "image": "columbia-ai1800.png",
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
        "image": "columbia-fl1000sw.png",
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
            d.rectangle((xx + 4, yy + 4, xx + cw - 4, yy + 8), fill=(255, 255, 255, 60))


def make_product_image(product: dict) -> None:
    PRODUCT_DIR.mkdir(parents=True, exist_ok=True)
    w, h = 960, 720
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    bg = Image.new("RGBA", (w, h), (244, 242, 236, 255))
    d = ImageDraw.Draw(bg)
    d.rectangle((0, 0, w, 16), fill=NAVY)
    d.rectangle((0, h - 88, w, h), fill=NAVY)
    d.text((36, 28), "COLUMBIA MACHINE", font=font(22, True), fill=NAVY)
    d.text((36, 58), "Paletizado · LPAEZsis", font=font(16), fill=STEEL)

    kind = product["kind"]
    if kind == "floor":
        d.rounded_rectangle((180, 280, 780, 520), 18, fill=(220, 226, 234, 255))
        d.rounded_rectangle((210, 250, 520, 500), 12, fill=NAVY)
        d.rounded_rectangle((230, 270, 500, 430), 8, fill=(24, 52, 92, 255))
        draw_cases(d, 260, 390, 4, 4, 1.15)
        draw_pallet(d, 540, 470, 1.3)
        draw_cases(d, 560, 430, 3, 3, 1.0)
        d.rectangle((210, 500, 750, 516), fill=STEEL)  # floor conveyor
    elif kind == "high":
        d.rectangle((140, 180, 200, 520), fill=NAVY)  # column
        d.rectangle((200, 180, 820, 220), fill=STEEL)  # high infeed
        d.polygon([(240, 220), (320, 220), (280, 340), (210, 340)], fill=GOLD)
        d.rounded_rectangle((300, 300, 760, 530), 14, fill=(220, 226, 234, 255))
        d.rounded_rectangle((340, 250, 720, 500), 10, fill=NAVY)
        draw_cases(d, 390, 430, 5, 6, 1.05)
        draw_pallet(d, 400, 500, 1.6)
    elif kind == "robot":
        d.ellipse((430, 430, 560, 520), fill=STEEL)
        d.rectangle((480, 250, 510, 450), fill=NAVY)
        d.polygon([(490, 250), (680, 210), (700, 250), (510, 300)], fill=GOLD)
        d.ellipse((670, 190, 760, 280), fill=NAVY)
        d.rounded_rectangle((200, 480, 420, 560), 8, fill=(220, 226, 234, 255))
        draw_pallet(d, 620, 500, 1.2)
        draw_cases(d, 640, 460, 3, 3, 0.95)
        d.arc((300, 160, 820, 520), 200, 20, fill=STEEL, width=10)
    else:
        d.rounded_rectangle((160, 260, 520, 530), 16, fill=NAVY)
        draw_cases(d, 210, 430, 4, 4, 1.1)
        d.rounded_rectangle((540, 250, 820, 540), 16, fill=(24, 52, 92, 255))
        d.ellipse((560, 280, 800, 430), fill=STEEL)
        d.arc((560, 280, 800, 430), 200, 40, fill=GOLD, width=14)
        draw_pallet(d, 590, 470, 1.15)

    d.text((36, h - 62), product["code"], font=font(28, True), fill=GOLD)
    d.text((36, h - 32), product["name"][:72], font=font(16), fill=(255, 255, 255, 230))

    dest = PRODUCT_DIR / product["image"]
    bg.save(dest, "PNG")
    print("image", dest)


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
