"""
ml/register.py
==============
Registers a new turtle into the FAISS v2 index and metadata store
WITHOUT rebuilding or retraining any model.

Usage (CLI):
    cd backend-ml
    python ml/register.py <image_path> <identity> <species> [<side>] [<location>] [<year>]

This module is also imported by the FastAPI endpoint POST /register_new_turtle.
"""

from __future__ import annotations

import json
import logging
import sys
from pathlib import Path
from typing import Optional

import faiss
import numpy as np

_REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_REPO_ROOT))

from app.config.settings import settings
from ml.predict import extract_embedding, resolve_side, _get_faiss_and_meta
from ml.utils import load_image_from_bytes, load_image_from_path, infer_side_from_image

logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
log = logging.getLogger(__name__)


def register_turtle(
    image_source: bytes | str | Path,
    identity: str,
    species: str,
    image_side: str = "AUTO",
    location: str = "",
    year: int = 0,
) -> dict:
    """
    Add a new turtle embedding to the FAISS v2 index and metadata store.

    Args:
        image_source:  Raw image bytes, or file path (str / Path).
        identity:      Turtle identity string (e.g. "t439").
        species:       Species string (must match classifier labels).
        image_side:    "AUTO" | "LEFT" | "RIGHT".
        location:      Human-readable location string.
        year:          Year of sighting.

    Returns:
        {
            "success":   True,
            "identity":  str,
            "faiss_idx": int,
            "side":      str,
        }

    Raises:
        ValueError  if the image cannot be decoded.
        RuntimeError if the FAISS index/metadata store cannot be loaded.
    """
    # ── Load image ────────────────────────────────────────────────────────────
    if isinstance(image_source, (str, Path)):
        img = load_image_from_path(image_source)
    else:
        img = load_image_from_bytes(image_source)

    if img is None:
        raise ValueError("Could not decode the provided image.")

    # ── Resolve side ──────────────────────────────────────────────────────────
    effective_side = resolve_side(img, image_side)

    # ── Extract embedding ─────────────────────────────────────────────────────
    embedding = extract_embedding(img)   # (1280,) L2-normalised float32

    # ── Load current index + metadata ─────────────────────────────────────────
    faiss_index, metadata_store = _get_faiss_and_meta()

    # ── Append to FAISS ───────────────────────────────────────────────────────
    faiss_idx = faiss_index.ntotal
    faiss_index.add(embedding.reshape(1, -1))

    # ── Append to metadata store ──────────────────────────────────────────────
    new_slot: dict = {
        "faiss_idx": faiss_idx,
        "identity":  str(identity),
        "species":   str(species),
        "side":      effective_side,
        "file_name": "",
        "year":      int(year),
        "location":  str(location),
    }
    metadata_store.append(new_slot)

    # ── Persist FAISS index ───────────────────────────────────────────────────
    idx_path  = Path(settings.faiss_v2_index_path)
    meta_path = Path(settings.metadata_store_path)
    idx_path.parent.mkdir(parents=True, exist_ok=True)

    faiss.write_index(faiss_index, str(idx_path))

    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata_store, f, ensure_ascii=False)

    log.info(
        "Registered new turtle: identity=%s, species=%s, side=%s, faiss_idx=%d",
        identity, species, effective_side, faiss_idx,
    )

    return {
        "success":   True,
        "identity":  identity,
        "faiss_idx": faiss_idx,
        "side":      effective_side,
    }


# ── CLI entry point ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(
            "Usage: python ml/register.py <image_path> <identity> <species> "
            "[AUTO|LEFT|RIGHT] [location] [year]"
        )
        sys.exit(1)

    img_path  = sys.argv[1]
    identity  = sys.argv[2]
    species   = sys.argv[3]
    side_arg  = sys.argv[4] if len(sys.argv) > 4 else "AUTO"
    location  = sys.argv[5] if len(sys.argv) > 5 else ""
    year      = int(sys.argv[6]) if len(sys.argv) > 6 else 0

    result = register_turtle(
        image_source=img_path,
        identity=identity,
        species=species,
        image_side=side_arg,
        location=location,
        year=year,
    )
    import pprint
    pprint.pprint(result)
