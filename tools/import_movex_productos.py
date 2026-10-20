#!/usr/bin/env python3
"""Import MOVEX PFX, BluLub, Zero Contact and Zero ATP Pro.

Default is dry-run (prints payload, no POST).
Live admin upload requires BOTH --live and CONFIRM_LIVE_MOVEX_PRODUCTOS=yes.
Uploads official Movex brochure/product photos. Does not create a brand or category.
Does not change website settings/menus/passwords.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "movex_productos_catalog.json"
DEFAULT_API = os.environ.get("LPAEZSIS_API", "https://www.lpaezsis.cl")

SPECS_HEADER = "Especificaciones técnicas:"


def load_catalog() -> dict:
    return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))


def compose_description(product: dict) -> str:
    lines = [product["detail"].strip(), "", SPECS_HEADER]
    for key, value in product["specs"]:
        lines.append(f"• {key}: {value}")
    return "\n".join(lines)


def local_file(rel: str | None) -> Path | None:
    if not rel:
        return None
    path = ROOT / "site" / str(rel).lstrip("/")
    return path if path.is_file() else None


def mime_for(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix in {".jpg", ".jpeg"}:
        return "image/jpeg"
    if suffix == ".png":
        return "image/png"
    if suffix == ".webp":
        return "image/webp"
    return "application/octet-stream"


def upload_image(client, rel: str | None) -> str:
    path = local_file(rel)
    if not path:
        return ""
    uploaded = client.request(
        "POST",
        "/api/admin/upload",
        files={"file": (path.name, path.read_bytes(), mime_for(path))},
    )
    url = (uploaded.get("url") or "").strip()
    if url:
        print("uploaded", path.name, "->", url)
    return url


def print_draft(catalog: dict) -> None:
    brand = catalog["brand"]
    print("=== BORRADOR MOVEX PFX / BLULUB / ZERO CONTACT / ZERO ATP PRO ===")
    print("marca existente:", brand["name"], brand["slug"], "id", brand.get("live_id"))
    print("categorias existentes:", [c["slug"] for c in catalog["categories"]])
    print("upload_policy:", json.dumps(catalog.get("upload_policy"), ensure_ascii=False))
    for prod in catalog["products"]:
        rel = prod.get("image_url")
        print(
            "producto:",
            prod["slug"],
            "cat",
            prod.get("category_slug"),
            "->",
            rel,
            "local",
            bool(local_file(rel)),
        )
        print("nombre:", prod["name"], "sale_mode:", prod["sale_mode"], "sort:", prod["sort_order"])
    print("Para publicar: CONFIRM_LIVE_MOVEX_PRODUCTOS=yes python3 tools/import_movex_productos.py --live")


def import_live(catalog: dict, api: str, password: str | None, token: str | None) -> None:
    sys.path.insert(0, str(ROOT / "tools"))
    from import_columbia_catalog import AdminClient, index_by_slug  # type: ignore

    client = AdminClient(api, token)
    if not client.token:
        if not password:
            raise SystemExit("Falta ADMIN_PASSWORD o ADMIN_TOKEN")
        client.login(password)
        print("login ok")

    cats = index_by_slug(client.request("GET", "/api/admin/categories").get("categories") or [])
    brands = index_by_slug(client.request("GET", "/api/admin/brands").get("brands") or [])
    products = index_by_slug(client.request("GET", "/api/admin/products").get("products") or [])

    brand = catalog["brand"]
    existing_brand = brands.get(brand["slug"])
    if not existing_brand:
        raise SystemExit(f"No se crea marca nueva. Falta {brand['slug']} en el admin.")
    brand_id = int(existing_brand["id"])
    print("usando marca existente", brand["slug"], brand_id)

    for cat in catalog["categories"]:
        if not cats.get(cat["slug"]):
            raise SystemExit(f"No se crea categoría nueva. Falta {cat['slug']} en el admin.")
        print("usando categoria existente", cat["slug"], cats[cat["slug"]].get("id"))

    default_cat = catalog["categories"][0]["slug"]
    for prod in catalog["products"]:
        cat_slug = prod.get("category_slug") or default_cat
        cat = cats.get(cat_slug)
        if not cat:
            raise SystemExit(f"No se crea categoría nueva. Falta {cat_slug} para {prod['slug']}.")
        image_url = upload_image(client, prod.get("image_url"))
        if not image_url:
            raise SystemExit(f"Falta foto real para {prod['slug']}")
        payload = {
            "name": prod["name"],
            "slug": prod["slug"],
            "description": compose_description(prod),
            "sale_mode": prod.get("sale_mode") or "quote",
            "stock_status": prod.get("stock_status") or "on_request",
            "category_id": int(cat["id"]),
            "brand_id": brand_id,
            "image_url": image_url,
            "is_featured": int(prod.get("is_featured") or 0),
            "is_active": 1,
            "sort_order": prod["sort_order"],
            "seo_title": prod.get("seo_title") or (prod["name"] + " | Cotizar LPAEZsis"),
            "seo_description": prod["summary"],
        }
        existing = products.get(prod["slug"])
        if existing:
            client.request("PUT", f"/api/admin/products/{existing['id']}", payload)
            print("product update", prod["slug"], existing["id"], "img", image_url)
        else:
            res = client.request("POST", "/api/admin/products", payload)
            print("product create", prod["slug"], res, "img", image_url)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--live", action="store_true", help="POST al admin (requiere confirmación)")
    parser.add_argument("--api", default=DEFAULT_API)
    args = parser.parse_args()
    catalog = load_catalog()
    if not args.live:
        print_draft(catalog)
        return
    if os.environ.get("CONFIRM_LIVE_MOVEX_PRODUCTOS") != "yes":
        raise SystemExit("Abortado: falta CONFIRM_LIVE_MOVEX_PRODUCTOS=yes (aprobación explícita).")
    import_live(
        catalog,
        args.api,
        os.environ.get("ADMIN_PASSWORD"),
        os.environ.get("ADMIN_TOKEN"),
    )


if __name__ == "__main__":
    main()
