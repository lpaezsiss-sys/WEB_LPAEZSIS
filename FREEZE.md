# Freeze — estado estable LPAEZsis (prueba1 + producción)

**Fecha:** 2026-09-01  
**Tag:** `freeze-prueba1-2026-09-01`  
**Rama inmutable de respaldo:** `cursor/freeze-prueba1-20260901-5af8`  
**Rama de trabajo al momento del freeze:** `cursor/marcas-img-wp-rewrite-5af8` (sobre `main`)  
**Commit:** `be470cd`

PRs / entregas recientes incluidas: #56 (upload WebP / Upload.php completo), #57 (marcas: rewrite `wp-content` → `img/products`, placeholder neutro, Capturas Sonic), deploy producción www + staging prueba1.

Estado verificado al freeze:

| Entorno | Health | PHP | Productos | Marcas |
|---------|--------|-----|-----------|--------|
| Producción `www.lpaezsis.cl` | `db: ok` | 7.4.33 | **19** (9 equipos / 10 repuestos) | **8** |
| Staging `prueba1.lpaezsis.cl` | `db: ok` | 7.4.33 | **19** | **8** |

## Sitios

### Producción
- URL: https://www.lpaezsis.cl/
- Home: https://www.lpaezsis.cl/
- Marcas: https://www.lpaezsis.cl/marcas.html
- Sonic: https://www.lpaezsis.cl/marcas.html?slug=sonic-air-systems
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
- Uploads: `img/uploads/` (imágenes `p-*`, videos `v-*.mp4`, banners, PDFs)

## Qué incluye este freeze

### Front (`site/`)
- Marcas: `formatBrandImg` reescribe legacy `wp-content/uploads/...` → `img/products/FILE` (`marcas.js?v=136`)
- Productos sin URL usan `Lpaez.resolveProductImage` (mapa slug / fallbacks diversos)
- Placeholder neutro `img/placeholder.jpg` (ya no es foto de impeller)
- Galería Sonic: Capturas PNG en `img/products/`
- `site.js` `normalizeMediaUrl` con la misma reescritura WP (`site.js?v=30` en marcas)
- Home / catálogo / repuestos / nosotros / contacto B2B según entregas previas

### Backend
- API pública + admin, PHP **7.4**
- `Upload.php` completo (`store` / `storePdf` / `storeVideo` / WebP) + ruta prod `img/uploads`
- Rutas: `/api/health`, `/api/products`, `/api/productos`, `/api/marcas`, `/api/brands/{slug}`, `/api/banners`, `/api/clientes`, `/api/soluciones`, `/api/search`, …

### Tools / QA
- `tools/preview_server.py` (preview local + SQLite)
- `tools/verify_marcas_assets.py` + `tools/marcas-assets-diff-report.md`

## Cómo volver a este estado

```bash
git fetch origin
git checkout freeze-prueba1-2026-09-01
# o
git checkout cursor/freeze-prueba1-20260901-5af8
```

ZIP del freeze:

https://github.com/lpaezsiss-sys/WEB_LPAEZSIS/archive/refs/tags/freeze-prueba1-2026-09-01.zip

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
| 2026-09-01 | `freeze-prueba1-2026-09-01` | `cursor/freeze-prueba1-20260901-5af8` |

## Notas de seguridad / ops

- No commitear `src/.env` ni claves FTP/cPanel
- Respaldo WP producción: `public_html/lpaezsis.cl-wp-backup-20260829/`
- Rotar claves expuestas en chats cuando sea posible

## Mejoras siguientes (fuera del freeze)

- Mergear #57 a `main` si aún está en draft
- Consolidar `admin.js` git vs prod (v34/v35 features) antes de sobrescribir admin
- `APP_DEBUG=0` y SEO canónico en dominio final
