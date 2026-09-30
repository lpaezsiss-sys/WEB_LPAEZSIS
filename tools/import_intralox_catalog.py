#!/usr/bin/env python3
"""Import Intralox catalog. Default is dry-run (prints payload, no POST).

Live admin upload requires BOTH --live and CONFIRM_LIVE_INTRALOX=yes.
Does not change website settings/menus/passwords.
Reuses the existing category slug bandas-modulares-higiene.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "intralox_catalog.json"
DEFAULT_API = os.environ.get("LPAEZSIS_API", "https://www.lpaezsis.cl")

SPECS_HEADER = "Especificaciones técnicas:"


def load_catalog() -> dict:
    return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))


def compose_description(product: dict) -> str:
    lines = [product["detail"].strip(), "", SPECS_HEADER]
    for key, value in product["specs"]:
        lines.append(f"• {key}: {value}")
    if product.get("datasheet"):
        lines.append("")
        lines.append(f"Ficha técnica: {product['datasheet']}")
    return "\n".join(lines)


def print_draft(catalog: dict) -> None:
    brand = catalog["brand"]
    print("=== BORRADOR INTRALOX (sin POST) ===")
    print("marca:", brand["name"], brand["slug"])
    print("logo_url:", brand["logo_url"], "(letrero fotografiado, no vector oficial)")
    print("website:", brand["website_url"])
    print("categoria existente:", catalog["categories"][0]["slug"])
    for prod in catalog["products"]:
        print("producto:", prod["slug"], "->", prod["image_url"])
    print("upload_policy:", json.dumps(catalog.get("upload_policy"), ensure_ascii=False))
    print("Para publicar: CONFIRM_LIVE_INTRALOX=yes python3 tools/import_intralox_catalog.py --live")


def import_live(catalog: dict, api: str, password: str | None, token: str | None) -> None:
    # Imported lazily so dry-run does not need network helpers from columbia.
    sys.path.insert(0, str(ROOT / "tools"))
    from import_columbia_catalog import AdminClient, compose_description as _unused, index_by_slug  # type: ignore

    _ = _unused
    client = AdminClient(api, token)
    if not client.token:
        if not password:
            raise SystemExit("Falta ADMIN_PASSWORD o ADMIN_TOKEN")
        client.login(password)
        print("login ok")

    cats = index_by_slug(client.request("GET", "/api/admin/categories").get("categories") or [])
    brands = index_by_slug(client.request("GET", "/api/admin/brands").get("brands") or [])
    products = index_by_slug(client.request("GET", "/api/admin/products").get("products") or [])

    cat_slug = catalog["categories"][0]["slug"]
    cat = cats.get(cat_slug)
    if not cat:
        raise SystemExit(f"No se crea categoría nueva. Falta {cat_slug} en el admin.")
    print("usando categoria existente", cat_slug, cat.get("id"))

    brand = catalog["brand"]
    brand_payload = {
        "name": brand["name"],
        "slug": brand["slug"],
        "description": brand["description"],
        "logo_url": brand["logo_url"],
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
        brand_id = int(res.get("id") or (res.get("data") or {}).get("id") or res.get("brand", {}).get("id"))
        print("brand create", brand["slug"], res)

    for prod in catalog["products"]:
        payload = {
            "name": prod["name"],
            "slug": prod["slug"],
            "description": compose_description(prod),
            "sale_mode": "quote",
            "stock_status": "on_request",
            "category_id": int(cat["id"]),
            "brand_id": brand_id,
            "image_url": prod["image_url"],
            "is_active": 1,
            "sort_order": prod["sort_order"],
            "seo_title": prod["name"] + " | Cotizar LPAEZsis",
            "seo_description": prod["summary"],
        }
        existing = products.get(prod["slug"])
        if existing:
            client.request("PUT", f"/api/admin/products/{existing['id']}", payload)
            print("product update", prod["slug"], existing["id"])
        else:
            res = client.request("POST", "/api/admin/products", payload)
            print("product create", prod["slug"], res)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--live", action="store_true", help="POST al admin (requiere confirmación)")
    parser.add_argument("--api", default=DEFAULT_API)
    args = parser.parse_args()
    catalog = load_catalog()
    if not args.live:
        print_draft(catalog)
        return
    if os.environ.get("CONFIRM_LIVE_INTRALOX") != "yes":
        raise SystemExit("Abortado: falta CONFIRM_LIVE_INTRALOX=yes (aprobación explícita).")
    import_live(
        catalog,
        args.api,
        os.environ.get("ADMIN_PASSWORD"),
        os.environ.get("ADMIN_TOKEN"),
    )


if __name__ == "__main__":
    main()
