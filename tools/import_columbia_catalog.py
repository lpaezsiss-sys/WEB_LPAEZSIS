#!/usr/bin/env python3
"""
Idempotent Columbia Machine catalog import.

Modes:
  1) Live admin API (default):
       ADMIN_PASSWORD='…' python3 tools/import_columbia_catalog.py
       ADMIN_TOKEN='…'    python3 tools/import_columbia_catalog.py
  2) Patch local SQL dumps for preview:
       python3 tools/import_columbia_catalog.py --sql-dumps
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "columbia_machine_catalog.json"
DEFAULT_API = "https://prueba1.lpaezsis.cl"

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


def sql_escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace("'", "''")


def patch_sql_dumps(catalog: dict) -> None:
    brand = catalog["brand"]
    categories = catalog["categories"]
    products = catalog["products"]
    cat_id = {c["slug"]: 7 + i for i, c in enumerate(categories)}
    brand_id = 8

    brand_row = (
        f"({brand_id},'{brand['slug']}','{sql_escape(brand['name'])}',"
        f"'{sql_escape(brand['description'])}','{sql_escape(brand['logo_url'])}',"
        f"'{sql_escape(brand['website_url'])}','{sql_escape(brand['content_html'])}',"
        f"NULL,{int(brand['sort_order'])},1,'2026-08-21 01:00:00')"
    )
    cat_rows = []
    for i, c in enumerate(categories):
        cid = cat_id[c["slug"]]
        cat_rows.append(
            f"({cid},'{c['slug']}','{sql_escape(c['name'])}','{sql_escape(c['description'])}',"
            f"'{sql_escape(c['seo_title'])}','{sql_escape(c['seo_description'])}',"
            f"{int(c['sort_order'])},1,'2026-08-21 01:00:00')"
        )
    prod_rows = []
    for i, p in enumerate(products):
        pid = 17 + i
        desc = compose_description(p)
        prod_rows.append(
            f"({pid},{cat_id[p['category_slug']]},{brand_id},'{p['slug']}',"
            f"'{sql_escape(p['name'])}','{sql_escape(desc)}','quote','on_request',NULL,"
            f"'{sql_escape(p['image_url'])}',1,1,"
            f"'{sql_escape(p['name'] + ' | Cotizar LPAEZsis')}',"
            f"'{sql_escape(p['summary'])}',{int(p['sort_order'])},"
            f"'2026-08-21 01:00:00','2026-08-21 01:00:00')"
        )

    for path in (
        ROOT / "data" / "lpaezsis_bluehosting.sql",
        ROOT / "data" / "lpaezsis_backup_final.sql",
    ):
        raw = path.read_text(encoding="utf-8")
        raw = _append_insert_row(raw, "brands", brand_row, brand["slug"])
        for row, cat in zip(cat_rows, categories):
            raw = _append_insert_row(raw, "categories", row, cat["slug"])
        for row, prod in zip(prod_rows, products):
            raw = _append_insert_row(raw, "products", row, prod["slug"])
        raw = re.sub(
            r"(CREATE TABLE `brands`[\s\S]*?ENGINE=InnoDB AUTO_INCREMENT=)\d+",
            r"\g<1>9",
            raw,
            count=1,
        )
        raw = re.sub(
            r"(CREATE TABLE `categories`[\s\S]*?ENGINE=InnoDB AUTO_INCREMENT=)\d+",
            r"\g<1>11",
            raw,
            count=1,
        )
        raw = re.sub(
            r"(CREATE TABLE `products`[\s\S]*?ENGINE=InnoDB AUTO_INCREMENT=)\d+",
            r"\g<1>21",
            raw,
            count=1,
        )
        path.write_text(raw, encoding="utf-8")
        print("patched", path.relative_to(ROOT))


def _insert_statement_end(raw: str, table: str) -> tuple[int, int]:
    key = f"INSERT INTO `{table}` VALUES"
    start = raw.find(key)
    if start < 0:
        raise SystemExit(f"INSERT INTO `{table}` not found")
    i = start
    in_str = False
    esc = False
    while i < len(raw):
        ch = raw[i]
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == "'":
                if i + 1 < len(raw) and raw[i + 1] == "'":
                    i += 2
                    continue
                in_str = False
        else:
            if ch == "'":
                in_str = True
            elif ch == ";":
                return start, i
        i += 1
    raise SystemExit(f"semicolon for `{table}` insert not found")


def _append_insert_row(raw: str, table: str, row: str, slug: str) -> str:
    start, semi = _insert_statement_end(raw, table)
    chunk = raw[start:semi]
    if f"'{slug}'" in chunk:
        print(f"skip existing {table}.{slug}")
        return raw
    before = raw[:semi].rstrip()
    if not before.endswith(")"):
        raise SystemExit(f"INSERT `{table}` does not end with )")
    return before + ",\n" + row + raw[semi:]


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


def index_by_slug(rows: list, key: str = "slug") -> dict:
    return {str(r.get(key) or ""): r for r in rows if r.get(key)}


def import_live(catalog: dict, api: str, password: str | None, token: str | None) -> None:
    client = AdminClient(api, token)
    if not client.token:
        if not password:
            raise SystemExit(
                "Falta ADMIN_PASSWORD o ADMIN_TOKEN para importar en el admin de prueba1."
            )
        client.login(password)
        print("login ok")

    cats = index_by_slug(client.request("GET", "/api/admin/categories").get("categories") or [])
    brands = index_by_slug(client.request("GET", "/api/admin/brands").get("brands") or [])
    products = index_by_slug(client.request("GET", "/api/admin/products").get("products") or [])

    created = {"categories": [], "brand": None, "products": []}

    for cat in catalog["categories"]:
        existing = cats.get(cat["slug"])
        payload = {
            "name": cat["name"],
            "slug": cat["slug"],
            "description": cat["description"],
            "seo_title": cat["seo_title"],
            "seo_description": cat["seo_description"],
            "sort_order": cat["sort_order"],
            "is_active": 1,
        }
        if existing:
            client.request("PUT", f"/api/admin/categories/{existing['id']}", payload)
            print("category update", cat["slug"], existing["id"])
        else:
            res = client.request("POST", "/api/admin/categories", payload)
            print("category create", cat["slug"], res)
            created["categories"].append(cat["slug"])
    cats = index_by_slug(client.request("GET", "/api/admin/categories").get("categories") or [])

    brand = catalog["brand"]
    logo_url = brand["logo_url"]
    logo_file = ROOT / "site" / brand["logo_url"].lstrip("/")
    if logo_file.is_file():
        try:
            uploaded = client.request(
                "POST",
                "/api/admin/upload",
                files={"file": (logo_file.name, logo_file.read_bytes(), "image/png")},
            )
            if uploaded.get("url"):
                logo_url = uploaded["url"]
                print("uploaded logo", logo_url)
        except SystemExit as exc:
            print("logo upload skipped:", exc)

    brand_payload = {
        "name": brand["name"],
        "slug": brand["slug"],
        "description": brand["description"],
        "logo_url": logo_url,
        "website_url": brand["website_url"],
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
        created["brand"] = brand["slug"]
        print("brand create", brand["slug"], res)

    for prod in catalog["products"]:
        cat = cats.get(prod["category_slug"])
        if not cat:
            raise SystemExit(f"Categoría no encontrada: {prod['category_slug']}")
        image_url = prod["image_url"]
        img_file = ROOT / "site" / prod["image_url"].lstrip("/")
        if img_file.is_file():
            try:
                uploaded = client.request(
                    "POST",
                    "/api/admin/upload",
                    files={"file": (img_file.name, img_file.read_bytes(), "image/png")},
                )
                if uploaded.get("url"):
                    image_url = uploaded["url"]
                    print("uploaded image", prod["slug"], image_url)
            except SystemExit as exc:
                print("image upload skipped:", prod["slug"], exc)

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
            created["products"].append(prod["slug"])
            print("product create", prod["slug"], res)

    print(json.dumps({"ok": True, "created": created}, ensure_ascii=False, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sql-dumps", action="store_true", help="Patch local SQL dumps")
    parser.add_argument("--api", default=os.environ.get("LPAEZSIS_API", DEFAULT_API))
    args = parser.parse_args()
    catalog = load_catalog()
    if args.sql_dumps:
        patch_sql_dumps(catalog)
        return
    import_live(
        catalog,
        args.api,
        os.environ.get("ADMIN_PASSWORD"),
        os.environ.get("ADMIN_TOKEN"),
    )


if __name__ == "__main__":
    main()
