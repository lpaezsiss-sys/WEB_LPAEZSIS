#!/usr/bin/env python3
"""Upload Sonic 1-page leaflets and attach them to live products.

Default is dry-run. Live requires --live and CONFIRM_LIVE_SONIC_LEAFLETS=yes.
Does not create brands/categories or change site settings/menus.
Only updates the Ficha técnica line of existing Sonic products that have a local PDF.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FICHAS = ROOT / "site" / "img" / "fichas"
DEFAULT_API = os.environ.get("LPAEZSIS_API", "https://www.lpaezsis.cl")


def leaflet_files() -> dict[str, Path]:
    files = {}
    for path in sorted(FICHAS.glob("*.pdf")):
        if "columbia" in path.name or path.name.startswith("ficha_tecnica_"):
            continue
        files[path.stem] = path
    return files


def print_draft() -> None:
    print("=== BORRADOR LEAFLETS SONIC (1 página, foto oficial) ===")
    for slug, path in leaflet_files().items():
        print(f"{slug} -> {path.relative_to(ROOT)} ({path.stat().st_size} bytes)")
    print("Para publicar: CONFIRM_LIVE_SONIC_LEAFLETS=yes python3 tools/import_sonic_leaflets.py --live")


def set_datasheet_line(description: str, url: str) -> str:
    text = (description or "").replace("\r\n", "\n").rstrip()
    marker = "Ficha técnica:"
    if marker in text:
        before = text.rsplit(marker, 1)[0].rstrip()
        return before + "\n\n" + marker + " " + url
    if text:
        return text + "\n\n" + marker + " " + url
    return marker + " " + url


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
    leaflets = leaflet_files()
    for slug, path in leaflets.items():
        existing = products.get(slug)
        if not existing:
            print("skip not in admin", slug)
            continue
        uploaded = client.request(
            "POST",
            "/api/admin/upload",
            files={"file": (path.name, path.read_bytes(), "application/pdf")},
        )
        url = (uploaded.get("url") or "").strip()
        if not url:
            raise SystemExit(f"Upload PDF falló para {slug}: {uploaded}")
        print("uploaded", path.name, "->", url)
        canonical = f"/img/fichas/{path.name}"
        try:
            req = urllib.request.Request(client.base + canonical, method="HEAD")
            with urllib.request.urlopen(req, timeout=12) as res:
                if 200 <= getattr(res, "status", 200) < 400:
                    url = canonical
                    print("using canonical", canonical)
        except Exception:
            pass
        new_desc = set_datasheet_line(existing.get("description") or "", url)
        client.request(
            "PUT",
            f"/api/admin/products/{existing['id']}",
            {"description": new_desc},
        )
        print("product update", slug, existing["id"], "ficha", url)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--live", action="store_true")
    parser.add_argument("--api", default=DEFAULT_API)
    args = parser.parse_args()
    if not args.live:
        print_draft()
        return
    if os.environ.get("CONFIRM_LIVE_SONIC_LEAFLETS") != "yes":
        raise SystemExit("Abortado: falta CONFIRM_LIVE_SONIC_LEAFLETS=yes")
    import_live(args.api, os.environ.get("ADMIN_PASSWORD"), os.environ.get("ADMIN_TOKEN"))


if __name__ == "__main__":
    main()
