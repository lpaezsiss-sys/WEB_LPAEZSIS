#!/usr/bin/env python3
"""Rebuild LPAEZsis mark-only logos (no wordmark) + favicons from logo.svg."""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "site/img/brand"
ICONS = ROOT / "site/img/icons"
WORK = Path("/tmp/logo_work")
WORK.mkdir(exist_ok=True)

NAVY = "#1B2D4C"
YELLOW = "#EBB817"


def inkscape_export(svg: Path, png: Path, height: int) -> None:
    subprocess.check_call(
        [
            "inkscape",
            str(svg),
            "--export-type=png",
            f"--export-filename={png}",
            f"--export-height={height}",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def main() -> int:
    svg_full = (BRAND / "logo.svg").read_text()
    navy_d = re.search(r'<path\s+d="([^"]+)"\s+id="path7"', svg_full).group(1)
    yellow_d = re.search(r'<path\s+d="([^"]+)"\s+id="path10"', svg_full).group(1)
    mark_navy_d = [p.strip() for p in re.split(r"(?=M)", navy_d) if p.strip()][0]

    measure = WORK / "mark_measure.svg"
    measure.write_text(
        f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4004 839">
  <g transform="translate(0,839) scale(0.1,-0.1)" fill="{NAVY}" fill-rule="evenodd">
    <path d="{mark_navy_d}"/>
  </g>
  <g transform="translate(0,839) scale(0.1,-0.1)" fill="{YELLOW}">
    <path d="{yellow_d}"/>
  </g>
</svg>
'''
    )
    measure_png = WORK / "mark_measure.png"
    subprocess.check_call(
        [
            "inkscape",
            str(measure),
            "--export-type=png",
            f"--export-filename={measure_png}",
            "--export-width=4004",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    im = Image.open(measure_png).convert("RGBA")
    arr = np.array(im)
    mask = arr[:, :, 3] > 8
    rs = np.where(mask.any(axis=1))[0]
    cs = np.where(mask.any(axis=0))[0]
    cx0, cy0 = int(cs[0]), int(rs[0])
    cx1, cy1 = int(cs[-1]) + 1, int(rs[-1]) + 1
    pad = 70
    vb_w = (cx1 - cx0) + 2 * pad
    vb_h = (cy1 - cy0) + 2 * pad
    tx, ty = pad - cx0, pad - cy0

    def write_svg(path: Path, color: str, title: str) -> None:
        path.write_text(
            f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{vb_w}" height="{vb_h}" viewBox="0 0 {vb_w} {vb_h}" version="1.1">
  <title>{title}</title>
  <g id="mark" transform="translate({tx},{ty})">
    <g id="navy" transform="translate(0.000000,839.000000) scale(0.100000,-0.100000)" fill="{color}" stroke="none" fill-rule="evenodd">
      <path d="{mark_navy_d}" id="mark-navy"/>
    </g>
    <g id="yellow" transform="translate(0.000000,839.000000) scale(0.100000,-0.100000)" fill="{YELLOW}" stroke="none">
      <path d="{yellow_d}" id="mark-yellow"/>
    </g>
  </g>
</svg>
'''
        )
        print("wrote", path.relative_to(ROOT))

    write_svg(BRAND / "logo-mark.svg", NAVY, "LPAEZsis mark")
    write_svg(BRAND / "logo-mark-white.svg", "#FFFFFF", "LPAEZsis mark white")

    exports = [
        (BRAND / "logo-mark.svg", BRAND / "logo-mark.png", 256),
        (BRAND / "logo-mark.svg", BRAND / "logo-mark-200.png", 200),
        (BRAND / "logo-mark.svg", BRAND / "logo-mark-512.png", 512),
        (BRAND / "logo-mark.svg", BRAND / "logo-mark-1024.png", 1024),
        (BRAND / "logo-mark-white.svg", BRAND / "logo-mark-white.png", 256),
        (BRAND / "logo-mark-white.svg", BRAND / "logo-mark-white-512.png", 512),
        (BRAND / "logo-mark-white.svg", BRAND / "logo-mark-white-1024.png", 1024),
    ]
    for svg, png, height in exports:
        inkscape_export(svg, png, height)
        print("wrote", png.relative_to(ROOT), Image.open(png).size)

    mark1024 = Image.open(BRAND / "logo-mark-1024.png").convert("RGBA")

    def make_square(size: int, out: Path) -> None:
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        margin = int(size * 0.06)
        avail = size - 2 * margin
        mw, mh = mark1024.size
        scale = min(avail / mw, avail / mh)
        nw, nh = max(1, int(mw * scale)), max(1, int(mh * scale))
        resized = mark1024.resize((nw, nh), Image.Resampling.LANCZOS)
        canvas.paste(resized, ((size - nw) // 2, (size - nh) // 2), resized)
        canvas.save(out, optimize=True)
        print("wrote", out.relative_to(ROOT))

    ICONS.mkdir(parents=True, exist_ok=True)
    for size, name in [
        (32, "favicon-32.png"),
        (48, "favicon-48.png"),
        (180, "apple-touch-icon.png"),
        (192, "favicon-192.png"),
        (512, "favicon-512.png"),
    ]:
        make_square(size, ICONS / name)

    ico_imgs = []
    for size in (16, 32, 48):
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        margin = max(1, int(size * 0.06))
        avail = size - 2 * margin
        mw, mh = mark1024.size
        scale = min(avail / mw, avail / mh)
        nw, nh = max(1, int(mw * scale)), max(1, int(mh * scale))
        resized = mark1024.resize((nw, nh), Image.Resampling.LANCZOS)
        canvas.paste(resized, ((size - nw) // 2, (size - nh) // 2), resized)
        ico_imgs.append(canvas)
    ico = ICONS / "favicon.ico"
    ico_imgs[0].save(
        ico,
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
        append_images=ico_imgs[1:],
    )
    print("wrote", ico.relative_to(ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
