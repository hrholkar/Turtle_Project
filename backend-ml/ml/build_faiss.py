"""
ml/build_faiss.py
=================
Builds a species-aware + side-aware FAISS index from embeddings.pkl.

Each slot in the index stores:
  - identity      (e.g. "t001")
  - species       (e.g. "Green Sea turtle")
  - side          (e.g. "LEFT" | "RIGHT" | "UNKNOWN")
  - year          (e.g. 2019)
  - location      (e.g. "Alibaug")
  - file_name     (relative path)

The metadata is persisted to metadata_store.json alongside the FAISS binary.

Usage:
    cd backend-ml
    python ml/build_faiss.py

Outputs:
    storage/index/turtles_v2.index
    storage/index/metadata_store.json
"""

from __future__ import annotations

import json
import logging
import pickle
import sys
from pathlib import Path

import faiss
import numpy as np
import pandas as pd

_REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_REPO_ROOT))

from app.config.settings import settings

logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
log = logging.getLogger(__name__)


def main() -> None:
    # ── Load embeddings ───────────────────────────────────────────────────────
    emb_path = Path(settings.embeddings_path)
    if not emb_path.exists():
        log.error(
            "Embeddings not found at %s. Run generate_embeddings.py first.", emb_path
        )
        sys.exit(1)

    log.info("Loading embeddings from %s …", emb_path)
    with open(emb_path, "rb") as f:
        data = pickle.load(f)

    embeddings: np.ndarray = data["embedding"]        # (N, D) float32
    identities: list[str]  = data["identity"]
    file_names: list[str]  = data["file_name"]
    species:    list[str]  = data["turtle_type"]
    sides:      list[str]  = data["side"]

    N, D = embeddings.shape
    log.info("  %d embeddings, dim=%d", N, D)

    # ── Load CSV for extra metadata (year, location) ──────────────────────────
    csv_path = Path(settings.dataset_metadata_path)
    if csv_path.exists():
        df = pd.read_csv(csv_path)
        # Build lookup: file_name → {year, location}
        df = df.drop_duplicates(subset=["file_name"]).set_index("file_name")
        year_lookup:     dict[str, int] = df["year"].to_dict()       if "year"     in df.columns else {}
        location_lookup: dict[str, str] = df["location"].to_dict()  if "location" in df.columns else {}
        log.info("  CSV loaded — year/location columns available")
    else:
        year_lookup = {}
        location_lookup = {}
        log.warning("  Metadata CSV not found; year/location will be empty")

    # ── L2-normalise (in case not already normalised) ─────────────────────────
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1.0, norms)
    embeddings = (embeddings / norms).astype(np.float32)

    # ── Build FAISS index (inner product = cosine for L2-normalised vectors) ──
    index = faiss.IndexFlatIP(D)
    index.add(embeddings)
    log.info("  FAISS index built — %d vectors", index.ntotal)

    # ── Build metadata store ──────────────────────────────────────────────────
    # metadata_store[i] holds the metadata for the i-th FAISS slot
    metadata_store: list[dict] = []
    for i, (ident, fname, sp, side) in enumerate(
        zip(identities, file_names, species, sides)
    ):
        metadata_store.append(
            {
                "faiss_idx":  i,
                "identity":   str(ident),
                "species":    str(sp),
                "side":       str(side),
                "file_name":  str(fname),
                "year":       int(year_lookup.get(fname, 0)),
                "location":   str(location_lookup.get(fname, "")),
            }
        )

    # ── Species / side distribution summary ──────────────────────────────────
    sp_series = pd.Series(species)
    side_series = pd.Series(sides)
    log.info("  Species distribution:\n%s", sp_series.value_counts().to_string())
    log.info("  Side distribution:\n%s",    side_series.value_counts().to_string())

    # ── Persist ───────────────────────────────────────────────────────────────
    out_index_path = Path(settings.faiss_v2_index_path)
    out_meta_path  = Path(settings.metadata_store_path)
    out_index_path.parent.mkdir(parents=True, exist_ok=True)

    faiss.write_index(index, str(out_index_path))
    log.info("Saved FAISS v2 index  → %s", out_index_path)

    with open(out_meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata_store, f, ensure_ascii=False)
    log.info("Saved metadata store  → %s", out_meta_path)

    # ── Build per-identity aggregate stats (for the /stats endpoint) ──────────
    identity_set = sorted(set(identities))
    species_set  = sorted(set(species))
    log.info(
        "Summary: %d unique identities across %d species",
        len(identity_set),
        len(species_set),
    )
    log.info("Species: %s", species_set)


if __name__ == "__main__":
    main()
