"""
ml/predict.py
=============
Standalone end-to-end prediction module.

Pipeline:
    image bytes / path
    → side detection (AUTO | LEFT | RIGHT)
    → species prediction (SVM on MobileNetV2 embedding)
    → filter FAISS slots by species + side
    → cosine similarity search
    → top-3 matches OR NEW TURTLE

Can be run directly for quick CLI testing:
    cd backend-ml
    python ml/predict.py <image_path>
"""

from __future__ import annotations

import json
import logging
import pickle
import sys
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import torch
import torch.nn as nn
from PIL import Image
from torchvision import models, transforms

_REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_REPO_ROOT))

from app.config.settings import settings
from ml.utils import l2_normalize, load_image_from_bytes, load_image_from_path, infer_side_from_image

logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

# ── ImageNet transform (must match generate_embeddings.py) ────────────────────
_TRANSFORM = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


# ── Lazy-loaded singletons ─────────────────────────────────────────────────────

_extractor_model: Optional[nn.Module] = None
_device: Optional[torch.device] = None
_species_clf = None      # sklearn Pipeline
_label_encoder = None    # LabelEncoder
_faiss_index = None      # faiss.IndexFlatIP
_metadata_store: Optional[list[dict]] = None


def _get_device() -> torch.device:
    global _device
    if _device is None:
        _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    return _device


def _get_extractor() -> nn.Module:
    global _extractor_model
    if _extractor_model is None:
        log.info("Loading MobileNetV2 feature extractor …")
        model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.IMAGENET1K_V1)
        model.classifier = nn.Identity()
        model.eval()
        _extractor_model = model.to(_get_device())
        log.info("  Extractor loaded on %s", _get_device())
    return _extractor_model


def _get_species_clf():
    global _species_clf, _label_encoder
    if _species_clf is None:
        clf_path = Path(settings.species_classifier_path)
        le_path  = Path(settings.label_encoder_path)
        if not clf_path.exists() or not le_path.exists():
            raise FileNotFoundError(
                f"Species classifier not found at {clf_path}. "
                "Run ml/train_species_classifier.py first."
            )
        _species_clf    = joblib.load(clf_path)
        _label_encoder  = joblib.load(le_path)
        log.info("  Species classifier loaded — classes: %s", list(_label_encoder.classes_))
    return _species_clf, _label_encoder


def _get_faiss_and_meta():
    global _faiss_index, _metadata_store
    if _faiss_index is None:
        import faiss as _faiss
        idx_path  = Path(settings.faiss_v2_index_path)
        meta_path = Path(settings.metadata_store_path)
        if not idx_path.exists() or not meta_path.exists():
            raise FileNotFoundError(
                f"FAISS v2 index not found at {idx_path}. "
                "Run ml/build_faiss.py first."
            )
        _faiss_index    = _faiss.read_index(str(idx_path))
        with open(meta_path, "r", encoding="utf-8") as f:
            _metadata_store = json.load(f)
        log.info("  FAISS v2 index loaded — %d slots", _faiss_index.ntotal)
    return _faiss_index, _metadata_store


# ── Core extraction ────────────────────────────────────────────────────────────

@torch.no_grad()
def extract_embedding(img: Image.Image) -> np.ndarray:
    """Extract L2-normalised MobileNetV2 embedding from a PIL Image."""
    model  = _get_extractor()
    device = _get_device()

    tensor = _TRANSFORM(img).unsqueeze(0).to(device)   # (1, 3, 224, 224)
    feats  = model(tensor).squeeze().cpu().numpy()      # (1280,)
    return l2_normalize(feats.astype(np.float32))


# ── Side detection ─────────────────────────────────────────────────────────────

def resolve_side(img: Image.Image, requested_side: str) -> str:
    """
    Return the effective side label for filtering.

    Args:
        img:            PIL Image of the turtle.
        requested_side: "AUTO" | "LEFT" | "RIGHT" (case-insensitive).

    Returns:
        "LEFT" | "RIGHT" | "UNKNOWN"
    """
    req = requested_side.upper().strip()
    if req in ("LEFT", "RIGHT"):
        return req
    # AUTO → heuristic
    return infer_side_from_image(img)


# ── Species prediction ─────────────────────────────────────────────────────────

