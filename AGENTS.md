# WEB_LPAEZSIS

Frontend estático (HTML/CSS/JS vanilla) del sitio comercial LPAEZsis. Ver `README.md` para estructura y comandos.

## Cursor Cloud specific instructions

- This repo only versions the static frontend in `site/`. The real PHP backend (`src/`) is NOT in this repo; it lives on the hosting server.
- Local dev is served by `tools/preview_server.py` (Python 3 stdlib only — no packages to install). Run it with `python3 tools/preview_server.py`, then open `http://127.0.0.1:8765/`. It binds to `127.0.0.1` only.
- The preview server proxies `/api/*` to the remote staging backend `https://lpaezsis.soptec.cl` by default, so catalog, brands, products, quotes and contact work without a local backend. Override with `--api <url>` or the `LPAEZ_API` env var. Dynamic data therefore requires outbound network access to that host; the site shell still loads if the API is down (sections just show empty/fallback state).
- There is no build step, no bundler, and no lint/test tooling in this repo. "Build" = the static files as-is; "run" = the preview server above.
- Cart and quote state live in browser `localStorage` (`lpaezsis_cart_v1`, `lpaezsis_quote_v1`); the admin token lives in `sessionStorage` (`lpaezsis_admin_token`). The admin UI at `/admin/` needs a valid backend admin password (configured on the hosted backend), so it cannot be fully exercised without those credentials.
- `tools/optimize_images.py` needs Pillow (`pip install pillow`) and is optional maintenance tooling, not part of running the site.
