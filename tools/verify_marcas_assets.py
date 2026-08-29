#!/usr/bin/env python3
"""Verifica logos/imágenes de marcas: local vs producción.

Uso:
  python3 tools/verify_marcas_assets.py
  python3 tools/verify_marcas_assets.py --prod https://www.lpaezsis.cl
"""
from __future__ import annotations

import argparse
import json
import ssl
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"


def http_code(url: str, ctx: ssl.SSLContext) -> int:
    try:
        req = urllib.request.Request(url, method="HEAD")
        with urllib.request.urlopen(req, context=ctx, timeout=20) as res:
            return int(res.status)
    except urllib.error.HTTPError as err:
        return int(err.code)
    except Exception:
        return 0


def webp_sibling(path: str) -> str:
    low = path.lower()
    if low.endswith((".png", ".jpg", ".jpeg")):
        return path.rsplit(".", 1)[0] + ".webp"
    return ""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--prod", default="https://www.lpaezsis.cl")
    ap.add_argument("--out", default=str(ROOT / "tools" / "marcas-assets-diff-report.json"))
    args = ap.parse_args()
    prod = args.prod.rstrip("/")
    ctx = ssl.create_default_context()

    api = json.load(urllib.request.urlopen(f"{prod}/api/marcas.php", context=ctx, timeout=30))
    brands = api.get("todas") or api.get("marcas") or api.get("brands") or []
    if isinstance(api, list):
        brands = api

    rows = []
    upload_candidates = []
    for b in brands:
        slug = b.get("slug") or ""
        logo = (b.get("logo_url") or b.get("imagen") or b.get("imagen_logo") or "").strip()
        if logo.startswith("http://") or logo.startswith("https://"):
            rows.append({"slug": slug, "logo": logo, "type": "external"})
            continue
        logo = logo.lstrip("/")
        webp = webp_sibling(logo)
        png_prod = http_code(f"{prod}/{logo}", ctx) if logo else 0
        webp_prod = http_code(f"{prod}/{webp}", ctx) if webp else None
        local_png = (SITE / logo).is_file() if logo else False
        local_webp = (SITE / webp).is_file() if webp else False
        action = ""
        if webp and webp_prod != 200 and local_webp:
            action = "DEPLOY_WEBP"
            upload_candidates.append(webp)
        if png_prod != 200 and local_png:
            action = (action + "+DEPLOY_PNG").strip("+")
            upload_candidates.append(logo)
        if webp and webp_prod != 200 and not local_webp:
            action = (action + "+MISSING_LOCAL_WEBP").strip("+")
        rows.append(
            {
                "slug": slug,
                "logo": logo,
                "png_prod": png_prod,
                "webp": webp,
                "webp_prod": webp_prod,
                "local_png": local_png,
                "local_webp": local_webp,
                "action": action or "OK",
            }
        )

    # CMC product image check
    try:
        products = json.load(
            urllib.request.urlopen(
                f"{prod}/api/productos.php?brand=cmc-klebetechnik", context=ctx, timeout=30
            )
        )
        if not isinstance(products, list):
            products = products.get("products") or []
    except Exception as exc:  # noqa: BLE001
        products = []
        print("WARN productos CMC:", exc)

    prod_rows = []
    for p in products:
        img = (p.get("imagen_url") or p.get("image_url") or "").lstrip("/")
        code = http_code(f"{prod}/{img}", ctx) if img and not img.startswith("http") else 200
        prod_rows.append(
            {
                "name": p.get("name") or p.get("nombre"),
                "slug": p.get("slug"),
                "sku": p.get("sku") or p.get("id"),
                "image": img,
                "prod_status": code,
                "local": (SITE / img).is_file() if img and not img.startswith("http") else None,
            }
        )

    report = {
        "production": prod,
        "brands": rows,
        "cmc_products": prod_rows,
        "deploy_candidates": sorted(set(upload_candidates)),
        "notes": [
            "marcas.js v=131 usa <picture> con PNG/JPG como src principal; WebP es opcional.",
            "Subir deploy_candidates evita 404 de source webp en navegadores que lo prefieren.",
        ],
    }
    out = Path(args.out)
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    print("=== Marcas assets: local vs", prod, "===")
    for r in rows:
        if r.get("type") == "external":
            print(f"  {r['slug']:22} EXTERNAL {r['logo'][:60]}")
            continue
        print(
            f"  {r['slug']:22} png={r['png_prod']} webp={r['webp_prod']} "
            f"local_webp={r['local_webp']} => {r['action']}"
        )
    print("--- CMC products ---")
    for p in prod_rows:
        print(f"  {p['name']} | sku={p['sku']} | img={p['prod_status']} | {p['image']}")
    print("--- Deploy candidates ---")
    for c in report["deploy_candidates"]:
        print(" ", c)
    print("Report:", out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
