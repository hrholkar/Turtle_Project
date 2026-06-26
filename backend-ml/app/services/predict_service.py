"""
app/services/predict_service.py
================================
Singleton service wrapper around ml/predict.py for use inside the FastAPI app.

This keeps the heavy ML models loaded once in memory at startup,
and exposes a clean async-compatible interface for the route handlers.
"""

from __future__ import annotations

import json
import logging
import threading
from pathlib import Path
from typing import Optional

from app.config.settings import settings

log = logging.getLogger(__name__)


class PredictService:
    """
    Thread-safe singleton that wraps the ml.predict pipeline.

    Loading order (called once at FastAPI startup via lifespan):
        1. MobileNetV2 extractor
        2. Species SVM classifier + LabelEncoder
        3. FAISS v2 index + metadata_store.json

    All subsequent calls reuse the already-loaded objects.
    """

    _instance: Optional["PredictService"] = None
    _lock: threading.Lock = threading.Lock()

    def __init__(self) -> None:
        self._ready = False
        self._error: Optional[str] = None
        self._load_models()

    # ── Singleton ──────────────────────────────────────────────────────────────

    @classmethod
    def get_instance(cls) -> "PredictService":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    # ── Internal model loader ──────────────────────────────────────────────────

    def _load_models(self) -> None:
        try:
            # Import lazily to allow the app to start even before models exist
            import ml.predict as _predict   # noqa: F401 — triggers singleton init

            _predict._get_extractor()
            _predict._get_species_clf()
            _predict._get_faiss_and_meta()
            self._ready = True
            log.info("[PredictService] All v2 models loaded successfully.")
        except FileNotFoundError as exc:
            self._ready = False
            self._error = str(exc)
            log.warning("[PredictService] Models not yet trained: %s", exc)
        except Exception as exc:
            self._ready = False
            self._error = str(exc)
            log.error("[PredictService] Failed to load models: %s", exc, exc_info=True)

    # ── Public API ─────────────────────────────────────────────────────────────

    @property
    def is_ready(self) -> bool:
        return self._ready

    @property
    def load_error(self) -> Optional[str]:
        return self._error

    def predict(
        self,
        image_bytes: bytes,
        image_side: str = "AUTO",
        top_k: int = 3,
        threshold: Optional[float] = None,
    ) -> dict:
        """
        Run the full v2 identification pipeline.

        Args:
            image_bytes:  Raw uploaded image bytes.
            image_side:   "AUTO" | "LEFT" | "RIGHT".
            top_k:        Number of top matches to return.
            threshold:    Override the default similarity threshold.

        Returns:
            PredictMatchedResponse dict  or  PredictNewTurtleResponse dict.

        Raises:
            RuntimeError  if models are not loaded.
            ValueError    if the image cannot be decoded.
        """
        if not self._ready:
            raise RuntimeError(
                f"ML models are not loaded. {self._error or 'Run the training pipeline first.'}"
            )

        from ml.predict import predict
        return predict(
            image_source=image_bytes,
            image_side=image_side,
            top_k=top_k,
            threshold=threshold,
        )

    def register(
        self,
        image_bytes: bytes,
        identity: str,
        species: str,
        image_side: str = "AUTO",
        location: str = "",
        year: int = 0,
    ) -> dict:
        """
        Register a new turtle embedding into the live FAISS index.

        Args:
            image_bytes:  Raw uploaded image bytes.
            identity:     New turtle identity string.
            species:      Species label.
            image_side:   "AUTO" | "LEFT" | "RIGHT".
            location:     Human-readable location.
            year:         Sighting year.

        Returns:
            RegisterNewTurtleResponse dict.
        """
        if not self._ready:
            raise RuntimeError(
                f"ML models are not loaded. {self._error or 'Run the training pipeline first.'}"
            )

        from ml.register import register_turtle
        return register_turtle(
            image_source=image_bytes,
            identity=identity,
            species=species,
            image_side=image_side,
            location=location,
            year=year,
        )

    def get_stats(self) -> dict:
        """
        Return current statistics about the loaded index.

        Returns:
            dict with total_species, total_identities, total_embeddings,
            faiss_v2_index_size.
        """
        if not self._ready:
            return {
                "total_species":       0,
                "total_identities":    0,
                "total_embeddings":    0,
                "faiss_v2_index_size": 0,
            }

        from ml.predict import _get_faiss_and_meta
        faiss_index, metadata_store = _get_faiss_and_meta()

        species_set    = {slot["species"]   for slot in metadata_store}
        identity_set   = {slot["identity"]  for slot in metadata_store}

        return {
            "total_species":       len(species_set),
            "total_identities":    len(identity_set),
            "total_embeddings":    len(metadata_store),
            "faiss_v2_index_size": int(faiss_index.ntotal),
        }
