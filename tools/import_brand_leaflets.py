#!/usr/bin/env python3
"""Attach 1-page leaflets to live brand products (ficha_pdf_url + Ficha técnica).

Default is dry-run. Live requires --live and CONFIRM_LIVE_BRAND_LEAFLETS=yes.
Does not create brands/categories or change site settings/menus.
PDF upload is not allowed on live admin; after push, uses the public GitHub/jsDelivr URL.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FICHAS = ROOT / "site" / "img" / "fichas"
DEFAULT_API = os.environ.get("LPAEZSIS_API", "https://www.lpaezsis.cl")
SKIP_PREFIXES = ("ficha_tecnica_",)
SKIP_NAMES = {
    "celda-paletizado-robotico-columbia-ai1800.pdf",  # rebuilt under same slug
}


def leaflet_files() -> dict[str, Path]:
    files = {}
    for path in sorted(FICHAS.glob("*.pdf")):
        if path.name.startswith(SKIP_PREFIXES):
            continue
        if path.stat().st_size < 8000:
            continue
        files[path.stem] = path
    return files


def public_url(path: Path) -> str:
    branch = os.environ.get("LEAFLET_BRANCH", "cursor/sonic-leaflets-134e")
    return (
        "https://cdn.jsdelivr.net/gh/lpaezsiss-sys/WEB_LPAEZSIS@"
        + branch
        + "/site/img/fichas/"
        + path.name
    )


def set_datasheet_line(description: str, url: str) -> str:
    text = (description or "").replace("\r\n", "\n").rstrip()
    marker = "Ficha técnica:"
    if marker in text:
        before = text.rsplit(marker, 1)[0].rstrip()
        return before + "\n\n" + marker + " " + url
    if text:
        return text + "\n\n" + marker + " " + url
    return marker + " " + url


def print_draft() -> None:
    print("=== BORRADOR LEAFLETS DE MARCA (1 página, foto real) ===")
    for slug, path in leaflet_files().items():
        print(f"{slug} -> {path.relative_to(ROOT)} ({path.stat().st_size} bytes)")
        print("   url", public_url(path))
    print("Para publicar: CONFIRM_LIVE_BRAND_LEAFLETS=yes python3 tools/import_brand_leaflets.py --live")


def import_live(api: str, password: str | None, token: str | None) -> None:
    sys.path.insert(0, str(ROOT / "tools"))
    from import_columbia_catalog import AdminClient, index_by_slug  # type: ignore

    client = AdminClient(api, token)
    if not client.token:
        if not password:
            raise SystemExit("Falta ADMIN_PASSWORD o ADMIN_TOKEN")
        client.login(password)
        print("login ok")

    products = index_by_slug(client.request("GET", "/api/admin/products").get("products") or [])
    for slug, path in leaflet_files().items():
        existing = products.get(slug)
        if not existing:
            print("skip not in admin", slug)
            continue
        url = public_url(path)
        new_desc = set_datasheet_line(existing.get("description") or "", url)
        payload = {
            "description": new_desc,
            "ficha_pdf_url": url,
        }
        client.request("PUT", f"/api/admin/products/{existing['id']}", payload)
        print("product update", slug, existing["id"], "ficha", url)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--live", action="store_true")
    parser.add_argument("--api", default=DEFAULT_API)
    args = parser.parse_args()
    if not args.live:
        print_draft()
        return
    if os.environ.get("CONFIRM_LIVE_BRAND_LEAFLETS") != "yes":
        raise SystemExit("Abortado: falta CONFIRM_LIVE_BRAND_LEAFLETS=yes")
    import_live(args.api, os.environ.get("ADMIN_PASSWORD"), os.environ.get("ADMIN_TOKEN"))


if __name__ == "__main__":
    main()
