#!/usr/bin/env python3
"""
Cut the squad portraits out of the club's photo collage.

The source is the club's contact sheet (7 faces on the top row, 6 on the bottom)
plus one separate file for the player who joined later. Cells are evenly sized,
so the grid is split by proportion rather than by detecting gutters, which are
blurred by JPEG compression. Each cell is then trimmed to its subject and
resized to a uniform portrait.

Usage:
    python scripts/cut-squad-photos.py \
        --collage "G:/Mi unidad/Rup/AC FRIO/Collage/collage OK.jpg" \
        --extra "G:/Mi unidad/Rup/AC FRIO/Collage/Cristian.jpg" \
        --out design/art/jugadores/cuts
"""
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image

# Reading order of the contact sheet, then the player who arrived later.
TOP_ROW = ["pablo", "nil", "marti", "marcos", "jonay", "rup", "albert"]
BOTTOM_ROW = ["gio", "geri", "dani", "ander", "cristo", "chepa"]
EXTRA = ["cristian"]

# Portrait size used by the site: 4:5, enough for a retina card.
SIZE = (480, 600)


def splits(start: int, end: int, parts: int) -> list[tuple[int, int]]:
    step = (end - start) / parts
    return [(round(start + i * step), round(start + (i + 1) * step)) for i in range(parts)]


def subject_box(cell: Image.Image, tolerance: int = 28) -> tuple[int, int, int, int]:
    """Bounding box of everything that differs from the cell's own background."""
    data = np.asarray(cell.convert("RGB")).astype(int)
    background = np.median(
        np.concatenate([data[0:6].reshape(-1, 3), data[-6:].reshape(-1, 3)]), axis=0
    )
    distance = np.abs(data - background).sum(axis=2)
    mask = distance > tolerance
    rows = np.where(mask.any(axis=1))[0]
    cols = np.where(mask.any(axis=0))[0]
    if rows.size == 0 or cols.size == 0:
        raise ValueError("empty cell: no subject found")
    return int(cols[0]), int(rows[0]), int(cols[-1]) + 1, int(rows[-1]) + 1


def to_portrait(cell: Image.Image, margin: float = 0.04) -> Image.Image:
    """Trim the cell to its subject and fit it into a centred 4:5 portrait."""
    left, top, right, bottom = subject_box(cell)
    pad_x = int((right - left) * margin)
    pad_y = int((bottom - top) * margin)
    left = max(0, left - pad_x)
    top = max(0, top - pad_y)
    right = min(cell.width, right + pad_x)
    bottom = min(cell.height, bottom + pad_y)
    subject = cell.crop((left, top, right, bottom))

    # Fit the subject width-wise, keeping the head at the top of the frame.
    scale = SIZE[0] / subject.width
    resized = subject.resize((SIZE[0], max(1, round(subject.height * scale))), Image.LANCZOS)
    canvas = Image.new("RGB", SIZE, (235, 235, 235))
    canvas.paste(resized.crop((0, 0, SIZE[0], min(resized.height, SIZE[1]))), (0, 0))
    return canvas


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--collage", required=True)
    parser.add_argument("--extra", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    collage = Image.open(args.collage).convert("RGB")
    # Measured on the club's sheet: two bands with a gap between them.
    top_band = (44, 409)
    bottom_band = (438, 848)

    produced: list[tuple[str, Path]] = []

    for names, band, parts in (
        (TOP_ROW, top_band, len(TOP_ROW)),
        (BOTTOM_ROW, bottom_band, len(BOTTOM_ROW)),
    ):
        for name, (x0, x1) in zip(names, splits(0, collage.width, parts)):
            cell = collage.crop((x0, band[0], x1, band[1]))
            target = out / f"{name}.png"
            to_portrait(cell).save(target)
            produced.append((name, target))

    extra = Image.open(args.extra).convert("RGB")
    for name in EXTRA:
        target = out / f"{name}.png"
        to_portrait(extra).save(target)
        produced.append((name, target))

    for name, path in produced:
        print(f"{name:10s} {Image.open(path).size} {path}")


if __name__ == "__main__":
    main()
