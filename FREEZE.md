# Freeze — estado estable LPAEZsis (prueba1)

**Fecha:** 2026-08-21  
**Tag:** `freeze-prueba1-2026-08-21`  
**Rama inmutable de respaldo:** `cursor/freeze-prueba1-20260821-5af8`  
**Rama de trabajo al momento del freeze:** `cursor/catalogo-image-url-5af8`  
**Commit:** `8e8753f` (tip de la rama de respaldo / tag anotado)  
**PR relacionada (imágenes catálogo):** https://github.com/lpaezsiss-sys/WEB_LPAEZSIS/pull/19

Estado verificado en hosting al freeze: `/api/health` → `db: ok`, PHP `7.4.33`, **19** productos (9 equipos / 10 repuestos), **8** marcas, **8** clientes, **5** soluciones activas.

Snapshot front: archivos de `https://prueba1.lpaezsis.cl/` sincronizados a `site/` (HTML/CSS/JS + `img/uploads`).

## Sitio de prueba

- URL: https://prueba1.lpaezsis.cl/
- Admin: https://prueba1.lpaezsis.cl/admin/
- API health: https://prueba1.lpaezsis.cl/api/health → `db: ok`, PHP `7.4.33`
- Catálogo equipos: https://prueba1.lpaezsis.cl/catalogo.html?tipo=equipo
- Marcas: https://prueba1.lpaezsis.cl/marcas.html
- Clientes (API): https://prueba1.lpaezsis.cl/api/clientes
- Soluciones (API): https://prueba1.lpaezsis.cl/api/soluciones
- Search (API): https://prueba1.lpaezsis.cl/api/search?q=sonic

## Hosting (BlueHosting)

```text
public_html/src/                         → backend PHP (7.4)
public_html/src/.env                     → MySQL real (no commitear)
public_html/prueba1.lpaezsis.cl/         → front (contenido de site/)
```

- BD: `sistem29_lpaezsis`
- Usuario BD: `sistem29_lpaezsis`
- Dump compatible: `data/lpaezsis_bluehosting.sql`
- Uploads: `prueba1.lpaezsis.cl/img/uploads/` (imágenes `p-*` y videos `v-*.mp4`)

## Qué incluye este freeze

### Front (`site/`) — snapshot staging 2026-08-21
- Home con propuesta marcas/clientes (`propuesta-home.css`, `propuesta-marcas.css`)
- Buscador predictivo de header (`layout.js` + `propuesta-search.js` / `.css` + `GET /api/search`)
- Catálogo Equipos / Repuestos (`?tipo=equipo|repuesto`)
- Fix imágenes catálogo: `catalogo.js` consume `image_url` (`/img/uploads/...`), sin inventar `.webp` roto; `onerror` → `/img/productos/{slug}.jpg`
- `site.js` `productCardHtml` con el mismo fallback de imagen (marcas)
- Cache bust al freeze: `catalogo.js?v=15`, `site.js?v=26`
- Marcas: `marcas.js` + plantilla; secciones Equipos / Repuestos
- Columbia Machine: fotos reales en uploads (FL3000, HL7200, Ai1800, FL1000-SW)
- Assets tipicos staging: `style.css`, hero `img/hero-bg.jpg`, `img/placeholder-logo.png`

### Backend (`src/` en repo)
- API pública + admin (Bearer), PHP **7.4**
- Rutas relevantes en staging: `/api/products`, `/api/productos.php`, `/api/marcas`, `/api/clientes`, `/api/soluciones`, `/api/search`, `/api/health`

### Datos / tools
- `data/lpaezsis_bluehosting.sql` (sin collation `uca1400`)
- `data/lpaezsis.sqlite` + `tools/preview_server.py` (preview Cursor)
- `tools/create_db_bluehosting.sh` (UAPI cPanel)

## Cómo volver a este estado

```bash
git fetch origin
git checkout freeze-prueba1-2026-08-21
# o
git checkout cursor/freeze-prueba1-20260821-5af8
```

ZIP del freeze:

https://github.com/lpaezsiss-sys/WEB_LPAEZSIS/archive/refs/tags/freeze-prueba1-2026-08-21.zip

## Freezes anteriores

| Fecha | Tag | Rama |
|-------|-----|------|
| 2026-08-14 | `freeze-prueba1-2026-08-14` | `cursor/freeze-prueba1-5af8` |
| 2026-08-15 | `freeze-prueba1-2026-08-15` | `cursor/freeze-prueba1-20260815-5af8` |
| 2026-08-16 | `freeze-prueba1-2026-08-16` | `cursor/freeze-prueba1-20260816-5af8` |
| 2026-08-18 | `freeze-prueba1-2026-08-18` | `cursor/freeze-prueba1-20260818-5af8` |
| 2026-08-21 | `freeze-prueba1-2026-08-21` | `cursor/freeze-prueba1-20260821-5af8` |

## Notas de seguridad / ops

- No commitear `src/.env` ni claves FTP/cPanel
- El directorio `admin/` y `api/` del docroot no se re-sincronizaron en este snapshot (siguen en repo / hosting); el front público sí

## Mejoras siguientes (fuera del freeze)

- Merge a `main` de PRs abiertos (imágenes catálogo, search header, home marcas/clientes)
- Alinear versiones de cache (`style.css` / `layout.js`) entre páginas
- Producción definitiva (dominio final, `APP_DEBUG=0`, HTTPS/SEO)
