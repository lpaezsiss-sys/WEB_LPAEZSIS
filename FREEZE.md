# Freeze — estado estable LPAEZsis (prueba1 + producción)

**Fecha:** 2026-09-13 (post PHP 8.1)  
**Tag:** `freeze-prueba1-2026-09-13-php81`  
**Rama inmutable de respaldo:** `cursor/freeze-prueba1-20260913-php81-5af8`  
**Rama de trabajo al momento del freeze:** `cursor/ops-cleanup-freeze-5af8` (sobre `main` + #61 + cleanup)  
**Commit:** `cc2584a`

PRs / entregas incluidas: **#61** (migración PHP 8.1 Pasos 1–5), **#62** (retirar `logImageError` + bump cache), y entregas previas de marcas/imágenes (#56–#59) ya en producción.

Estado verificado al freeze:

| Entorno | Health | PHP | Productos | Marcas |
|---------|--------|-----|-----------|--------|
| Producción `www.lpaezsis.cl` | `db: ok`, `php81_active: true` | **8.1.34** | **21** (11 equipos / 10 repuestos) | **8** |
| Staging `prueba1.lpaezsis.cl` | `db: ok`, `php81_active: true` | **8.1.34** | **21** | **8** |

## Sitios

### Producción
- URL: https://www.lpaezsis.cl/
- Home: https://www.lpaezsis.cl/
- Marcas: https://www.lpaezsis.cl/marcas.html
- Sonic: https://www.lpaezsis.cl/marcas.html?slug=sonic-air-systems
- Catálogo: https://www.lpaezsis.cl/catalogo.html?tipo=equipo
- API health: https://www.lpaezsis.cl/api/health → `db: ok`, `php: 8.1.34`

### Staging (prueba1)
- URL: https://prueba1.lpaezsis.cl/
- Admin: https://prueba1.lpaezsis.cl/admin/
- API health: https://prueba1.lpaezsis.cl/api/health → `db: ok`, `php: 8.1.34`
- Marcas / Catálogo / Repuestos / Nosotros / Contacto según rutas habituales

## Hosting (BlueHosting)

```text
public_html/src/                         → backend PHP (8.1.34 LiteSpeed)
public_html/src/.env                     → MySQL real (no commitear); APP_DEBUG=0
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
- Marcas: `formatBrandImg` reescribe legacy `wp-content/uploads/...` → `img/products/FILE` (`marcas.js?v=139`)
- `resolveProductWebp` / `preferWebpUrl`: **no inventan** `.webp` bajo `img/uploads/`
- `onerror` → placeholder simple (`img/placeholder.jpg`); **sin** `logImageError`
- Placeholder neutro `img/placeholder.jpg`
- Galería Sonic: Capturas PNG en `img/products/`
- `site.js?v=33` en marcas / catálogo / repuestos / producto
- `Options -MultiViews` en `.htaccess` (evita 406 en rutas pretty `/api/*`)

### Backend (`src/` + `site/api/`)
- PHP **8.1.34** (MultiPHP cutover)
- Null-safety nativas, `Support/Cast`, `ErrorHandler` JSON-safe, PDO endurecido
- `PhpRuntime` meta en `/api/health` (`php81_active`, etc.)
- Auth con `hash_equals`; headers de seguridad en `Response`
- Rutas: health, products/productos, marcas/brands, banners, sectores, industrias, clientes, soluciones, search, repuestos, …

### Tools / QA
- `tools/smoke_api_php81.php` — smoke post-deploy www + prueba1 (OK al freeze)
- `tools/preview_server.py` (preview local + SQLite)
- `tools/verify_marcas_assets.py` + `tools/marcas-assets-diff-report.md`

## Cómo volver a este estado

```bash
git fetch origin
git checkout freeze-prueba1-2026-09-13-php81
# o
git checkout cursor/freeze-prueba1-20260913-php81-5af8
```

ZIP del freeze:

https://github.com/lpaezsiss-sys/WEB_LPAEZSIS/archive/refs/tags/freeze-prueba1-2026-09-13-php81.zip

## Notas de seguridad / ops

- No commitear `src/.env` ni claves FTP/cPanel/WebDAV
- `APP_DEBUG=0` verificado en prod `.env` (2026-09-13)
- **Rotar** claves de cPanel/WebDAV/BD expuestas en chats: cPanel → Preferences → Password & Security (y actualizar secretos del agente)
- Respaldo WP producción: `public_html/lpaezsis.cl-wp-backup-20260829/`

## Mejoras siguientes (fuera del freeze)

- Consolidar `admin.js` git vs prod antes de sobrescribir admin
- SEO canónico en dominio final
- Freeze previo (pre–8.1): `freeze-prueba1-2026-09-13`
