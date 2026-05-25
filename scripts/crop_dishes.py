#!/usr/bin/env python3
"""
Auto-crop dish PNGs to remove transparent / near-white padding around the plate,
then add a small uniform margin so the plate doesn't touch the edge.

- RGBA images: crop by alpha channel (transparent = empty)
- RGB images:  crop by near-white pixels (treat near-white as background)
"""
import os
import sys
from PIL import Image, ImageChops

DISHES_DIR = "/data/data/com.termux/files/home/zestora/images/dishes"
MARGIN_RATIO = 0.04          # 4% padding around the cropped plate
WHITE_THRESHOLD = 245        # pixels above this on R,G,B treated as background


def bbox_from_alpha(img: Image.Image, threshold: int = 8):
    """Find bbox of pixels whose alpha exceeds threshold (ignore near-transparent noise)."""
    alpha = img.split()[-1]
    # Map alpha: anything <= threshold → 0, else 255
    mask = alpha.point(lambda a: 255 if a > threshold else 0)
    return mask.getbbox()


def bbox_from_white(img: Image.Image):
    # Build a mask: 0 where pixel is near-white, 255 elsewhere
    rgb = img.convert("RGB")
    r, g, b = rgb.split()
    # invert near-white to black, others stay (subtract a flat white image)
    white_bg = Image.new("RGB", img.size, (255, 255, 255))
    diff = ImageChops.difference(rgb, white_bg)
    # get bbox of anything that differs from white by more than threshold
    # equivalent: pixel where (255-r,255-g,255-b) > tolerance
    return diff.getbbox() if diff.getbbox() else None


def add_margin(box, w, h, ratio):
    l, t, r, b = box
    cw, ch = r - l, b - t
    # use the larger side for symmetric padding
    pad = int(max(cw, ch) * ratio)
    l = max(0, l - pad)
    t = max(0, t - pad)
    r = min(w, r + pad)
    b = min(h, b + pad)
    return (l, t, r, b)


def process(path: str):
    img = Image.open(path)
    orig_size = img.size

    if img.mode == "RGBA":
        box = bbox_from_alpha(img)
        method = "alpha"
    else:
        # convert to RGBA so we can save uniformly with transparent padding optional
        box = bbox_from_white(img)
        method = "white"

    if not box:
        print(f"  SKIP (no content found): {os.path.basename(path)}")
        return

    box = add_margin(box, img.size[0], img.size[1], MARGIN_RATIO)
    cropped = img.crop(box)
    cropped.save(path, optimize=True)
    print(f"  {os.path.basename(path)}: {orig_size[0]}x{orig_size[1]} → {cropped.size[0]}x{cropped.size[1]}  ({method})")


def main():
    files = sorted(f for f in os.listdir(DISHES_DIR) if f.lower().endswith(".png"))
    print(f"Processing {len(files)} files in {DISHES_DIR}\n")
    for f in files:
        try:
            process(os.path.join(DISHES_DIR, f))
        except Exception as e:
            print(f"  ERROR on {f}: {e}", file=sys.stderr)
    print("\nDone.")


if __name__ == "__main__":
    main()
