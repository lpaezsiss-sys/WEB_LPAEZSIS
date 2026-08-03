# WEB_LPAEZSIS

Sitio web comercial de **LPAEZsis** (catálogo, cotización, carrito y admin).

## Estructura

```text
site/                 ← código del sitio (editar aquí)
  index.html
  css/ js/ img/ admin/ api/
tools/
  preview_server.py   ← preview local sin tocar el hosting
  optimize_images.py
```

## Preview local (sin subir al hosting)

Usa el front de `site/` y reenvía `/api` al staging actual `https://lpaezsis.soptec.cl`, así puedes probar catálogo, marcas y formularios sin desplegar.

```bash
python3 tools/preview_server.py
```

Abre [http://127.0.0.1:8765/](http://127.0.0.1:8765/).

Opciones:

```bash
python3 tools/preview_server.py --port 9000
python3 tools/preview_server.py --api https://lpaezsis.soptec.cl
```

## Optimizar imágenes

```bash
python3 tools/optimize_images.py
```

## Notas

- El backend PHP real (`src/`) vive en el servidor; este repo versiona el front en `site/`.
- No subas dumps `.sql` ni zips al repositorio.
- Hosting actual de prueba: https://lpaezsis.soptec.cl/
