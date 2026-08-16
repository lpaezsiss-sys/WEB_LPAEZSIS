# Freeze — estado estable LPAEZsis (prueba1)

## Freeze actual (2026-08-16)

**Fecha:** 2026-08-16  
**Tag:** `freeze-prueba1-2026-08-16`  
**Rama inmutable de respaldo:** `cursor/freeze-prueba1-20260816-5af8`  
**Rama de trabajo al momento del freeze:** `cursor/admin-soluciones-dinamicas-5af8`  
**PR relacionada:** https://github.com/lpaezsiss-sys/WEB_LPAEZSIS/pull/5  
**Commit:** `db6d60c` (incluye docs de este freeze en el tip de la rama de respaldo)

Estado verificado en hosting al freeze: `/api/health` → `db: ok`, PHP `7.4.33`, **12** productos, **8** marcas, **6** soluciones activas, **8** clientes activos.

### Sitio de prueba

- URL: https://prueba1.lpaezsis.cl/
- Admin: https://prueba1.lpaezsis.cl/admin/
- API health: https://prueba1.lpaezsis.cl/api/health
- Soluciones (API): https://prueba1.lpaezsis.cl/api/soluciones.php
- Clientes (API): https://prueba1.lpaezsis.cl/api/clientes.php
- Marcas: https://prueba1.lpaezsis.cl/marcas.html
- Catálogo: https://prueba1.lpaezsis.cl/catalogo.html

### Hosting (BlueHosting)

```text
public_html/src/                         → backend PHP (7.4)
public_html/src/.env                     → MySQL real (no commitear)
public_html/prueba1.lpaezsis.cl/         → front (contenido de site/)
```

- BD: `sistem29_lpaezsis`
- Usuario BD: `sistem29_lpaezsis`
- Dump compatible: `data/lpaezsis_bluehosting.sql`
- Migraciones: `data/2026-08-15_clientes.sql`, `data/2026-08-16_soluciones.sql`, `data/schema.sql`
- Uploads: `prueba1.lpaezsis.cl/img/uploads/` (imágenes `p-*` y videos `v-*.mp4`)

### Qué incluye este freeze (además del freeze 2026-08-15)

#### Home
- Hero con carrusel 2 slides (`line` / `3piece_cans`), `initHeroCarousel` cada 5s, scrim `rgba(0,0,0,.45)`, sin `.hero-brand`
- Sección `#clientes` dinámica vía `api/clientes.php` + `.client-card`
- Soluciones dinámicas desde `GET /api/soluciones` (tabs 4 cols, panel card)
- CTA secundaria a novedades

#### Admin / API — Clientes
- Tabla `clientes`, CRUD admin, logos PNG/WEBP/SVG/JPG
- API pública plana de activos

#### Admin / API — Soluciones
- Tabla `soluciones` (máx. 8 activos), CRUD admin (`admin.js?v=22`)
- Seed inicial de 6 soluciones
- Front home alimentado por API

#### Catálogo
- Barra `.catalog-filters` con selects unificados
- Product cards con badge flotante Comprar/Cotizar

#### Marcas (ficha pública)
- Hero negro `.brand-hero` + descripción justificada
- Selector compacto `.brand-selector-grid` / `.brand-card-item`
- Layout limpio: hero → logos → equipos (sin título/logo repetidos)
- Assets tipicos: `style.css?v=97`

### Cómo volver a este estado

```bash
git fetch origin
git checkout freeze-prueba1-2026-08-16
# o
git checkout cursor/freeze-prueba1-20260816-5af8
```

ZIP del freeze:

https://github.com/lpaezsiss-sys/WEB_LPAEZSIS/archive/refs/tags/freeze-prueba1-2026-08-16.zip

### Notas de seguridad / ops

- No commitear `src/.env` ni claves FTP/cPanel
- Rotar claves expuestas en sesiones previas cuando sea posible
- El freeze **no** sustituye un dump MySQL: respaldar BD por separado en cPanel si hace falta recuperar `clientes` / `soluciones` / marcas / uploads

---

## Freeze anterior (2026-08-15) — conservado

**Tag:** `freeze-prueba1-2026-08-15`  
**Rama:** `cursor/freeze-prueba1-20260815-5af8`  
**PR:** https://github.com/lpaezsiss-sys/WEB_LPAEZSIS/pull/3  

ZIP: https://github.com/lpaezsiss-sys/WEB_LPAEZSIS/archive/refs/tags/freeze-prueba1-2026-08-15.zip  

Incluye admin de marcas con secciones Quill + video HTML5, upload de video, checkbox Activo corregido.

Estado al freeze: `/api/health` → `db: ok`, PHP `7.4.33`, **12** productos, **8** marcas.

---

## Freeze anterior (2026-08-14) — conservado

**Tag:** `freeze-prueba1-2026-08-14`  
**Rama:** `cursor/freeze-prueba1-5af8`  

ZIP: https://github.com/lpaezsiss-sys/WEB_LPAEZSIS/archive/refs/tags/freeze-prueba1-2026-08-14.zip  

Incluye el baseline post-migración a `site/` + API PHP 7.4 + admin básico de marcas (antes del editor de secciones/video).
