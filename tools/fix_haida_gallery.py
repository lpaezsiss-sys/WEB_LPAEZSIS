#!/usr/bin/env python3
"""Replace HAIDA brand gallery 404s with official tester photos.

Default is dry-run. Live requires --live and CONFIRM_LIVE_HAIDA_GALLERY=yes.
Does not create a brand or category. Does not change menus/settings/passwords.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "haida_gallery.json"
DEFAULT_API = os.environ.get("LPAEZSIS_API", "https://www.lpaezsis.cl")
WP_IMG = re.compile(
    r"https?://(?:www\.)?lpaezsis\.cl/wp-content/uploads/[^\"'\s>]+",
    re.I,
)


def load_data() -> dict:
    return json.loads(DATA.read_text(encoding="utf-8"))


def local_file(rel: str) -> Path | None:
    path = ROOT / "site" / str(rel).lstrip("/")
    return path if path.is_file() else None


def print_draft(data: dict) -> None:
    print("=== BORRADOR GALERIA HAIDA ===")
    print("marca", data["brand_slug"], "id", data.get("brand_live_id"))
    print("policy", json.dumps(data.get("upload_policy"), ensure_ascii=False))
    for photo in data["photos"]:
        path = local_file(photo["file"])
        print(photo["model"], photo["file"], "local", bool(path), photo["shows"])
    print("Para publicar: CONFIRM_LIVE_HAIDA_GALLERY=yes python3 tools/fix_haida_gallery.py --live")


def upload_image(client, rel: str) -> str:
    path = local_file(rel)
    if not path:
        raise SystemExit(f"Falta foto local {rel}")
    suffix = path.suffix.lower()
    mime = "image/jpeg" if suffix in {".jpg", ".jpeg"} else "image/png"
    uploaded = client.request(
        "POST",
        "/api/admin/upload",
        files={"file": (path.name, path.read_bytes(), mime)},
    )
    url = (uploaded.get("url") or "").strip()
    if not url:
        raise SystemExit(f"Upload sin URL para {rel}")
    print("uploaded", path.name, "->", url)
    return url


def rewrite_html(html: str, first_url: str) -> str:
    text = html or ""
    if not text:
        return text
    if re.search(r"<img\b", text, re.I):
        text = re.sub(
            r"<img\b[^>]*>",
            '<img src="' + first_url + '" alt="HD-MFY-06S Haida">',
            text,
            count=1,
            flags=re.I,
        )
    return WP_IMG.sub(first_url, text)


def import_live(data: dict, api: str, password: str | None, token: str | None) -> None:
    sys.path.insert(0, str(ROOT / "tools"))
    from import_columbia_catalog import AdminClient, index_by_slug  # type: ignore

    client = AdminClient(api, token)
    if not client.token:
        if not password:
            raise SystemExit("Falta ADMIN_PASSWORD o ADMIN_TOKEN")
        client.login(password)
        print("login ok")

    brands = index_by_slug(client.request("GET", "/api/admin/brands").get("brands") or [])
    brand = brands.get(data["brand_slug"])
    if not brand:
        raise SystemExit("No se crea marca nueva. Falta haida en el admin.")
    brand_id = int(brand["id"])
    print("usando marca existente haida", brand_id)

    urls = [upload_image(client, photo["file"]) for photo in data["photos"]]
    html = rewrite_html(brand.get("content_html") or "", urls[0])
    payload = {
        "gallery": urls,
        "content_html": html,
    }
    client.request("PUT", f"/api/admin/brands/{brand_id}", payload)
    print("brand update haida gallery", urls)
    print("content_html wp-content leftover", bool(WP_IMG.search(html)))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--live", action="store_true")
    parser.add_argument("--api", default=DEFAULT_API)
    args = parser.parse_args()
    data = load_data()
    if not args.live:
        print_draft(data)
        return
    if os.environ.get("CONFIRM_LIVE_HAIDA_GALLERY") != "yes":
        raise SystemExit("Abortado: falta CONFIRM_LIVE_HAIDA_GALLERY=yes")
    import_live(data, args.api, os.environ.get("ADMIN_PASSWORD"), os.environ.get("ADMIN_TOKEN"))


if __name__ == "__main__":
    main()