def predict_species(embedding: np.ndarray) -> tuple[str, float]:
    """
    Predict species from a 1-D embedding.

    Returns:
        (species_name, confidence_0_to_1)
    """
    clf, le = _get_species_clf()
    proba: np.ndarray = clf.predict_proba(embedding.reshape(1, -1))[0]
    top_idx   = int(np.argmax(proba))
    species   = str(le.classes_[top_idx])
    confidence = float(proba[top_idx])
    return species, confidence


# ── FAISS filtered search ──────────────────────────────────────────────────────

def _normalise_species(s: str) -> str:
    """Lower-case + strip for species comparison."""
    return s.lower().strip()


def search_faiss_filtered(
    embedding: np.ndarray,
    species: str,
    side: str,
    top_k: int = 3,
) -> list[dict]:
    """
    Search the FAISS index, returning the top_k results filtered by species
    and (if side != UNKNOWN) by side.

    Args:
        embedding:  L2-normalised query vector (1280,).
        species:    Predicted species string (matched case-insensitively).
        side:       "LEFT" | "RIGHT" | "UNKNOWN".
        top_k:      Number of results to return.

    Returns:
        List of dicts ordered by similarity descending:
        {
          "identity":    str,
          "species":     str,
          "side":        str,
          "year":        int,
          "location":    str,
          "similarity":  float   # 0.0 – 1.0
        }
    """
    faiss_index, metadata_store = _get_faiss_and_meta()

    if faiss_index.ntotal == 0:
        return []

    # Search all vectors — we will filter after
    k = min(faiss_index.ntotal, max(top_k * 30, 200))   # over-fetch to allow post-filter
    q = embedding.reshape(1, -1).astype(np.float32)
    distances, indices = faiss_index.search(q, k)

    target_species = _normalise_species(species)
    use_side_filter = side in ("LEFT", "RIGHT")

    results: list[dict] = []
    seen_identities: set[str] = set()

    for dist, idx in zip(distances[0], indices[0]):
        if idx < 0:
            continue
        meta = metadata_store[int(idx)]

        # ── Species filter ────────────────────────────────────────────────────
        if _normalise_species(meta["species"]) != target_species:
            continue

        # ── Side filter ───────────────────────────────────────────────────────
        if use_side_filter:
            slot_side = meta["side"].upper()
            if slot_side not in (side, "UNKNOWN"):
                continue

        # ── De-duplicate by identity (keep highest-scoring) ───────────────────
        ident = meta["identity"]
        if ident in seen_identities:
            continue
        seen_identities.add(ident)

        similarity = float(np.clip(dist, 0.0, 1.0))
        results.append(
            {
                "identity":   ident,
                "species":    meta["species"],
                "side":       meta["side"],
                "year":       meta["year"],
                "location":   meta["location"],
                "similarity": similarity,
            }
        )

        if len(results) >= top_k:
            break

    return results


# ── Aggregate per-identity stats (first_seen / latest_seen) ───────────────────

def _build_identity_stats(metadata_store: list[dict]) -> dict[str, dict]:
    """
    Pre-compute per-identity first/latest year and most-common location
    from the full metadata store.
    """
    stats: dict[str, dict] = {}
    for slot in metadata_store:
        ident    = slot["identity"]
        yr       = slot.get("year", 0) or 0
        location = slot.get("location", "") or ""

        if ident not in stats:
            stats[ident] = {
                "first_seen":   yr,
                "latest_seen":  yr,
                "species":      slot.get("species", ""),
                "locations":    {},
            }
        else:
            if yr and yr < stats[ident]["first_seen"]:
                stats[ident]["first_seen"] = yr
            if yr and yr > stats[ident]["latest_seen"]:
                stats[ident]["latest_seen"] = yr

        if location:
            locs = stats[ident]["locations"]
            locs[location] = locs.get(location, 0) + 1

    # Resolve most common location per identity
    for ident, s in stats.items():
        if s["locations"]:
            s["location"] = max(s["locations"], key=lambda k: s["locations"][k])
        else:
            s["location"] = ""
        del s["locations"]

    return stats


# ── Full prediction pipeline ───────────────────────────────────────────────────

