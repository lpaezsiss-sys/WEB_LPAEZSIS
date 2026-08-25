# Freeze — estado estable LPAEZsis (prueba1)

**Fecha:** 2026-08-25  
**Tag:** `freeze-prueba1-2026-08-25`  
**Rama inmutable de respaldo:** `cursor/freeze-prueba1-20260825-5af8`  
**Rama de trabajo al momento del freeze:** `cursor/destacados-carrusel-5af8`  
**Commit:** *(ver tip de rama/tag tras el push)*  
**PRs recientes incluidas en staging:** #28–#32 (cards CTAs, nosotros/contacto, home B2B, logos carrusel, destacados carrusel)

Estado verificado en hosting al freeze: `/api/health` → `db: ok`, PHP `7.4.33`, **19** productos (9 equipos / 10 repuestos), **8** marcas, **8** clientes, **5** soluciones activas.

Snapshot front: archivos de `https://prueba1.lpaezsis.cl/` sincronizados a `site/` (HTML/CSS/JS + `img/uploads` imágenes; videos grandes ya presentes se reutilizan).

## Sitio de prueba

- URL: https://prueba1.lpaezsis.cl/
- Admin: https://prueba1.lpaezsis.cl/admin/
- API health: https://prueba1.lpaezsis.cl/api/health → `db: ok`, PHP `7.4.33`
- Home: https://prueba1.lpaezsis.cl/
- Catálogo equipos: https://prueba1.lpaezsis.cl/catalogo.html?tipo=equipo
- Repuestos: https://prueba1.lpaezsis.cl/repuestos.html
- Nosotros / Contacto (B2B): https://prueba1.lpaezsis.cl/nosotros.html · https://prueba1.lpaezsis.cl/contacto.html
- Marcas: https://prueba1.lpaezsis.cl/marcas.html
- Clientes (API): https://prueba1.lpaezsis.cl/api/clientes
- Soluciones (API): https://prueba1.lpaezsis.cl/api/soluciones

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

### Front (`site/`) — snapshot staging 2026-08-25
- Home B2B: hero kicker/H1/CTAs, soluciones con filtros limpios `category=secado|soplado|limpieza|packaging`
- Carruseles logos: `section-brands` / `section-clients` (`propuesta-marcas.css`)
- Productos destacados: carrusel deslizable 3/2/1 (`featured-carousel.css`, `js/index.js`)
- Nosotros B2B (slogan, ficha sin headcount, CTA evaluación) + Contacto B2B (SLA, tel etiquetados, Ley 19.628, `contacto.js`)
- Catálogo con aliases de categoría + botones de card alineados al fondo
- Vista `repuestos.html` + `js/repuestos.js` + nav Productos | Repuestos | …
- Search header / propuesta CSS-JS según staging
- Cache típica al freeze: `style.css?v=128`, `layout.js?v=39`, `featured-carousel.css?v=3`, `propuesta-marcas.css?v=6`

### Backend (`src/` en repo + `site/api/*.php` planos)
- API pública + admin (Bearer), PHP **7.4**
- Rutas staging: `/api/products`, `/api/productos`, `/api/repuestos`, `/api/marcas`, `/api/clientes`, `/api/soluciones`, `/api/search`, `/api/health`

### Datos / tools
- `data/lpaezsis_bluehosting.sql` (sin collation `uca1400`)
- `data/lpaezsis.sqlite` + `tools/preview_server.py` (preview Cursor)
- `tools/create_db_bluehosting.sh` (UAPI cPanel)

## Cómo volver a este estado

```bash
git fetch origin
git checkout freeze-prueba1-2026-08-25
# o
git checkout cursor/freeze-prueba1-20260825-5af8
```

ZIP del freeze:

https://github.com/lpaezsiss-sys/WEB_LPAEZSIS/archive/refs/tags/freeze-prueba1-2026-08-25.zip

## Freezes anteriores

| Fecha | Tag | Rama |
|-------|-----|------|
| 2026-08-14 | `freeze-prueba1-2026-08-14` | `cursor/freeze-prueba1-5af8` |
| 2026-08-15 | `freeze-prueba1-2026-08-15` | `cursor/freeze-prueba1-20260815-5af8` |
| 2026-08-16 | `freeze-prueba1-2026-08-16` | `cursor/freeze-prueba1-20260816-5af8` |
| 2026-08-18 | `freeze-prueba1-2026-08-18` | `cursor/freeze-prueba1-20260818-5af8` |
| 2026-08-21 | `freeze-prueba1-2026-08-21` | `cursor/freeze-prueba1-20260821-5af8` |
| 2026-08-25 | `freeze-prueba1-2026-08-25` | `cursor/freeze-prueba1-20260825-5af8` |

## Notas de seguridad / ops

- No commitear `src/.env` ni claves FTP/cPanel
- No re-subir a staging un `PublicApi.php` incompleto desde `main` desactualizado
- Rotar claves expuestas en chats cuando sea posible

## Mejoras siguientes (fuera del freeze)

- Merge a `main` de PRs abiertos (#28–#32 y anteriores)
- Alinear cache-bust de `style.css` / `layout.js` en todas las páginas
- Producción definitiva (dominio final, `APP_DEBUG=0`, HTTPS/SEO)
