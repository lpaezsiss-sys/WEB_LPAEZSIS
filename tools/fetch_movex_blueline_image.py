#!/usr/bin/env python3
"""
Descarga una foto de aplicación industrial para la línea Blueline®.

Orden:
  1) URLs primarias (Unsplash / Wikimedia de bandas o líneas de proceso)
  2) Fallback Unsplash por keywords: industrial conveyor belt food processing

Uso:
  python3 tools/fetch_movex_blueline_image.py
"""
from __future__ import annotations

import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "site" / "img" / "productos" / "movex-blueline.jpg"

UNSPLASH_FALLBACK = (
    "https://images.unsplash.com/photo-1553413077-190dd305871c"
    "?auto=format&fit=crop&w=1600&q=80"
)
UNSPLASH_KEYWORDS = (
    "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55"
    "?auto=format&fit=crop&w=1600&q=80"
)

PRIMARY_URLS = [
    # Línea industrial / process (Unsplash, uso permitido con atribución)
    "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1600&q=80",
    UNSPLASH_KEYWORDS,
    UNSPLASH_FALLBACK,
]

UA = "LPAEZSIS-catalog/1.0 (https://prueba1.lpaezsis.cl)"


def download(url: str, dest: Path) -> bool:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "image/*"})
    try:
        with urllib.request.urlopen(req, timeout=40) as res:
            ctype = (res.headers.get("Content-Type") or "").lower()
            blob = res.read()
        if len(blob) < 8000:
            print("skip (too small)", url, len(blob))
            return False
        if "html" in ctype:
            print("skip (html)", url)
            return False
        dest.write_bytes(blob)
        print("saved", dest, dest.stat().st_size, "from", url)
        return True
    except urllib.error.HTTPError as exc:
        print("http", exc.code, url)
    except Exception as exc:
        print("fail", type(exc).__name__, url, exc)
    return False


def main() -> None:
    for url in PRIMARY_URLS:
        if download(url, DEST):
            print("FALLBACK_URL", UNSPLASH_FALLBACK)
            return
    raise SystemExit("No se pudo descargar ninguna imagen Blueline")


if __name__ == "__main__":
    main()
