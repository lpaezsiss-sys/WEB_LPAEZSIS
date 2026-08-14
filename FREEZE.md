# Freeze — estado estable LPAEZsis (prueba1)

**Fecha:** 2026-08-14  
**Tag:** `freeze-prueba1-2026-08-14`  
**Rama inmutable de respaldo:** `cursor/freeze-prueba1-5af8`  
**Rama de trabajo (sigue):** `cursor/preview-mejoras-5af8`

Estado verificado en hosting al freeze: `/api/health` → `db: ok`, PHP `7.4.33`, **12** productos, **7** marcas.

## Sitio de prueba

- URL: https://prueba1.lpaezsis.cl/
- Admin: https://prueba1.lpaezsis.cl/admin/ (clave del backup: ver `admin_credentials`)
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
- Catálogo, marcas, productos, cotización, carrito, admin
- Logos / favicons (marca completa y mark)
- `marcas.html` lee API (nombre, descripción, logo, `content_html`, productos)
- Admin: edición de marcas con logo + contenido de ficha; picker de imagen acepta `/img/uploads/...`

### Backend (`src/`)
- API pública + admin (Bearer)
- Compatible PHP **7.4** (`polyfills.php`, sin APIs PHP 8)
- `/api/health` reporta php, `.env`, estado MySQL

### Datos / tools
- `data/lpaezsis_bluehosting.sql` (sin collation `uca1400`)
- `data/lpaezsis.sqlite` + `tools/preview_server.py` (preview Cursor)
- `tools/create_db_bluehosting.sh` (UAPI cPanel)
- `tools/import_sql_to_sqlite.py`

### Preview Cursor
- SQLite local: 12 productos, 7 marcas

## Cómo volver a este estado

```bash
git fetch origin
git checkout freeze-prueba1-2026-08-14
# o
git checkout cursor/freeze-prueba1-5af8
```

ZIP del freeze:

https://github.com/lpaezsiss-sys/WEB_LPAEZSIS/archive/refs/tags/freeze-prueba1-2026-08-14.zip

## Mejoras siguientes (fuera del freeze)

- Contenido/galería por marca (editor más cómodo)
- Productos ligados a marcas nuevas (ej. Master Blower)
- Limpieza de `_import_once.php` si aún existe en el docroot
- Rotar claves expuestas en chat (FTP / MySQL) cuando sea posible
- Producción definitiva (dominio final, `APP_DEBUG=0`, HTTPS/SEO)
