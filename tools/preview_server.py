#!/usr/bin/env python3
"""Local preview for LPAEZsis without deploying to hosting.

Serves the static site from ./site and proxies /api/* to the staging API
so catalog, brands, quotes and contact keep working while you iterate.

Usage:
  python3 tools/preview_server.py
  # then open http://127.0.0.1:8765/
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import sys
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
DEFAULT_API = "https://lpaezsis.soptec.cl"
DEFAULT_PORT = 8765


class PreviewHandler(BaseHTTPRequestHandler):
    api_origin = DEFAULT_API
    site_root = SITE

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def do_OPTIONS(self) -> None:
        if self.path.startswith("/api"):
            self._proxy()
            return
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_HEAD(self) -> None:
        if self.path.startswith("/api"):
            self._proxy()
            return
        self._serve_static(body=False)

    def do_GET(self) -> None:
        if self.path.startswith("/api"):
            self._proxy()
            return
        self._serve_static(body=True)

    def do_POST(self) -> None:
        self._proxy()

    def do_PUT(self) -> None:
        self._proxy()

    def do_DELETE(self) -> None:
        self._proxy()

    def _cors(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

    def _proxy(self) -> None:
        parsed = urlparse(self.path)
        target = self.api_origin.rstrip("/") + parsed.path
        if parsed.query:
            target += "?" + parsed.query

        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length) if length else None

        headers = {
            # Staging sits behind Cloudflare; a normal browser UA avoids Error 1010.
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

    def _serve_static(self, body: bool = True) -> None:
        parsed = urlparse(self.path)
        rel = parsed.path.split("?", 1)[0]
        if rel in ("", "/"):
            rel = "/index.html"
        # Prevent path traversal
        candidate = (self.site_root / rel.lstrip("/")).resolve()
        try:
            candidate.relative_to(self.site_root.resolve())
        except ValueError:
            self.send_error(403, "Forbidden")
            return

        # Directories need a trailing slash so relative CSS/JS resolve under /admin/...
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
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--api", default=os.environ.get("LPAEZ_API", DEFAULT_API))
    parser.add_argument("--site", default=str(SITE))
    args = parser.parse_args()

    site = Path(args.site).resolve()
    if not site.is_dir():
        print("Site folder not found:", site, file=sys.stderr)
        return 1

    PreviewHandler.api_origin = args.api.rstrip("/")
    PreviewHandler.site_root = site

    server = ThreadingHTTPServer(("127.0.0.1", args.port), PreviewHandler)
    print("LPAEZsis preview")
    print("  Site :", site)
    print("  API  :", PreviewHandler.api_origin, "(proxied at /api)")
    print("  URL  : http://127.0.0.1:%d/" % args.port)
    print("Ctrl+C to stop")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
