#!/usr/bin/env python3
"""
Idempotent CMC Klebetechnik GmbH brand + CMC 10730 product import.

Uses the existing admin API contract (POST /api/admin/brands, products, upload).
Sends canonical BrandSeo fields plus legacy aliases (description / content_html).

  ADMIN_PASSWORD='…' python3 tools/import_cmc_catalog.py
  ADMIN_TOKEN='…'    python3 tools/import_cmc_catalog.py
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "cmc_klebetechnik_catalog.json"
DEFAULT_API = os.environ.get("LPAEZSIS_API", "https://prueba1.lpaezsis.cl")
DEFAULT_ORIGIN = os.environ.get("LPAEZSIS_ORIGIN", "https://prueba1.lpaezsis.cl")

SPECS_HEADER = "Especificaciones técnicas:"
FICHA_PREFIX = "Ficha técnica:"

SPEC_LABELS = {
    "material_soporte": "Material de soporte",
    "tipo_adhesivo": "Tipo de adhesivo",
    "espesor_base": "Espesor base",
    "espesor_total": "Espesor total",
    "color": "Color",
    "clase_termica": "Clase térmica",
    "formato_estandar": "Formato estándar",
}


def load_catalog() -> dict:
    return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))


def spec_rows(product: dict) -> list[tuple[str, str]]:
    if product.get("specs"):
        return [(str(k), str(v)) for k, v in product["specs"]]
    blob = product.get("especificaciones_json") or {}
    return [(SPEC_LABELS.get(k, k), str(v)) for k, v in blob.items()]


def compose_description(product: dict) -> str:
    lines = [product["detail"].strip(), "", SPECS_HEADER]
    for key, value in spec_rows(product):
        lines.append(f"• {key}: {value}")
    lines.append("")
    lines.append(f"{FICHA_PREFIX} {product['datasheet']}")
    return "\n".join(lines)


def normalize_public_url(url: str) -> str:
    url = (url or "").strip().replace("\\", "/")
    if url.startswith("/site/"):
        url = url[5:]
    elif url.lower().startswith("site/"):
        url = "/" + url[5:]
    if url and not url.startswith("/") and not url.startswith("http"):
        url = "/" + url.lstrip("./")
    return url


def local_public_file(url: str) -> Path:
    return ROOT / "site" / normalize_public_url(url).lstrip("/")


def resolve_public_logo(brand: dict) -> str:
    """Vincula logo_url a un archivo real bajo site/img/ (nunca /img/uploads/)."""
    slug = str(brand.get("slug") or "")
    candidates: list[str] = []
    declared = str(brand.get("logo_url") or "").strip()
    if declared:
        candidates.append(declared)
    if slug:
        candidates.extend(
            [
                f"/img/logo-{slug}.webp",
                f"/img/logo-{slug}.png",
                f"/img/brand/{slug}.webp",
                f"/img/brand/{slug}.png",
            ]
        )
    seen: set[str] = set()
    for raw in candidates:
        url = normalize_public_url(raw)
        if not url or url.startswith("/img/uploads/") or url in seen:
            continue
        seen.add(url)
        if local_public_file(url).is_file():
            return url
    raise SystemExit(
        f"No hay logo en site/img/ para slug={slug or '?'} (probado: {candidates})"
    )


def apply_logo_to_schema(schema: object, logo_url: str, origin: str = DEFAULT_ORIGIN) -> str:
    origin = origin.rstrip("/")
    abs_logo = logo_url if logo_url.startswith("http") else origin + (
        logo_url if logo_url.startswith("/") else "/" + logo_url
    )
    logo_obj = {"@type": "ImageObject", "url": abs_logo}
    data: dict
    if isinstance(schema, str) and schema.strip():
        try:
            parsed = json.loads(schema)
            data = parsed if isinstance(parsed, dict) else {}
        except json.JSONDecodeError:
            data = {}
    elif isinstance(schema, dict):
        data = dict(schema)
    else:
        data = {}
    if not data:
        data = {"@context": "https://schema.org", "@graph": []}
    nodes = data.get("@graph")
    if not isinstance(nodes, list):
        nodes = [data] if data.get("@type") else []
        data = {"@context": data.get("@context") or "https://schema.org", "@graph": nodes}
    found = False
    for node in nodes:
        if isinstance(node, dict) and node.get("@type") == "Brand":
            node["logo"] = logo_obj
            found = True
    if not found:
        nodes.insert(0, {"@type": "Brand", "logo": logo_obj})
    data["@graph"] = nodes
    return json.dumps(data, ensure_ascii=False, indent=2)


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
            data = json.dumps(body, ensure_ascii=False).encode("utf-8")
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


def envelope_rows(payload: dict, key: str) -> list:
    if not isinstance(payload, dict):
        return []
    data = payload.get("data") if isinstance(payload.get("data"), dict) else {}
    rows = payload.get(key) or data.get(key) or []
    return rows if isinstance(rows, list) else []


def remote_ok(base: str, path: str) -> bool:
    url = base.rstrip("/") + path
    try:
        req = urllib.request.Request(url, method="HEAD")
        with urllib.request.urlopen(req, timeout=15) as res:
            return 200 <= getattr(res, "status", 200) < 400
    except Exception:
        return False


def brand_payload(brand: dict, logo_url: str) -> dict:
    short = brand.get("short_description") or brand.get("description")
    long = brand.get("long_description") or brand.get("content_html")
    payload = {
        "name": brand["name"],
        "slug": brand["slug"],
        "origin_country": brand.get("origin_country"),
        "subtitle": brand.get("subtitle"),
        "short_description": short,
        "long_description": long,
        "description": short,
        "content_html": long,
        "seo_title": brand.get("seo_title"),
        "seo_description": brand.get("seo_description"),
        "seo_keywords": brand.get("seo_keywords"),
        "canonical_url": brand.get("canonical_url") or f"/marcas.html?slug={brand['slug']}",
        "schema_json_ld": apply_logo_to_schema(brand.get("schema_json_ld"), logo_url),
        "logo_url": logo_url,
        "website_url": brand.get("website_url") or None,
        "datasheet_url": brand.get("datasheet_url") or None,
        "sort_order": brand.get("sort_order", 100),
        "is_active": 1 if brand.get("is_active", True) else 0,
    }
    return payload


def resolve_brand_id(res: dict, existing: dict | None) -> int:
    if existing and existing.get("id"):
        return int(existing["id"])
    data = res.get("data") if isinstance(res.get("data"), dict) else {}
    brand = res.get("brand") or data.get("brand") or {}
    for candidate in (res.get("id"), data.get("id"), brand.get("id")):
        if candidate not in (None, ""):
            return int(candidate)
    raise SystemExit(f"Respuesta de marca sin id: {json.dumps(res, ensure_ascii=False)[:800]}")


def import_live(catalog: dict, api: str, password: str | None, token: str | None) -> None:
    client = AdminClient(api, token)
    if not client.token:
        if not password:
            raise SystemExit("Falta ADMIN_PASSWORD o ADMIN_TOKEN")
        client.login(password)
        print("login ok")

    # GET brands first so BrandSeo::ensureColumns() runs on live.
    brands_res = client.request("GET", "/api/admin/brands")
    if brands_res.get("success") is False or brands_res.get("ok") is False:
        raise SystemExit("GET /api/admin/brands falló: " + json.dumps(brands_res, ensure_ascii=False)[:800])
    cats = index_by_slug(envelope_rows(client.request("GET", "/api/admin/categories"), "categories"))
    brands = index_by_slug(envelope_rows(brands_res, "brands"))
    products = index_by_slug(envelope_rows(client.request("GET", "/api/admin/products"), "products"))

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
    cats = index_by_slug(envelope_rows(client.request("GET", "/api/admin/categories"), "categories"))

    brand = catalog["brand"]
    logo_url = resolve_public_logo(brand)
    print("canonical logo", logo_url, "file", local_public_file(logo_url))

    datasheet_url = brand.get("datasheet_url")
    if datasheet_url:
        ds_file = ROOT / "site" / str(datasheet_url).lstrip("/")
        if ds_file.is_file() and not remote_ok(client.base, datasheet_url):
            try:
                uploaded_ds = client.upload_file(ds_file)
                if uploaded_ds:
                    print("uploaded brand datasheet", uploaded_ds)
            except SystemExit as exc:
                print("datasheet upload skipped:", exc)

    payload = brand_payload(brand, logo_url)
    existing_brand = brands.get(brand["slug"])
    if existing_brand:
        res = client.request("PUT", f"/api/admin/brands/{existing_brand['id']}", payload)
        if res.get("success") is False or res.get("ok") is False:
            raise SystemExit("PUT marca falló: " + json.dumps(res, ensure_ascii=False)[:800])
        brand_id = resolve_brand_id(res, existing_brand)
        print("brand update", brand["slug"], brand_id)
    else:
        res = client.request("POST", "/api/admin/brands", payload)
        if res.get("success") is False or res.get("ok") is False:
            raise SystemExit("POST marca falló: " + json.dumps(res, ensure_ascii=False)[:800])
        brand_id = resolve_brand_id(res, None)
        print("brand create", brand["slug"], json.dumps({
            "success": res.get("success"),
            "ok": res.get("ok"),
            "id": brand_id,
            "slug": res.get("slug") or brand["slug"],
        }, ensure_ascii=False))

    for prod in catalog["products"]:
        cat = cats.get(prod["category_slug"])
        if not cat:
            raise SystemExit(f"Categoría no encontrada: {prod['category_slug']}")
        prod_brand_slug = prod.get("brand_slug") or brand["slug"]
        if prod_brand_slug != brand["slug"]:
            raise SystemExit(f"brand_slug del producto no coincide: {prod_brand_slug}")
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

        ds_file = ROOT / "site" / str(prod["datasheet"]).lstrip("/")
        if ds_file.is_file() and not remote_ok(client.base, prod["datasheet"]):
            try:
                print("uploaded product datasheet", client.upload_file(ds_file))
            except SystemExit as exc:
                print("product datasheet upload skipped:", exc)

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
        }
        existing = products.get(prod["slug"])
        if existing:
            client.request("PUT", f"/api/admin/products/{existing['id']}", payload)
            print("product update", prod["slug"], existing["id"])
        else:
            res = client.request("POST", "/api/admin/products", payload)
            print("product create", prod["slug"], res)

    brands = index_by_slug(envelope_rows(client.request("GET", "/api/admin/brands"), "brands"))
    saved = brands.get(brand["slug"]) or {}
    seo_ok = bool(saved.get("seo_title") and saved.get("schema_json_ld"))
    if not seo_ok:
        print(
            "warn: la API live aún no hidrata campos SEO (BrandSeo). "
            "Tras desplegar esta rama, volver a ejecutar el importador."
        )
    print(json.dumps({
        "ok": True,
        "success": True,
        "brand": brand["slug"],
        "brand_id": brand_id,
        "seo_persisted": seo_ok,
    }, ensure_ascii=False))


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
