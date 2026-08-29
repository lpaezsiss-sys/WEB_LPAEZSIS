# Freeze — estado estable LPAEZsis (prueba1 + producción)

**Fecha:** 2026-08-29  
**Tag:** `freeze-prueba1-2026-08-29`  
**Rama inmutable de respaldo:** `cursor/freeze-prueba1-20260829-5af8`  
**Rama de trabajo al momento del freeze:** `main`  
**Commit:** `bcfd6d9`

PRs / entregas recientes incluidas: #53 (hero autoplay), deploy producción www, fix logos/carrusel/tarjetas marcas (`072e98c`, `bcfd6d9`).

Estado verificado al freeze:

| Entorno | Health | PHP | Productos | Marcas |
|---------|--------|-----|-----------|--------|
| Producción `www.lpaezsis.cl` | `db: ok` | 7.4.33 | **19** (9 equipos / 10 repuestos) | **8** |
| Staging `prueba1.lpaezsis.cl` | `db: ok` | 7.4.33 | **19** | **8** |

## Sitios

### Producción
- URL: https://www.lpaezsis.cl/ (redirige desde www → apex según hosting)
- Home: https://www.lpaezsis.cl/
- Marcas: https://www.lpaezsis.cl/marcas.html
- CMC: https://www.lpaezsis.cl/marcas.html?slug=cmc-klebetechnik
- Catálogo: https://www.lpaezsis.cl/catalogo.html?tipo=equipo
- API health: https://www.lpaezsis.cl/api/health → `db: ok`

### Staging (prueba1)
- URL: https://prueba1.lpaezsis.cl/
- Admin: https://prueba1.lpaezsis.cl/admin/
- API health: https://prueba1.lpaezsis.cl/api/health → `db: ok`
- Marcas / Catálogo / Repuestos / Nosotros / Contacto según rutas habituales

## Hosting (BlueHosting)

```text
public_html/src/                         → backend PHP (7.4)
public_html/src/.env                     → MySQL real (no commitear)
public_html/prueba1.lpaezsis.cl/         → front staging (site/)
public_html/lpaezsis.cl/                 → front producción (site/ promovido)
public_html/lpaezsis.cl-wp-backup-20260829/  → respaldo WordPress previo al cutover
```

- BD: `sistem29_lpaezsis`
- Usuario BD: `sistem29_lpaezsis`
- Dump compatible: `data/lpaezsis_bluehosting.sql`
- Uploads: `img/uploads/` (imágenes `p-*`, videos `v-*.mp4`, banners)

## Qué incluye este freeze

### Front (`site/`)
- Home: hero gestionado (`api/banners`, autoplay 5s, `index.js`, `propuesta-home.css`)
- Marcas: logos hero + carrusel con `<picture>`/PNG fallback (`marcas.js?v=131`), tarjetas producto con `resolveEquipImage`
- Assets WebP/PNG de marcas alineados local↔prod (`combi`, `isodur`, Columbia, CMC producto)
- Catálogo cache-bust `catalogo.js?v=131`
- Vista repuestos, nosotros/contacto B2B, carruseles home (destacados / marcas / clientes)

### Backend
- API pública + admin, PHP **7.4**
- Rutas: `/api/health`, `/api/products`, `/api/productos`, `/api/marcas`, `/api/banners`, `/api/clientes`, `/api/soluciones`, `/api/search`, …

### Tools / QA
- `tools/preview_server.py` (preview local + SQLite)
- `tools/verify_marcas_assets.py` + `tools/marcas-assets-diff-report.md`

## Cómo volver a este estado

```bash
git fetch origin
git checkout freeze-prueba1-2026-08-29
# o
git checkout cursor/freeze-prueba1-20260829-5af8
```

ZIP del freeze:

https://github.com/lpaezsiss-sys/WEB_LPAEZSIS/archive/refs/tags/freeze-prueba1-2026-08-29.zip

## Freezes anteriores

| Fecha | Tag | Rama |
|-------|-----|------|
| 2026-08-14 | `freeze-prueba1-2026-08-14` | `cursor/freeze-prueba1-5af8` |
| 2026-08-15 | `freeze-prueba1-2026-08-15` | `cursor/freeze-prueba1-20260815-5af8` |
| 2026-08-16 | `freeze-prueba1-2026-08-16` | `cursor/freeze-prueba1-20260816-5af8` |
| 2026-08-18 | `freeze-prueba1-2026-08-18` | `cursor/freeze-prueba1-20260818-5af8` |
| 2026-08-21 | `freeze-prueba1-2026-08-21` | `cursor/freeze-prueba1-20260821-5af8` |
| 2026-08-25 | `freeze-prueba1-2026-08-25` | `cursor/freeze-prueba1-20260825-5af8` |
| 2026-08-29 | `freeze-prueba1-2026-08-29` | `cursor/freeze-prueba1-20260829-5af8` |

## Notas de seguridad / ops

- No commitear `src/.env` ni claves FTP/cPanel
- Respaldo WP producción: `public_html/lpaezsis.cl-wp-backup-20260829/`
- Rotar claves expuestas en chats cuando sea posible

## Mejoras siguientes (fuera del freeze)

- Limpiar WIP local no mergeado (`site/js/index.js` hero local, `tools/preview_server.py` banners/marcas locales, `site/api/banners.php`)
- Alinear staging prueba1 con el mismo `marcas.js?v=131` si aún no está
- `APP_DEBUG=0` y SEO canónico en dominio final
