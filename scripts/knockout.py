#!/usr/bin/env python3
"""Knock out near-black backgrounds on wedding map cutouts → PNG with alpha."""
from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "assets"

# (raw_filename, output_filename)
JOBS = [
    ("_raw_jw-marriott.png", "jw-marriott.png"),
    ("_raw_palm-beach.png", "palm-beach.png"),
    ("_raw_cannes.png", "cannes.png"),
    ("_raw_antibes.png", "antibes.png"),
    ("_raw_nice.png", "nice.png"),
    ("_raw_plane.png", "plane.png"),
    ("_raw_seagulls.png", "seagulls.png"),
    ("_raw_yacht.png", "yacht.png"),
    ("_raw_sailboat-a.png", "sailboat-a.png"),
    ("_raw_sailboat-b.png", "sailboat-b.png"),
    ("_raw_saint-emilion.png", "saint-emilion.png"),
]

# Additional airport pack cutouts (nice-airport, airplane, train, suv, suitcases,
# woven-bag, palms, lemon, sailboat-airport, train-men) are produced by cropping
# public/assets/_raw/airport-spritesheet.png then knocking black→alpha.
# The girls-car cutout is intentionally excluded.



def knockout(src: Path, dst: Path, threshold: int = 30, feather: int = 12) -> None:
    """Make near-black pixels transparent with a soft feather band."""
    im = Image.open(src).convert("RGBA")
    arr = np.asarray(im).astype(np.float32)
    rgb = arr[..., :3]
    darkness = rgb.max(axis=2)

    alpha = (darkness - threshold) / max(feather, 1)
    alpha = np.clip(alpha, 0.0, 1.0)
    existing = arr[..., 3] / 255.0
    out_alpha = (alpha * existing * 255.0).astype(np.uint8)

    out = arr.astype(np.uint8).copy()
    out[..., 3] = out_alpha
    Image.fromarray(out, "RGBA").save(dst, optimize=True)
    print(f"  {src.name} → {dst.name}  ({out.shape[1]}×{out.shape[0]})")


def split_seagulls(src: Path, out_dir: Path) -> None:
    """Crop individual gulls from the pack when bounding boxes are separable."""
    im = Image.open(src).convert("RGBA")
    arr = np.asarray(im)
    mask = arr[..., 3] > 40
    # Connected components via simple row/col scan of bounding regions
    # Use flood-fill labels
    h, w = mask.shape
    visited = np.zeros_like(mask, dtype=bool)
    components = []
    for y in range(h):
        xs = np.where(mask[y] & ~visited[y])[0]
        for x in xs:
            if visited[y, x]:
                continue
            # BFS flood fill
            stack = [(y, x)]
            visited[y, x] = True
            ys, xs_list = [y], [x]
            while stack:
                cy, cx = stack.pop()
                for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not visited[ny, nx]:
                        visited[ny, nx] = True
                        stack.append((ny, nx))
                        ys.append(ny)
                        xs_list.append(nx)
            if len(ys) < 800:  # skip noise
                continue
            y0, y1 = min(ys), max(ys)
            x0, x1 = min(xs_list), max(xs_list)
            # pad
            pad = 8
            y0, x0 = max(0, y0 - pad), max(0, x0 - pad)
            y1, x1 = min(h - 1, y1 + pad), min(w - 1, x1 + pad)
            components.append((y0, y1, x0, x1, len(ys)))

    components.sort(key=lambda c: -c[4])
    print(f"  seagulls: found {len(components)} components")
    for i, (y0, y1, x0, x1, _) in enumerate(components[:5], start=1):
        crop = im.crop((x0, y0, x1 + 1, y1 + 1))
        path = out_dir / f"seagull-{i}.png"
        crop.save(path, optimize=True)
        print(f"    → {path.name} ({crop.size[0]}×{crop.size[1]})")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--threshold", type=int, default=30)
    parser.add_argument("--feather", type=int, default=12)
    parser.add_argument("--split-seagulls", action="store_true", default=True)
    args = parser.parse_args()

    ASSETS.mkdir(parents=True, exist_ok=True)
    print(f"Knockout threshold={args.threshold} feather={args.feather}")
    for raw, out_name in JOBS:
        src = ASSETS / raw
        if not src.exists():
            print(f"  SKIP missing {src}")
            continue
        knockout(src, ASSETS / out_name, threshold=args.threshold, feather=args.feather)

    if args.split_seagulls and (ASSETS / "seagulls.png").exists():
        split_seagulls(ASSETS / "seagulls.png", ASSETS)
    print("Done.")


if __name__ == "__main__":
    main()
