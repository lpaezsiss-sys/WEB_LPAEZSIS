# WEB_LPAEZSIS

Sitio web comercial de **LPAEZsis** (catálogo, cotización, carrito y admin).

## Estructura

```text
site/                 ← front (HTML/CSS/JS) + api/index.php
src/                  ← backend PHP (API + admin)
data/                 ← dump SQL + SQLite para preview en Cursor
tools/
  preview_server.py   ← preview local con SQLite
  import_sql_to_sqlite.py
```

## Preview local en Cursor (sin MySQL)

```bash
python3 tools/import_sql_to_sqlite.py   # si hace falta regenerar
python3 tools/preview_server.py
```

Abre http://127.0.0.1:8765/ — el preview usa SQLite y no necesita `src/` PHP.

## Subir a BlueHosting (`prueba1.lpaezsis.cl`)

### 1. Front
Sube el **contenido** de `site/` a:

`public_html/prueba1.lpaezsis.cl/`

### 2. Backend PHP
Sube la carpeta **`src/`** completa a:

`public_html/src/`

Debe existir: `public_html/src/bootstrap.php`

### 3. Base de datos
1. Crea una BD MySQL en cPanel.
2. Importa `data/lpaezsis_backup_final.sql` con phpMyAdmin.
3. Copia `src/.env.example` → `src/.env` y completa:

```env
DB_HOST=localhost
DB_NAME=nombre_bd
DB_USER=usuario_bd
DB_PASS=clave_bd
UPLOAD_DIR=/home/TU_USUARIO/public_html/prueba1.lpaezsis.cl/img/uploads
UPLOAD_URL_PREFIX=/img/uploads
```

### 4. Probar
- https://prueba1.lpaezsis.cl/api/health
- https://prueba1.lpaezsis.cl/catalogo.html
- https://prueba1.lpaezsis.cl/marcas.html
- https://prueba1.lpaezsis.cl/admin/

La contraseña admin es la del hash guardado en la tabla `admin_credentials` (la misma del backup).

## Notas

- No subas `.env` con claves al repositorio público.
- El preview de Cursor sigue usando SQLite; BlueHosting usa MySQL + `src/`.
