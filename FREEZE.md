# Freeze — estado estable LPAEZsis (prueba1)

## Freeze actual (2026-08-15)

**Fecha:** 2026-08-15  
**Tag:** `freeze-prueba1-2026-08-15`  
**Rama inmutable de respaldo:** `cursor/freeze-prueba1-20260815-5af8`  
**Rama de trabajo al momento del freeze:** `cursor/admin-marcas-video-activo-5af8`  
**PR relacionada:** https://github.com/lpaezsiss-sys/WEB_LPAEZSIS/pull/3

Estado verificado en hosting al freeze: `/api/health` → `db: ok`, PHP `7.4.33`, **12** productos, **8** marcas.

### Sitio de prueba

- URL: https://prueba1.lpaezsis.cl/
- Admin: https://prueba1.lpaezsis.cl/admin/
- API health: https://prueba1.lpaezsis.cl/api/health
- Ficha con video de prueba: https://prueba1.lpaezsis.cl/marcas.html?slug=master-blower

### Hosting (BlueHosting)

```text
public_html/src/                         → backend PHP (7.4)
public_html/src/.env                     → MySQL real (no commitear)
public_html/prueba1.lpaezsis.cl/         → front (contenido de site/)
```

- BD: `sistem29_lpaezsis`
- Usuario BD: `sistem29_lpaezsis`
- Dump compatible: `data/lpaezsis_bluehosting.sql`
- Uploads: `prueba1.lpaezsis.cl/img/uploads/` (imágenes `p-*` y videos `v-*.mp4`)

### Qué incluye este freeze (además del freeze 2026-08-14)

#### Admin — ficha de marca (secciones + video)
- Repeater de secciones dinámicas (`+ Agregar Sección`) con título, Quill WYSIWYG, reordenar/eliminar
- Serialización a `<section class="brand-section"><h3>…</h3>…</section>` en `content_html`
- Blot Quill `HTML5Video` (`html5video`) para MP4/WEBM; YouTube/Vimeo con blot `video` nativo
- Diálogo de video: subida local (`kind=video`, máx. 50 MB) o URL; cierre del modal antes de insertar (evita fallos de selección con `<dialog>` anidados)
- Checkbox **Activo** alineado (flex) + sync correcto con `0`/`1` (`coerceBool`)
- Assets admin: `admin.js?v=20`, `admin.css?v=9`

#### Backend upload
- `src/Support/Upload.php` acepta imagen (JPG/PNG/WEBP/GIF ≤5 MB) y video (MP4/WEBM ≤50 MB)
- Prefijos de archivo: `p-…` (imagen), `v-…` (video)

#### Front público
- `marcas.html` + estilos para `.brand-section`, `<video>` e iframes de embed
- Catálogo B2B (`catalogo.js`), SEO home, WebP, cotización con `?sku=`

#### Verificado en Master_Blower
- Video `/img/uploads/v-eae8e092b5a9e129.mp4` visible en admin y en ficha pública

### Cómo volver a este estado

```bash
git fetch origin
git checkout freeze-prueba1-2026-08-15
# o
git checkout cursor/freeze-prueba1-20260815-5af8
```

ZIP del freeze:

https://github.com/lpaezsiss-sys/WEB_LPAEZSIS/archive/refs/tags/freeze-prueba1-2026-08-15.zip

### Notas de seguridad / ops

- No commitear `src/.env` ni claves FTP/cPanel
- Rotar claves expuestas en sesiones previas cuando sea posible
- El freeze **no** sustituye un dump MySQL: respaldar BD por separado en cPanel si hace falta recuperar datos de marcas/uploads

---

## Freeze anterior (2026-08-14) — conservado

**Tag:** `freeze-prueba1-2026-08-14`  
**Rama:** `cursor/freeze-prueba1-5af8`  

ZIP: https://github.com/lpaezsiss-sys/WEB_LPAEZSIS/archive/refs/tags/freeze-prueba1-2026-08-14.zip  

Incluye el baseline post-migración a `site/` + API PHP 7.4 + admin básico de marcas (antes del editor de secciones/video).
