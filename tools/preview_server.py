#!/usr/bin/env python3
"""Local preview for LPAEZsis without deploying to hosting.

Serves ./site and answers /api from local SQLite (data/lpaezsis.sqlite)
when available. Falls back to proxying a remote API otherwise.

Usage:
  python3 tools/preview_server.py
  # open http://127.0.0.1:8765/
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import re
import secrets
import sqlite3
import sys
import time
import urllib.error
import urllib.request
from email import policy
from email.parser import BytesParser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
DEFAULT_DB = ROOT / "data" / "lpaezsis.sqlite"
DEFAULT_API = "https://lpaezsis.soptec.cl"
DEFAULT_PORT = 8765

# Ensure local static serving recognizes WebP.
mimetypes.add_type("image/webp", ".webp")

# In-memory admin sessions for local preview only.
_LOCAL_SESSIONS: dict[str, float] = {}

_ALLOWED_UPLOAD_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
}
_ALLOWED_UPLOAD_EXTS = {"jpg", "jpeg", "png", "webp", "gif"}
_EXT_TO_MIME = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "webp": "image/webp",
    "gif": "image/gif",
}


def _row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    return {k: row[k] for k in row.keys()}


class PreviewHandler(BaseHTTPRequestHandler):
    api_origin = DEFAULT_API
    site_root = SITE
    db_path: Path | None = None
    use_local_api = False

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def do_OPTIONS(self) -> None:
        if self.path.startswith("/api"):
            self._handle_api()
            return
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_HEAD(self) -> None:
        if self.path.startswith("/api"):
            self._handle_api()
            return
        self._serve_static(body=False)

    def do_GET(self) -> None:
        if self.path.startswith("/api"):
            self._handle_api()
            return
        self._serve_static(body=True)

    def do_POST(self) -> None:
        self._handle_api()

    def do_PUT(self) -> None:
        self._handle_api()

    def do_DELETE(self) -> None:
        self._handle_api()

    def _cors(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

    def _handle_api(self) -> None:
        if self.command == "OPTIONS":
            self.send_response(204)
            self._cors()
            self.end_headers()
            return
        if self.use_local_api and self.db_path and self.db_path.is_file():
            self._local_api()
            return
        self._proxy()

    def _json(self, status: int, payload: Any) -> None:
        data = json.dumps(payload, ensure_ascii=False, default=str).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self._cors()
        self.send_header("X-Preview-Local-Api", "1")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(data)

    def _read_json_body(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        try:
            data = json.loads(raw.decode("utf-8"))
            return data if isinstance(data, dict) else {}
        except Exception:
            return {}

    def _db(self) -> sqlite3.Connection:
        assert self.db_path is not None
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn

    def _local_api(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"
        # Normalize /api/index.php/... style
        if path.startswith("/api/index.php"):
            path = "/api" + path[len("/api/index.php") :]
            if path == "/api":
                path = "/api/"
        qs = parse_qs(parsed.query)
        if "__path" in qs and qs["__path"]:
            path = qs["__path"][0]

        try:
            if path in ("/api/health", "/api"):
                self._json(200, {"ok": True, "mode": "local-sqlite"})
                return
            if path == "/api/settings" and self.command == "GET":
                with self._db() as conn:
                    row = conn.execute("SELECT * FROM site_settings LIMIT 1").fetchone()
                self._json(200, _row_to_dict(row) if row else {})
                return
            if path == "/api/categories" and self.command == "GET":
                with self._db() as conn:
                    rows = conn.execute(
                        """
                        SELECT * FROM categories
                        WHERE COALESCE(is_active, 1) = 1
                        ORDER BY COALESCE(sort_order, 0), name
                        """
                    ).fetchall()
                self._json(200, {"categories": [_row_to_dict(r) for r in rows]})
                return
            if path == "/api/brands" and self.command == "GET":
                with self._db() as conn:
                    rows = conn.execute(
                        """
                        SELECT id, slug, name, description, logo_url, website_url,
                               sort_order, is_active, created_at
                        FROM brands
                        WHERE COALESCE(is_active, 1) = 1
                        ORDER BY COALESCE(sort_order, 0), name
                        """
                    ).fetchall()
                self._json(200, {"brands": [_row_to_dict(r) for r in rows]})
                return
            if path.startswith("/api/brands/") and self.command == "GET":
                slug = path.split("/api/brands/", 1)[1].strip("/")
                with self._db() as conn:
                    row = conn.execute(
                        """
                        SELECT *
                        FROM brands
                        WHERE slug = ? AND COALESCE(is_active, 1) = 1
                        LIMIT 1
                        """,
                        (slug,),
                    ).fetchone()
                    if not row:
                        self._json(404, {"error": "Marca no encontrada"})
                        return
                    brand = _row_to_dict(row)
                    gallery = []
                    raw_gallery = brand.pop("gallery_json", None)
                    if raw_gallery:
                        try:
                            parsed = json.loads(raw_gallery)
                            if isinstance(parsed, list):
                                gallery = [str(u) for u in parsed if u]
                        except Exception:
                            gallery = []
                    brand["gallery"] = gallery
                    products = conn.execute(
                        """
                        SELECT p.*,
                               c.slug AS category_slug,
                               c.name AS category_name,
                               b.slug AS brand_slug,
                               b.name AS brand_name
                        FROM products p
                        LEFT JOIN categories c ON c.id = p.category_id
                        LEFT JOIN brands b ON b.id = p.brand_id
                        WHERE p.brand_id = ? AND COALESCE(p.is_active, 1) = 1
                        ORDER BY COALESCE(p.sort_order, 0), p.name
                        """,
                        (brand["id"],),
                    ).fetchall()
                self._json(
                    200,
                    {
                        "brand": brand,
                        "products": [_row_to_dict(p) for p in products],
                    },
                )
                return
            if path == "/api/products" and self.command == "GET":
                with self._db() as conn:
                    rows = conn.execute(
                        """
                        SELECT p.*,
                               c.slug AS category_slug,
                               c.name AS category_name,
                               b.slug AS brand_slug,
                               b.name AS brand_name
                        FROM products p
                        LEFT JOIN categories c ON c.id = p.category_id
                        LEFT JOIN brands b ON b.id = p.brand_id
                        WHERE COALESCE(p.is_active, 1) = 1
                        ORDER BY COALESCE(p.sort_order, 0), p.name
                        """
                    ).fetchall()
                self._json(200, {"products": [_row_to_dict(r) for r in rows]})
                return
            if path.startswith("/api/products/") and self.command == "GET":
                slug = path.split("/api/products/", 1)[1].strip("/")
                with self._db() as conn:
                    row = conn.execute(
                        """
                        SELECT p.*,
                               c.slug AS category_slug,
                               c.name AS category_name,
                               b.slug AS brand_slug,
                               b.name AS brand_name
                        FROM products p
                        LEFT JOIN categories c ON c.id = p.category_id
                        LEFT JOIN brands b ON b.id = p.brand_id
                        WHERE p.slug = ? AND COALESCE(p.is_active, 1) = 1
                        LIMIT 1
                        """,
                        (slug,),
                    ).fetchone()
                if not row:
                    self._json(404, {"error": "Producto no encontrado"})
                    return
                self._json(200, _row_to_dict(row))
                return
            if path == "/api/contact" and self.command == "POST":
                self._json(200, {"message": "Mensaje recibido (modo preview local)."})
                return
            if path == "/api/quotes" and self.command == "POST":
                code = "Q" + secrets.token_hex(3).upper()
                self._json(200, {"public_code": code, "message": "Cotización recibida (preview)."})
                return
            if path == "/api/orders" and self.command == "POST":
                code = "O" + secrets.token_hex(3).upper()
                self._json(200, {"public_code": code, "message": "Pedido recibido (preview)."})
                return
            if path == "/api/admin/login" and self.command == "POST":
                body = self._read_json_body()
                password = str(body.get("password") or "")
                ok = False
                try:
                    import bcrypt  # type: ignore

                    with self._db() as conn:
                        row = conn.execute(
                            "SELECT password_hash FROM admin_credentials WHERE id=1"
                        ).fetchone()
                    if row and row["password_hash"]:
                        ok = bcrypt.checkpw(
                            password.encode("utf-8"),
                            str(row["password_hash"]).encode("utf-8"),
                        )
                except Exception as exc:  # noqa: BLE001
                    self._json(500, {"error": "Login local no disponible", "detail": str(exc)})
                    return
                if not ok:
                    self._json(401, {"error": "Contraseña incorrecta"})
                    return
                token = secrets.token_hex(32)
                _LOCAL_SESSIONS[token] = time.time() + 12 * 3600
                self._json(200, {"token": token})
                return
            if path.startswith("/api/admin"):
                auth = self.headers.get("Authorization") or ""
                token = auth.replace("Bearer", "").strip()
                exp = _LOCAL_SESSIONS.get(token)
                if not exp or exp < time.time():
                    self._json(401, {"error": "No autorizado"})
                    return
                # Minimal admin reads for preview
                if path == "/api/admin/products" and self.command == "GET":
                    with self._db() as conn:
                        rows = conn.execute(
                            """
                            SELECT p.*, c.slug AS category_slug, c.name AS category_name,
                                   b.slug AS brand_slug, b.name AS brand_name
                            FROM products p
                            LEFT JOIN categories c ON c.id = p.category_id
                            LEFT JOIN brands b ON b.id = p.brand_id
                            ORDER BY COALESCE(p.sort_order, 0), p.name
                            """
                        ).fetchall()
                    self._json(200, {"products": [_row_to_dict(r) for r in rows]})
                    return
                if path == "/api/admin/upload" and self.command == "POST":
                    self._handle_admin_upload()
                    return
                self._json(
                    501,
                    {
                        "error": "Escritura admin no implementada en preview local",
                        "hint": "El catálogo público sí funciona con SQLite local",
                    },
                )
                return

            self._json(404, {"error": "Ruta API no encontrada", "path": path})
        except Exception as exc:  # noqa: BLE001
            self._json(500, {"error": "Error API local", "detail": str(exc)})

    def _proxy(self) -> None:
        parsed = urlparse(self.path)
        target = self.api_origin.rstrip("/") + parsed.path
        if parsed.query:
            target += "?" + parsed.query

        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length) if length else None

        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/126.0.0.0 Safari/537.36"
            ),
            "Accept": "application/json, text/plain, */*",
        }
        for key in ("Content-Type", "Authorization", "Accept"):
            val = self.headers.get(key)
            if val:
                headers[key] = val

        req = urllib.request.Request(
            target,
            data=body,
            headers=headers,
            method=self.command,
        )
        try:
            with urllib.request.urlopen(req, timeout=45) as res:
                data = res.read()
                self.send_response(res.status)
                ctype = res.headers.get("Content-Type", "application/json")
                self.send_header("Content-Type", ctype)
                self.send_header("Content-Length", str(len(data)))
                self._cors()
                self.send_header("X-Preview-Proxy", "1")
                self.end_headers()
                if self.command != "HEAD":
                    self.wfile.write(data)
        except urllib.error.HTTPError as err:
            data = err.read()
            self.send_response(err.code)
            self.send_header(
                "Content-Type", err.headers.get("Content-Type", "application/json")
            )
            self.send_header("Content-Length", str(len(data)))
            self._cors()
            self.send_header("X-Preview-Proxy", "1")
            self.end_headers()
            self.wfile.write(data)
        except Exception as exc:  # noqa: BLE001
            payload = json.dumps(
                {
                    "error": "Preview proxy failed",
                    "detail": str(exc),
                    "target": target,
                }
            ).encode("utf-8")
            self.send_response(502)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self._cors()
            self.end_headers()
            self.wfile.write(payload)

    def _handle_admin_upload(self) -> None:
        """Save admin image uploads to site/img/uploads/ (JPG/PNG/WEBP/GIF)."""
        ctype = self.headers.get("Content-Type") or ""
        if "multipart/form-data" not in ctype.lower():
            self._json(400, {"error": "Se espera multipart/form-data"})
            return
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0:
            self._json(400, {"error": "Archivo requerido"})
            return
        if length > 5 * 1024 * 1024 + 64 * 1024:
            self._json(400, {"error": "La imagen supera 5 MB"})
            return
        raw = self.rfile.read(length)
        try:
            msg = BytesParser(policy=policy.default).parsebytes(
                b"Content-Type: " + ctype.encode("utf-8", "replace") + b"\r\n\r\n" + raw
            )
        except Exception as exc:  # noqa: BLE001
            self._json(400, {"error": "No se pudo leer el archivo", "detail": str(exc)})
            return

        file_part = None
        for part in msg.iter_parts():
            cd = part.get("Content-Disposition", "")
            name_m = re.search(r'name="([^"]+)"', cd or "")
            field = (name_m.group(1) if name_m else "") or ""
            filename = part.get_filename() or ""
            if field in ("file", "image") or filename:
                file_part = part
                break
        if file_part is None:
            self._json(400, {"error": "Archivo requerido"})
            return

        filename = file_part.get_filename() or "upload.bin"
        client_ext = Path(filename).suffix.lower().lstrip(".")
        payload = file_part.get_payload(decode=True) or b""
        if not payload:
            self._json(400, {"error": "Archivo vacío"})
            return
        if len(payload) > 5 * 1024 * 1024:
            self._json(400, {"error": "La imagen supera 5 MB"})
            return

        part_mime = (file_part.get_content_type() or "").lower()
        if part_mime in ("", "application/octet-stream"):
            part_mime = _EXT_TO_MIME.get(client_ext, part_mime)
        if part_mime not in _ALLOWED_UPLOAD_TYPES:
            if client_ext not in _ALLOWED_UPLOAD_EXTS:
                self._json(400, {"error": "Solo se permiten JPG, PNG, WEBP o GIF"})
                return
            part_mime = _EXT_TO_MIME[client_ext]
        if client_ext and client_ext not in _ALLOWED_UPLOAD_EXTS:
            self._json(400, {"error": "Extensión no permitida. Use jpg, png, webp o gif."})
            return

        ext = _ALLOWED_UPLOAD_TYPES[part_mime]
        if client_ext in _ALLOWED_UPLOAD_EXTS and _EXT_TO_MIME.get(client_ext) == part_mime:
            ext = "jpg" if client_ext == "jpeg" else client_ext

        upload_dir = self.site_root / "img" / "uploads"
        upload_dir.mkdir(parents=True, exist_ok=True)
        name = "p-" + secrets.token_hex(8) + "." + ext
        dest = upload_dir / name
        dest.write_bytes(payload)
        self._json(200, {"url": "/img/uploads/" + name})

    def _serve_static(self, body: bool = True) -> None:
        parsed = urlparse(self.path)
        rel = parsed.path.split("?", 1)[0]
        if rel in ("", "/"):
            rel = "/index.html"
        candidate = (self.site_root / rel.lstrip("/")).resolve()
        try:
            candidate.relative_to(self.site_root.resolve())
        except ValueError:
            self.send_error(403, "Forbidden")
            return

        if candidate.is_dir() and not rel.endswith("/"):
            target = rel + "/"
            if parsed.query:
                target += "?" + parsed.query
            self.send_response(301)
            self.send_header("Location", target)
            self.end_headers()
            return

        if candidate.is_dir():
            candidate = candidate / "index.html"
        if not candidate.is_file():
            self.send_error(404, "Not found")
            return

        data = candidate.read_bytes()
        ctype = mimetypes.guess_type(str(candidate))[0] or "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        if body:
            self.wfile.write(data)


def main() -> int:
    parser = argparse.ArgumentParser(description="LPAEZsis local preview server")
    parser.add_argument("--host", default=os.environ.get("LPAEZ_PREVIEW_HOST", "0.0.0.0"))
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--api", default=os.environ.get("LPAEZ_API", DEFAULT_API))
    parser.add_argument("--site", default=str(SITE))
    parser.add_argument("--db", default=os.environ.get("LPAEZ_DB", str(DEFAULT_DB)))
    parser.add_argument(
        "--remote-api",
        action="store_true",
        help="Force proxy to remote API even if local SQLite exists",
    )
    args = parser.parse_args()

    site = Path(args.site).resolve()
    if not site.is_dir():
        print("Site folder not found:", site, file=sys.stderr)
        return 1

    db_path = Path(args.db).resolve()
    use_local = (not args.remote_api) and db_path.is_file()

    PreviewHandler.api_origin = args.api.rstrip("/")
    PreviewHandler.site_root = site
    PreviewHandler.db_path = db_path
    PreviewHandler.use_local_api = use_local

    server = ThreadingHTTPServer((args.host, args.port), PreviewHandler)
    print("LPAEZsis preview")
    print("  Site :", site)
    if use_local:
        print("  API  : local SQLite", db_path)
    else:
        print("  API  :", PreviewHandler.api_origin, "(proxied at /api)")
        if not db_path.is_file():
            print("  Note : no local DB at", db_path)
            print("         run: python3 tools/import_sql_to_sqlite.py")
    print("  Bind :", "%s:%d" % (args.host, args.port))
    print("  URL  : http://127.0.0.1:%d/" % args.port)
    print("Ctrl+C to stop")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
