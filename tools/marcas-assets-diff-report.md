# Reporte diferencias logos/imágenes — Marcas (local vs producción)

**Producción:** `https://www.lpaezsis.cl`

## Comprobación CMC Klebetechnik (producción actual)

| Punto | Estado | Detalle |
|---|---|---|
| Header/Hero logo | PASS | Logo CMC visible (`/img/uploads/p-4123e04f38ce02ea.png`) |
| Grilla equipos | PARCIAL | 1 tarjeta: *Cinta Doble Contacto CMC 10730* (SKU en nombre `10730`); **imagen 404 en prod** |
| Carrusel logos | FAIL parcial | Huecos por WebP faltantes (`combi`, `isodur`, `columbia`) → fallback placeholder |
| Consola 404 | FAIL | WebP de marcas + imagen producto CMC |

## Logos de marca

| Slug | PNG prod | WebP prod | WebP local | Acción |
|---|---:|---:|---|---|
| sonic-air-systems | 200 | 200 | True | `OK` |
| columbia-machine | 200 | 404 | True | `DEPLOY_WEBP` |
| lyc | 200 | 200 | True | `OK` |
| cmc-klebetechnik | 200 | 200 | True | `OK` |
| movex | 200 | 200 | True | `OK` |
| isodur | 200 | 404 | True | `DEPLOY_WEBP` |
| combi | 200 | 404 | True | `DEPLOY_WEBP` |
| haida | 200 | 200 | True | `OK` |

## Productos CMC

- **Cinta Doble Contacto CMC 10730** — id/sku `22` — `img/uploads/p-2da9ba1ab72c04ed.webp` → HTTP **404**

## Candidatos a desplegar

- `site/img/brand/combi.webp`
- `site/img/brand/isodur.webp`
- `site/img/uploads/p-2da9ba1ab72c04ed.webp`
- `site/img/uploads/p-57c09a0440925f86.webp`

## Código local listo (aún no desplegado)

- `site/js/marcas.js?v=131`: carrusel/hero con `<picture>` + **PNG/JPG como src** (WebP opcional)
- `site/marcas.html`: cache-bust `marcas.js?v=131`, CSS v=135 / propuesta-marcas v=10
- `site/catalogo.html`: `catalogo.js?v=131`
- `site/index.html`: `propuesta-marcas.css?v=10`
- Script: `python3 tools/verify_marcas_assets.py`
