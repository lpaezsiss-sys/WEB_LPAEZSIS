#!/usr/bin/env python3
"""
Idempotent LYC brand + conveyor-systems product import.

  ADMIN_PASSWORD='…' python3 tools/import_lyc_catalog.py
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "lyc_transportadores_catalog.json"
DEFAULT_API = os.environ.get("LPAEZSIS_API", "https://prueba1.lpaezsis.cl")

SPECS_HEADER = "Especificaciones técnicas:"
FICHA_PREFIX = "Ficha técnica:"


def load_catalog() -> dict:
    return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))


def compose_description(product: dict) -> str:
    lines = [product["detail"].strip(), "", SPECS_HEADER]
    for key, value in product["specs"]:
        lines.append(f"• {key}: {value}")
    lines.append("")
    lines.append(f"{FICHA_PREFIX} {product['datasheet']}")
    return "\n".join(lines)


class AdminClient:
    def __init__(self, base: str, token: str | None = None) -> None:
        self.base = base.rstrip("/")
        self.token = token

    def request(self, method: str, path: str, body: dict | None = None, files: dict | None = None) -> dict:
        url = self.base + path
        headers = {}
        data = None
        if self.token and path != "/api/admin/login":
            headers["Authorization"] = "Bearer " + self.token
        if files:
            boundary = "----LpaezsisBoundary7MA4YWxkTrZu0gW"
            chunks = []
            for name, (filename, blob, mime) in files.items():
                chunks.append(f"--{boundary}\r\n".encode())
                chunks.append(
                    f'Content-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'.encode()
                )
                chunks.append(f"Content-Type: {mime}\r\n\r\n".encode())
                chunks.append(blob)
                chunks.append(b"\r\n")
            chunks.append(f"--{boundary}--\r\n".encode())
            data = b"".join(chunks)
            headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
        elif body is not None:
            data = json.dumps(body).encode("utf-8")
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=45) as res:
                raw = res.read().decode("utf-8")
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise SystemExit(f"{method} {path} -> HTTP {exc.code}: {detail}") from exc

    def login(self, password: str) -> None:
        data = self.request("POST", "/api/admin/login", {"password": password})
        token = data.get("token")
        if not token:
            raise SystemExit("Login ok pero sin token")
        self.token = token

    def upload_file(self, path: Path) -> str:
        suffix = path.suffix.lower()
        mime = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
            ".gif": "image/gif",
            ".pdf": "application/pdf",
        }.get(suffix, "application/octet-stream")
        uploaded = self.request(
            "POST",
            "/api/admin/upload",
            files={"file": (path.name, path.read_bytes(), mime)},
        )
        return str(uploaded.get("url") or "")


def index_by_slug(rows: list, key: str = "slug") -> dict:
    return {str(r.get(key) or ""): r for r in rows if r.get(key)}


def remote_ok(base: str, path: str) -> bool:
    url = base.rstrip("/") + path
    try:
        req = urllib.request.Request(url, method="HEAD")
        with urllib.request.urlopen(req, timeout=15) as res:
            return 200 <= getattr(res, "status", 200) < 400
    except Exception:
        return False


def import_live(catalog: dict, api: str, password: str | None, token: str | None) -> None:
    client = AdminClient(api, token)
    if not client.token:
        if not password:
            raise SystemExit("Falta ADMIN_PASSWORD o ADMIN_TOKEN")
        client.login(password)
        print("login ok")

    cats = index_by_slug(client.request("GET", "/api/admin/categories").get("categories") or [])
    brands = index_by_slug(client.request("GET", "/api/admin/brands").get("brands") or [])
    products = index_by_slug(client.request("GET", "/api/admin/products").get("products") or [])

    for cat in catalog["categories"]:
        payload = {
            "name": cat["name"],
            "slug": cat["slug"],
            "description": cat["description"],
            "seo_title": cat["seo_title"],
            "seo_description": cat["seo_description"],
            "sort_order": cat["sort_order"],
            "is_active": 1,
        }
        existing = cats.get(cat["slug"])
        if existing:
            client.request("PUT", f"/api/admin/categories/{existing['id']}", payload)
            print("category update", cat["slug"], existing["id"])
        else:
            res = client.request("POST", "/api/admin/categories", payload)
            print("category create", cat["slug"], res)
    cats = index_by_slug(client.request("GET", "/api/admin/categories").get("categories") or [])

    brand = catalog["brand"]
    logo_url = brand["logo_url"]
    logo_file = ROOT / "site" / brand["logo_url"].lstrip("/")
    if logo_file.is_file():
        try:
            uploaded = client.upload_file(logo_file)
            if uploaded:
                logo_url = uploaded
                print("uploaded logo", logo_url)
        except SystemExit as exc:
            print("logo upload skipped:", exc)

    brand_payload = {
        "name": brand["name"],
        "slug": brand["slug"],
        "description": brand["description"],
        "logo_url": logo_url,
        "website_url": brand.get("website_url") or None,
        "content_html": brand["content_html"],
        "sort_order": brand["sort_order"],
        "is_active": 1,
    }
    existing_brand = brands.get(brand["slug"])
    if existing_brand:
        client.request("PUT", f"/api/admin/brands/{existing_brand['id']}", brand_payload)
        brand_id = int(existing_brand["id"])
        print("brand update", brand["slug"], brand_id)
    else:
        res = client.request("POST", "/api/admin/brands", brand_payload)
        brand_id = int(res["id"])
        print("brand create", brand["slug"], res)

    for prod in catalog["products"]:
        cat = cats.get(prod["category_slug"])
        if not cat:
            raise SystemExit(f"Categoría no encontrada: {prod['category_slug']}")
        image_url = prod["image_url"]
        img_file = ROOT / "site" / prod["image_url"].lstrip("/")
        uploaded_url = ""
        if img_file.is_file():
            try:
                uploaded_url = client.upload_file(img_file)
                print("uploaded image", prod["slug"], uploaded_url)
            except SystemExit as exc:
                print("image upload skipped:", prod["slug"], exc)
        if uploaded_url:
            image_url = uploaded_url
            if remote_ok(client.base, prod["image_url"]):
                image_url = prod["image_url"]
                print("using canonical image", image_url)
            else:
                print("canonical image not live yet", prod["image_url"])

        payload = {
            "name": prod["name"],
            "slug": prod["slug"],
            "category_id": int(cat["id"]),
            "brand_id": brand_id,
            "description": compose_description(prod),
            "sale_mode": "quote",
            "stock_status": "on_request",
            "price_clp": None,
            "image_url": image_url,
            "is_featured": 1,
            "is_active": 1,
            "seo_title": prod["name"] + " | Cotizar LPAEZsis",
            "seo_description": prod["summary"],
            "sort_order": prod["sort_order"],
            "tipo": "equipo",
        }
        existing = products.get(prod["slug"])
        if existing:
            client.request("PUT", f"/api/admin/products/{existing['id']}", payload)
            print("product update", prod["slug"], existing["id"])
        else:
            res = client.request("POST", "/api/admin/products", payload)
            print("product create", prod["slug"], res)

    print(json.dumps({"ok": True, "brand": brand["slug"]}, ensure_ascii=False))


def main() -> None:
    catalog = load_catalog()
    import_live(
        catalog,
        DEFAULT_API,
        os.environ.get("ADMIN_PASSWORD"),
        os.environ.get("ADMIN_TOKEN"),
    )


if __name__ == "__main__":
    main()
