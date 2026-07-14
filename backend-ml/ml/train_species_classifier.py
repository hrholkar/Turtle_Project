"""
train_species_classifier.py
===========================
Trains a species (turtle_type) classifier on top of MobileNetV2 embeddings.

Requires:  storage/models/embeddings.pkl  (from generate_embeddings.py)

Usage:
    cd backend-ml
    python ml/train_species_classifier.py

Outputs:
    storage/models/species_classifier.pkl
    storage/models/label_encoder.pkl
"""

import sys
import pickle
import logging
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.svm import SVC
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report
import joblib

_REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_REPO_ROOT))

from app.config.settings import settings

logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
log = logging.getLogger(__name__)


def main() -> None:
    # ── Load embeddings ─────────────────────────────────────────────────────────
    emb_path = Path(settings.embeddings_path)
    if not emb_path.exists():
        log.error(f"Embeddings not found at {emb_path}. Run generate_embeddings.py first.")
        sys.exit(1)

    log.info(f"Loading embeddings from {emb_path} …")
    with open(emb_path, "rb") as f:
        data = pickle.load(f)

    X: np.ndarray  = data["embedding"]           # (N, 1280)
    raw_labels: list[str] = data["turtle_type"]   # species strings

    log.info(f"  Dataset: {X.shape[0]} samples, {X.shape[1]} features")
    log.info(f"  Species distribution:\n{pd.Series(raw_labels).value_counts().to_string()}")

    # ── One embedding per identity (average-pooled per turtle) ─────────────────
    # We aggregate per-identity to avoid the classifier just memorising image order
    identities = np.array(data["identity"])
    unique_ids  = np.unique(identities)

    X_agg, y_agg = [], []
    for tid in unique_ids:
        mask = identities == tid
        X_agg.append(X[mask].mean(axis=0))
        # All rows for the same identity share the same species
        y_agg.append(raw_labels[np.where(mask)[0][0]])

    X_agg = np.array(X_agg, dtype=np.float32)
    log.info(f"  After per-identity aggregation: {X_agg.shape[0]} samples")

    # ── Encode labels ───────────────────────────────────────────────────────────
    le = LabelEncoder()
    y_enc = le.fit_transform(y_agg)
    log.info(f"  Classes: {list(le.classes_)}")

    # ── Build pipeline: StandardScaler + RBF-SVM ────────────────────────────────
    # SVM with RBF kernel works well on normalised high-dimensional embeddings.
    # We use probability=True so we can return per-class confidence scores.
    clf_pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("clf",    SVC(kernel="rbf", C=10.0, gamma="scale",
                       probability=True, random_state=42)),
    ])

    # ── Cross-validation ────────────────────────────────────────────────────────
    n_splits = min(5, min(np.bincount(y_enc)))   # guard for tiny classes
    n_splits = max(n_splits, 2)
    log.info(f"Running {n_splits}-fold stratified cross-validation …")
    cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
    scores = cross_val_score(clf_pipeline, X_agg, y_enc, cv=cv, scoring="accuracy")
    log.info(f"  CV accuracy: {scores.mean():.4f} ± {scores.std():.4f}")

    # ── Final fit on all data ────────────────────────────────────────────────────
    log.info("Fitting final classifier on full dataset …")
    clf_pipeline.fit(X_agg, y_enc)

    # Classification report
    y_pred = clf_pipeline.predict(X_agg)
    log.info(
        "\nClassification report (train set):\n"
        + classification_report(y_enc, y_pred, target_names=le.classes_)
    )

    # ── Save artefacts ───────────────────────────────────────────────────────────
    clf_path = Path(settings.species_classifier_path)
    le_path  = Path(settings.label_encoder_path)
    clf_path.parent.mkdir(parents=True, exist_ok=True)

    joblib.dump(clf_pipeline, clf_path)
    joblib.dump(le, le_path)
    log.info(f"Saved species classifier → {clf_path}")
    log.info(f"Saved label encoder      → {le_path}")


if __name__ == "__main__":
    main()
