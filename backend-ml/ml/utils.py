"""
ml/utils.py
===========
Shared utilities for the TurtleTrack ML pipeline.

Provides:
- L2 normalisation
- Robust image loading (EXIF-aware, RGBA/grayscale → RGB)
- Brightness-based left/right side heuristic
- Auto-next-identity generator
"""

from __future__ import annotations

import io
import logging
import re
from pathlib import Path
from typing import Optional

import numpy as np
from PIL import Image, ImageOps

log = logging.getLogger(__name__)


# ── Embedding normalisation ────────────────────────────────────────────────────

def l2_normalize(vec: np.ndarray) -> np.ndarray:
    """
    L2-normalise a 1-D or 2-D float32 array.

    Args:
        vec: shape (D,) or (N, D)

    Returns:
        Same shape, L2-normalised along the last axis.
    """
    if vec.ndim == 1:
        norm = np.linalg.norm(vec)
        return (vec / norm).astype(np.float32) if norm > 0 else vec.astype(np.float32)

    norms = np.linalg.norm(vec, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1.0, norms)
    return (vec / norms).astype(np.float32)


# ── Image loading ──────────────────────────────────────────────────────────────

def load_image_from_path(path: str | Path) -> Optional[Image.Image]:
    """
    Load a PIL Image from a filesystem path.

    - Applies EXIF auto-rotation.
    - Converts RGBA → RGB (white background composite).
    - Converts any non-RGB mode → RGB.

    Returns None on load failure (logs a warning).
    """
    try:
        img = Image.open(str(path))
        img = ImageOps.exif_transpose(img)
        return _to_rgb(img)
    except Exception as exc:
        log.warning("Could not load image %s: %s", path, exc)
        return None


def load_image_from_bytes(data: bytes) -> Optional[Image.Image]:
    """
    Load a PIL Image from raw bytes.

    - Applies EXIF auto-rotation.
    - Converts RGBA → RGB (white background composite).
    - Converts any non-RGB mode → RGB.

    Returns None on failure.
    """
    try:
        img = Image.open(io.BytesIO(data))
        img = ImageOps.exif_transpose(img)
        return _to_rgb(img)
    except Exception as exc:
        log.warning("Could not decode image bytes: %s", exc)
        return None


def _to_rgb(img: Image.Image) -> Image.Image:
    """Normalise image colour mode to RGB."""
    if img.mode == "RGBA":
        bg = Image.new("RGB", img.size, (255, 255, 255))
        bg.paste(img, mask=img.split()[3])
        return bg
    if img.mode != "RGB":
        return img.convert("RGB")
    return img


# ── Side heuristic ─────────────────────────────────────────────────────────────

def infer_side_from_image(img: Image.Image, threshold: float = 5.0) -> str:
    """
    Lightweight brightness-asymmetry heuristic to detect LEFT / RIGHT side.

    Approach:
      1. Convert to grayscale.
      2. Compare mean brightness of left vs right half.
      3. If the difference exceeds *threshold* pixel values → label based on
         which half is brighter (brighter half → turtle is facing that side).
      4. If difference is below *threshold* → UNKNOWN.

    Args:
        img:       PIL Image (any mode; grayscale conversion done internally).
        threshold: Minimum absolute brightness difference (0-255) to assign a side.

    Returns:
        "LEFT" | "RIGHT" | "UNKNOWN"
    """
    gray = img.convert("L")
    arr  = np.array(gray, dtype=np.float32)
    mid  = arr.shape[1] // 2

    left_mean  = arr[:, :mid].mean()
    right_mean = arr[:, mid:].mean()
    diff = abs(left_mean - right_mean)

    if diff < threshold:
        return "UNKNOWN"
    # If the right half is brighter → object/head facing LEFT
    # If the left half is brighter  → object/head facing RIGHT
    return "LEFT" if right_mean > left_mean else "RIGHT"


# ── Identity management ────────────────────────────────────────────────────────

_ID_PATTERN = re.compile(r"^t(\d+)$", re.IGNORECASE)


def next_identity(existing_ids: list[str]) -> str:
    """
    Generate the next turtle identity string (e.g. "t439") given a list of
    existing identity strings from the metadata.

    Rules:
    - Parses the numeric suffix from IDs matching "t<digits>" (case-insensitive).
    - Returns "t{max + 1}" zero-padded to at least 3 digits.
    - Falls back to "t001" if no parseable IDs exist.

    Args:
        existing_ids: List of identity strings already in use.

    Returns:
        New unique identity string.
    """
    nums = []
    for eid in existing_ids:
        m = _ID_PATTERN.match(str(eid).strip())
        if m:
            nums.append(int(m.group(1)))

    if not nums:
        return "t001"

    nxt = max(nums) + 1
    width = max(3, len(str(max(nums))))
    return f"t{nxt:0{width}d}"


# ── Cosine similarity (scalar) ─────────────────────────────────────────────────

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """
    Compute cosine similarity between two 1-D vectors.

    For L2-normalised vectors this is equivalent to the dot product.
    """
    a = a.astype(np.float64)
    b = b.astype(np.float64)
    denom = (np.linalg.norm(a) * np.linalg.norm(b))
    if denom == 0:
        return 0.0
    return float(np.clip(np.dot(a, b) / denom, 0.0, 1.0))