def predict(
    image_source: bytes | str | Path,
    image_side: str = "AUTO",
    top_k: int = 3,
    threshold: float | None = None,
) -> dict:
    """
    Full end-to-end prediction pipeline.

    Args:
        image_source:  Raw image bytes, file path (str or Path).
        image_side:    "AUTO" | "LEFT" | "RIGHT".
        top_k:         Number of top matches to return (default 3).
        threshold:     Similarity threshold for new-turtle decision.
                       Defaults to settings.new_turtle_threshold.

    Returns (matched):
        {
            "matched":           True,
            "predicted_species": str,
            "species_confidence": float,
            "image_side":        str,
            "top_matches": [
                {
                    "identity":    str,
                    "similarity":  float,   # 0-100 %
                    "species":     str,
                    "first_seen":  int,
                    "latest_seen": int,
                    "location":    str,
                }
            ]
        }

    Returns (no match):
        {
            "matched":           False,
            "predicted_species": str,
            "species_confidence": float,
            "image_side":        str,
            "message":           "NEW TURTLE DETECTED",
            "new_identity":      str,
        }
    """
    if threshold is None:
        threshold = settings.new_turtle_threshold

    # ── Load image ────────────────────────────────────────────────────────────
    if isinstance(image_source, (str, Path)):
        img = load_image_from_path(image_source)
    else:
        img = load_image_from_bytes(image_source)

    if img is None:
        raise ValueError("Could not decode the provided image.")

    # ── Side resolution ───────────────────────────────────────────────────────
    effective_side = resolve_side(img, image_side)

    # ── Embedding ─────────────────────────────────────────────────────────────
    embedding = extract_embedding(img)

    # ── Species prediction ────────────────────────────────────────────────────
    predicted_species, species_confidence = predict_species(embedding)
    log.info(
        "Predicted species: %s (confidence=%.3f)", predicted_species, species_confidence
    )

    # ── FAISS search (species + side filtered) ────────────────────────────────
    raw_matches = search_faiss_filtered(
        embedding=embedding,
        species=predicted_species,
        side=effective_side,
        top_k=top_k,
    )

    # ── Per-identity stats enrichment ─────────────────────────────────────────
    _, metadata_store = _get_faiss_and_meta()
    id_stats = _build_identity_stats(metadata_store)

    # ── Match / no-match decision ─────────────────────────────────────────────
    top_similarity = raw_matches[0]["similarity"] if raw_matches else 0.0

    if raw_matches and top_similarity >= threshold:
        # Build enriched match list
        top_matches = []
        for m in raw_matches:
            ident = m["identity"]
            stats = id_stats.get(ident, {})
            top_matches.append(
                {
                    "identity":    ident,
                    "similarity":  round(m["similarity"] * 100, 2),   # 0-100 %
                    "species":     m["species"],
                    "first_seen":  stats.get("first_seen", 0),
                    "latest_seen": stats.get("latest_seen", 0),
                    "location":    stats.get("location", ""),
                }
            )
        return {
            "matched":            True,
            "predicted_species":  predicted_species,
            "species_confidence": round(species_confidence * 100, 2),
            "image_side":         effective_side,
            "top_matches":        top_matches,
        }

    # ── NEW TURTLE ────────────────────────────────────────────────────────────
    existing_ids = list({slot["identity"] for slot in metadata_store})
    from ml.utils import next_identity
    new_id = next_identity(existing_ids)

    log.info(
        "No match (top_similarity=%.3f < threshold=%.3f) → NEW TURTLE: %s",
        top_similarity,
        threshold,
        new_id,
    )

    return {
        "matched":            False,
        "predicted_species":  predicted_species,
        "species_confidence": round(species_confidence * 100, 2),
        "image_side":         effective_side,
        "message":            "NEW TURTLE DETECTED",
        "new_identity":       new_id,
    }


# ── CLI entry point ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys, json as _json, pprint

    if len(sys.argv) < 2:
        print("Usage: python ml/predict.py <image_path> [AUTO|LEFT|RIGHT]")
        sys.exit(1)

    img_path   = sys.argv[1]
    side_arg   = sys.argv[2] if len(sys.argv) > 2 else "AUTO"

    result = predict(img_path, image_side=side_arg)
    pprint.pprint(result)
