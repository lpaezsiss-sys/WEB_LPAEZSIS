#!/usr/bin/env python3
"""Build the 1-page HAIDA Test para Botellas leaflet from catalog JSON."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from build_brand_leaflets import compress_photo, draw_leaflet, register_fonts  # type: ignore
from import_haida_botellas import compose_description, load_catalog  # type: ignore

OUT = ROOT / "site" / "img" / "fichas" / "test-para-botellas-haida.pdf"


def main() -> None:
    register_fonts()
    catalog = load_catalog()
    prod = catalog["products"][0]
    photo_path = ROOT / "site" / prod["image_url"]
    if not photo_path.is_file():
        raise SystemExit(f"Falta foto {photo_path}")
    product = {
        "name": prod["name"],
        "slug": prod["slug"],
        "brand_name": catalog["brand"]["name"],
        "sale_mode": prod.get("sale_mode") or "quote",
        "description": compose_description(prod),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    draw_leaflet(OUT, product, compress_photo(photo_path))
    print(f"ok {OUT.relative_to(ROOT)} {OUT.stat().st_size} bytes")


if __name__ == "__main__":
    main()
