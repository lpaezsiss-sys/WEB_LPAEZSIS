#!/usr/bin/env python3
"""Compress heavy hero/product images for faster preview and production."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"


def compress_jpeg(path: Path, max_side: int = 1920, quality: int = 78) -> None:
    before = path.stat().st_size
    with Image.open(path) as im:
        im = im.convert("RGB")
        w, h = im.size
        scale = min(1.0, max_side / max(w, h))
        if scale < 1.0:
            im = im.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
        tmp = path.with_suffix(".tmp.jpg")
        im.save(tmp, "JPEG", quality=quality, optimize=True, progressive=True)
    after = tmp.stat().st_size
    if after < before:
        tmp.replace(path)
        print(f"OK  {path.relative_to(SITE)}  {before/1024:.0f}KB -> {after/1024:.0f}KB")
    else:
        tmp.unlink(missing_ok=True)
        print(f"--  {path.relative_to(SITE)}  kept {before/1024:.0f}KB")


def main() -> None:
    targets = [
        SITE / "img/hero/line.jpg",
        SITE / "img/hero/plant.jpg",
        SITE / "img/hero/conserves.jpg",
        SITE / "img/hero/cans.jpg",
        SITE / "img/hero/3piece_cans.jpg",
    ]
    for path in targets:
        if path.is_file():
            compress_jpeg(path)
        else:
            print("missing", path)


if __name__ == "__main__":
    main()
