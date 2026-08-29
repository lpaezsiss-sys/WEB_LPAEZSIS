#!/usr/bin/env python3
"""
Convierte JPG/PNG de site/img a WebP (calidad ~82) y redimensiona productos.

Uso:
  python3 tools/optimize_to_webp.py
  python3 tools/optimize_to_webp.py --dry-run
  python3 tools/optimize_to_webp.py --dirs products uploads
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow requerido. pip install Pillow", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
SITE_IMG = ROOT / "site" / "img"

# Carpetas de productos/marcas/hero a optimizar
DEFAULT_DIRS = ("products", "uploads", "brand", "hero")

# Ancho máximo por carpeta (nitidez en tarjetas/modales sin sobredimensionar)
MAX_WIDTH = {
    "products": 1200,
    "uploads": 1200,
    "brand": 800,
    "hero": 1920,
}

QUALITY = 82
HEAVY_BYTES = 300 * 1024
RASTER_EXTS = {".jpg", ".jpeg", ".png"}


def should_skip(path: Path) -> bool:
    name = path.name.lower()
    if name.startswith("."):
        return True
    # No tocar favicons / iconos pequeños del sistema
    if "favicon" in name or path.parent.name == "icons":
        return True
    return False


def convert_one(src: Path, max_width: int, quality: int, dry_run: bool) -> dict:
    before = src.stat().st_size
    dest = src.with_suffix(".webp")
    with Image.open(src) as im:
        w, h = im.size
        scale = 1.0
        if w > max_width:
            scale = max_width / float(w)
        new_w = max(1, int(w * scale))
        new_h = max(1, int(h * scale))
        if scale < 1.0:
            im = im.resize((new_w, new_h), Image.Resampling.LANCZOS)

        has_alpha = (
            im.mode in ("RGBA", "LA")
            or (im.mode == "P" and "transparency" in im.info)
        )
        if has_alpha:
            im = im.convert("RGBA")
        else:
            im = im.convert("RGB")

        if dry_run:
            return {
                "src": str(src.relative_to(ROOT)),
                "dest": str(dest.relative_to(ROOT)),
                "before_kb": before / 1024,
                "after_kb": None,
                "size": f"{w}x{h}",
                "out_size": f"{new_w}x{new_h}",
                "action": "would-write",
            }

        # Guarda WebP hermano
        im.save(dest, "WEBP", quality=quality, method=6)
        after = dest.stat().st_size

        # Si el original es muy pesado/ancho, también reescribe JPG/PNG reducido
        # (mantiene fallback <picture>). Solo si realmente bajamos peso/dimensión.
        rewritten = False
        if (before > HEAVY_BYTES or w > max_width) and scale < 1.0:
            tmp = src.with_suffix(src.suffix + ".tmp")
            if has_alpha and src.suffix.lower() == ".png":
                im.save(tmp, "PNG", optimize=True)
            else:
                rgb = im.convert("RGB")
                if src.suffix.lower() in {".jpg", ".jpeg"}:
                    rgb.save(tmp, "JPEG", quality=quality, optimize=True, progressive=True)
                else:
                    # PNG sin alpha → JPEG más liviano no; mantener PNG optimizado
                    im_png = im.convert("RGBA") if has_alpha else im.convert("RGB")
                    im_png.save(tmp, "PNG", optimize=True)
            if tmp.stat().st_size < before:
                tmp.replace(src)
                rewritten = True
                before = src.stat().st_size
            else:
                tmp.unlink(missing_ok=True)

    return {
        "src": str(src.relative_to(ROOT)),
        "dest": str(dest.relative_to(ROOT)),
        "before_kb": before / 1024,
        "after_kb": after / 1024,
        "size": f"{w}x{h}",
        "out_size": f"{new_w}x{new_h}",
        "action": "webp" + ("+resize-src" if rewritten else ""),
    }


def audit(dirs: list[str]) -> list[dict]:
    findings = []
    for d in dirs:
        folder = SITE_IMG / d
        if not folder.is_dir():
            continue
        for path in sorted(folder.rglob("*")):
            if not path.is_file() or path.suffix.lower() not in RASTER_EXTS:
                continue
            if should_skip(path):
                continue
            size = path.stat().st_size
            try:
                with Image.open(path) as im:
                    w, h = im.size
            except Exception:
                w = h = 0
            heavy = size > HEAVY_BYTES or w > 1200
            webp = path.with_suffix(".webp")
            findings.append(
                {
                    "path": str(path.relative_to(ROOT)),
                    "kb": round(size / 1024, 1),
                    "wh": f"{w}x{h}",
                    "heavy": heavy,
                    "has_webp": webp.is_file(),
                }
            )
    return findings


def main() -> int:
    ap = argparse.ArgumentParser(description="Optimiza imágenes a WebP")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--audit-only", action="store_true")
    ap.add_argument(
        "--dirs",
        nargs="+",
        default=list(DEFAULT_DIRS),
        help="Subcarpetas bajo site/img",
    )
    ap.add_argument("--quality", type=int, default=QUALITY)
    args = ap.parse_args()

    findings = audit(args.dirs)
    heavy = [f for f in findings if f["heavy"]]
    missing_webp = [f for f in findings if not f["has_webp"]]
    print(f"Auditoría: {len(findings)} raster, {len(heavy)} pesados/anchos, {len(missing_webp)} sin WebP")
    for f in heavy[:30]:
        flag = "HEAVY" if f["heavy"] else ""
        print(f"  {f['kb']:8.1f} KB  {f['wh']:>12}  webp={f['has_webp']}  {f['path']} {flag}")

    if args.audit_only:
        return 0

    converted = 0
    saved = 0.0
    for d in args.dirs:
        folder = SITE_IMG / d
        if not folder.is_dir():
            print(f"-- skip missing {folder}")
            continue
        max_w = MAX_WIDTH.get(d, 1200)
        for path in sorted(folder.rglob("*")):
            if not path.is_file() or path.suffix.lower() not in RASTER_EXTS:
                continue
            if should_skip(path):
                continue
            try:
                info = convert_one(path, max_w, args.quality, args.dry_run)
            except Exception as e:
                print(f"ERR {path}: {e}")
                continue
            converted += 1
            if info["after_kb"] is not None:
                delta = info["before_kb"] - info["after_kb"]
                saved += max(0.0, delta)
                print(
                    f"OK  {info['src']}  {info['size']}→{info['out_size']}  "
                    f"{info['before_kb']:.0f}KB → webp {info['after_kb']:.0f}KB  [{info['action']}]"
                )
            else:
                print(f"DRY {info['src']}  {info['size']}→{info['out_size']}")

    print(f"Listo: {converted} archivos, ~{saved:.0f} KB ahorrados en WebP (aprox.)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
