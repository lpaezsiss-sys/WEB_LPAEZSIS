#!/usr/bin/env python3
"""Import Columbia/Okura robot-arm replacement (official reel + Spanish subtitles).

Default is dry-run (prints payload, no POST).
Live admin upload requires BOTH --live and CONFIRM_LIVE_COLUMBIA_REEMPLAZO=yes.
Uploads the official Columbia/Okura reel still. Video is hosted on jsDelivr
(admin upload does not accept MP4). Does not create a brand or category.
Does not change website settings/menus/passwords.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "columbia_reemplazo_robot_catalog.json"
DEFAULT_API = os.environ.get("LPAEZSIS_API", "https://www.lpaezsis.cl")
JSDELIVR = "https://cdn.jsdelivr.net/gh/lpaezsiss-sys/WEB_LPAEZSIS@"

SPECS_HEADER = "Especificaciones técnicas:"
FICHA_PREFIX = "Ficha técnica:"
VIDEO_PREFIX = "Video:"


def load_catalog() -> dict:
    return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))


def public_asset_url(rel: str) -> str:
    rel = str(rel or "").lstrip("/")
    branch = (os.environ.get("VIDEO_BRANCH") or os.environ.get("LEAFLET_BRANCH") or "").strip()
    if not rel:
        return ""
    if branch.startswith("http"):
        return branch
    if branch:
        return JSDELIVR + branch + "/site/" + rel
    return rel


def compose_description(product: dict, video_url: str = "", ficha_url: str = "") -> str:
    lines = [product["detail"].strip(), "", SPECS_HEADER]
    for key, value in product["specs"]:
        lines.append(f"• {key}: {value}")
    if ficha_url:
        lines.append("")
        lines.append(f"{FICHA_PREFIX} {ficha_url}")
    video = video_url or public_asset_url(product.get("video_file") or "")
    if video:
        lines.append("")
        lines.append(f"{VIDEO_PREFIX} {video}")
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


def find_brand(brands: dict, catalog_brand: dict) -> dict:
    wanted = [catalog_brand.get("slug") or ""]
    wanted.extend(catalog_brand.get("slug_fallbacks") or [])
    by_lower = {str(slug).lower(): row for slug, row in brands.items()}
    for slug in wanted:
        hit = brands.get(slug) or by_lower.get(str(slug).lower())
        if hit:
            return hit
    okura = [row for slug, row in brands.items() if "okura" in str(slug).lower()]
    if okura:
        return okura[0]
    columbia = [row for slug, row in brands.items() if "columbia" in str(slug).lower()]
    if columbia:
        return columbia[0]
    raise SystemExit("No se crea marca nueva. Falta columbia-okura / columbia-machine en el admin.")


def print_draft(catalog: dict) -> None:
    brand = catalog["brand"]
    print("=== BORRADOR COLUMBIA/OKURA REEMPLAZO DE BRAZO (REEL + SUBTITULOS ES) ===")
    print("marca existente:", brand["name"], brand["slug"], "fallbacks", brand.get("slug_fallbacks"))
    print("categorias existentes:", [c["slug"] for c in catalog["categories"]])
    print("upload_policy:", json.dumps(catalog.get("upload_policy"), ensure_ascii=False))
    print("video_branch:", os.environ.get("VIDEO_BRANCH") or os.environ.get("LEAFLET_BRANCH") or "(relativo)")
    for prod in catalog["products"]:
        rel = prod.get("image_url")
        video = public_asset_url(prod.get("video_file") or "")
        print(
            "producto:",
            prod["slug"],
            "tipo",
            prod.get("tipo"),
            "cat",
            prod.get("category_slug"),
            "->",
            rel,
            "local",
            bool(local_file(rel)),
            "video",
            video,
            "local_video",
            bool(local_file(prod.get("video_file"))),
        )
        print("nombre:", prod["name"], "sale_mode:", prod["sale_mode"], "sort:", prod["sort_order"])
    print("Para publicar: CONFIRM_LIVE_COLUMBIA_REEMPLAZO=yes python3 tools/import_columbia_reemplazo.py --live")


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

    existing_brand = find_brand(brands, catalog["brand"])
    brand_id = int(existing_brand["id"])
    print("usando marca existente", existing_brand.get("slug"), brand_id)

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
        video_url = public_asset_url(prod.get("video_file") or "")
        ficha_rel = "img/fichas/" + prod["slug"] + ".pdf"
        ficha_url = public_asset_url(ficha_rel) if (ROOT / "site" / ficha_rel).is_file() else ""
        payload = {
            "name": prod["name"],
            "slug": prod["slug"],
            "description": compose_description(prod, video_url=video_url, ficha_url=ficha_url),
            "sale_mode": prod.get("sale_mode") or "quote",
            "stock_status": prod.get("stock_status") or "on_request",
            "tipo": prod.get("tipo") or "equipo",
            "category_id": int(cat["id"]),
            "brand_id": brand_id,
            "image_url": image_url,
            "is_featured": int(prod.get("is_featured") or 0),
            "is_active": 1,
            "sort_order": prod["sort_order"],
            "seo_title": prod.get("seo_title") or (prod["name"] + " | Cotizar LPAEZsis"),
            "seo_description": prod["summary"],
        }
        if ficha_url:
            payload["ficha_pdf_url"] = ficha_url
        existing = products.get(prod["slug"])
        if existing:
            client.request("PUT", f"/api/admin/products/{existing['id']}", payload)
            print("product update", prod["slug"], existing["id"], "img", image_url, "video", video_url)
        else:
            res = client.request("POST", "/api/admin/products", payload)
            print("product create", prod["slug"], res, "img", image_url, "video", video_url)

    append_brand_video(client, existing_brand, video_url=video_url, poster_url=image_url)


def append_brand_video(client, brand: dict, video_url: str, poster_url: str) -> None:
    marker = "reemplazo-brazo-robotico-columbia"
    html = brand.get("content_html") or ""
    if marker in html:
        print("brand video section already present")
        return
    if not video_url:
        return
    poster = poster_url or ""
    section = (
        '\n<section class="brand-section">\n'
        "<h3>Reemplazo de brazo robótico</h3>\n"
        "<p>Programa de reemplazo de robot publicado por Columbia/Okura LLC. "
        "Video oficial con subtítulos en español (Mitch Stalcup, Product Specialist Retrofits).</p>\n"
        f'<video class="brand-video" controls playsinline preload="metadata" '
        f'style="width:min(100%,360px);aspect-ratio:9/16;background:#111;border-radius:10px;display:block" '
        f'poster="{poster}" src="{video_url}"></video>\n'
        f'<p><a href="producto.html?slug={marker}">Ver ficha y cotizar</a></p>\n'
        "</section>\n"
    )
    client.request(
        "PUT",
        f"/api/admin/brands/{brand['id']}",
        {"content_html": html.rstrip() + section},
    )
    print("brand video section appended", brand.get("slug"))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--live", action="store_true", help="POST al admin (requiere confirmación)")
    parser.add_argument("--api", default=DEFAULT_API)
    args = parser.parse_args()
    catalog = load_catalog()
    if not args.live:
        print_draft(catalog)
        return
    if os.environ.get("CONFIRM_LIVE_COLUMBIA_REEMPLAZO") != "yes":
        raise SystemExit("Abortado: falta CONFIRM_LIVE_COLUMBIA_REEMPLAZO=yes (aprobación explícita).")
    import_live(
        catalog,
        args.api,
        os.environ.get("ADMIN_PASSWORD"),
        os.environ.get("ADMIN_TOKEN"),
    )


if __name__ == "__main__":
    main()
