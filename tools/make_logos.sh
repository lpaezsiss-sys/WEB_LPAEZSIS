#!/usr/bin/env bash
# Rebuild LPAEZsis vector logos with potrace + Inkscape.
# Requires: inkscape, potrace, python3, pillow
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo "Logos are generated into: $ROOT/site/img/brand/"
echo "  logo.svg / logo.png          (color)"
echo "  logo-white.svg / logo-white.png"
echo
echo "Manual polish in Inkscape:"
echo "  inkscape $ROOT/site/img/brand/logo.svg"
echo "  inkscape $ROOT/site/img/brand/logo-white.svg"
echo
echo "Tip: Path → Simplify, then File → Export PNG Image for raster fallbacks."
