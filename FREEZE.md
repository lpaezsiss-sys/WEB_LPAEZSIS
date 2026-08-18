# Freeze — estado estable LPAEZsis (prueba1)

**Fecha:** 2026-08-18  
**Tag:** `freeze-prueba1-2026-08-18`  
**Rama inmutable de respaldo:** `cursor/freeze-prueba1-20260818-5af8`  
**Rama de trabajo (sigue):** `cursor/marcas-formatos-css-5af8`

Estado verificado en hosting al freeze: `/api/health` → `db: ok`, PHP `7.4.33`, **12** productos (2 equipos / 10 repuestos), **7** marcas activas.

## Sitio de prueba

- URL: https://prueba1.lpaezsis.cl/
- Admin: https://prueba1.lpaezsis.cl/admin/
- API health: https://prueba1.lpaezsis.cl/api/health → `db: ok`, PHP `7.4.33`

## Hosting (BlueHosting)

```text
public_html/src/                         → backend PHP (7.4)
public_html/src/.env                     → MySQL real (no commitear)
public_html/prueba1.lpaezsis.cl/         → front (contenido de site/)
```

- BD: `sistem29_lpaezsis`
- Usuario BD: `sistem29_lpaezsis`
- Dump compatible: `data/lpaezsis_bluehosting.sql`
- Uploads: `prueba1.lpaezsis.cl/img/uploads/`

## Qué incluye este freeze

### Front (`site/`)
- Home con hero restaurado (`.hero-banner` + `img/hero-bg.jpg`)
- Catálogo Equipos / Repuestos (`?tipo=equipo|repuesto`) con CTAs diferenciados
- `nosotros.html`: hero en español, `company-card`, CTA equipos/repuestos
- `marcas.html`: plantilla estática + `js/marcas.js` (datos aislados del maquetado)
- Marcas: secciones separadas **Equipos** / **Repuestos y Consumibles** con contadores
- APIs planas: `api/marcas.php`, `api/productos.php?brand=`, `api/industrias.php` (stub en repo)
- CSS blindado de marcas (hero oscuro + selector grid)

### Backend (`src/`)
- API pública + admin (Bearer)
- Compatible PHP **7.4** (`polyfills.php`)
- `GET /api/marcas`, `GET /api/productos?brand=`, filtro `products.tipo` / `?brand=`
- `/api/health` reporta php, `.env`, estado MySQL

### Datos / tools
- `data/lpaezsis_bluehosting.sql` (sin collation `uca1400`)
- `data/lpaezsis.sqlite` + `tools/preview_server.py` (preview Cursor)
- `tools/create_db_bluehosting.sh` (UAPI cPanel)

## Cómo volver a este estado

```bash
git fetch origin
git checkout freeze-prueba1-2026-08-18
# o
git checkout cursor/freeze-prueba1-20260818-5af8
```

ZIP del freeze:

https://github.com/lpaezsiss-sys/WEB_LPAEZSIS/archive/refs/tags/freeze-prueba1-2026-08-18.zip

## Freezes anteriores

| Fecha | Tag | Rama |
|-------|-----|------|
| 2026-08-14 | `freeze-prueba1-2026-08-14` | `cursor/freeze-prueba1-5af8` |
| 2026-08-15 | `freeze-prueba1-2026-08-15` | `cursor/freeze-prueba1-20260815-5af8` |
| 2026-08-16 | `freeze-prueba1-2026-08-16` | `cursor/freeze-prueba1-20260816-5af8` |
| 2026-08-18 | `freeze-prueba1-2026-08-18` | `cursor/freeze-prueba1-20260818-5af8` |

## Mejoras siguientes (fuera del freeze)

- Alinear caché staging (`style.css` / `marcas.js`) con este tag
- Restaurar ruta `/api/industrias` en PublicApi si falta en el backend desplegado
- Pulir primera vista de marcas (hero/selector vs ficha Quill/galería)
- Producción definitiva (dominio final, `APP_DEBUG=0`, HTTPS/SEO)
