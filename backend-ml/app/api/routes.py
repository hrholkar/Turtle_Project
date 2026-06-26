"""
app/api/routes.py
=================
TurtleTrack ML Service — FastAPI router.

v1 endpoints (legacy, kept for backward compat):
    POST   /ml/identify
    POST   /ml/register
    DELETE /ml/embeddings/{turtle_id}

v2 endpoints (full species+side+individual re-ID pipeline):
    POST   /predict
    POST   /register_new_turtle

Shared:
    GET    /ml/health
    GET    /ml/stats
    POST   /ml/predict-return/{turtle_id}
"""

from __future__ import annotations

import logging
import time
import json
import numpy as np
from datetime import datetime, timezone
from typing import Optional, Union

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse

from app.config.settings import settings
from app.models.schemas import (
    # v1
    IdentifyResponse,
    RegisterResponse,
    RemoveResponse,
    PredictReturnResponse,
    MatchResult,
    # v2
    PredictMatchedResponse,
    PredictNewTurtleResponse,
    RegisterNewTurtleResponse,
    HealthResponseV2,
    StatsResponseV2,
    TopMatch,
)
from app.services.extraction.feature_extractor import FeatureExtractor
from app.services.matching.faiss_index import FAISSIndexManager
from app.services.similarity.scorer import SimilarityScorer
from app.services.predict_service import PredictService

log = logging.getLogger(__name__)

router = APIRouter(tags=["ML"])


# ══════════════════════════════════════════════════════════════════════════════
# v2 — Primary prediction endpoints
# ══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/predict",
    summary="Identify a turtle (v2 — species + side + individual re-ID)",
    response_model=Union[PredictMatchedResponse, PredictNewTurtleResponse],
)
async def predict_turtle(
    image: UploadFile = File(..., description="Turtle image (JPEG / PNG / WEBP)"),
    image_side: str   = Form(
        default="AUTO",
        description="Side of the turtle in the image: AUTO | LEFT | RIGHT",
    ),
):
    """
    Full identification pipeline:

    1. Read image
    2. Detect or use selected side (AUTO / LEFT / RIGHT)
    3. Predict species (SVM classifier on MobileNetV2 embedding)
    4. Search FAISS index **only within the predicted species**
    5. Filter by image side
    6. Return **Top 3** identities if similarity ≥ threshold
    7. Otherwise return **NEW TURTLE DETECTED** with auto-assigned ID
    """
    # ── Validate content type ─────────────────────────────────────────────────
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
    if image.content_type and image.content_type.lower() not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image type: {image.content_type}. Use JPEG, PNG, or WEBP.",
        )

    # ── Validate image_side ───────────────────────────────────────────────────
    side_upper = image_side.upper().strip()
    if side_upper not in ("AUTO", "LEFT", "RIGHT"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image_side '{image_side}'. Allowed: AUTO | LEFT | RIGHT",
        )

    image_bytes = await image.read()

    try:
        svc    = PredictService.get_instance()
        result = svc.predict(
            image_bytes=image_bytes,
            image_side=side_upper,
            top_k=settings.top_k_matches,
            threshold=settings.new_turtle_threshold,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        log.exception("Unexpected error in /predict")
        raise HTTPException(status_code=500, detail=f"Internal server error: {exc}")

    return result


@router.post(
    "/register_new_turtle",
    response_model=RegisterNewTurtleResponse,
    summary="Register a new turtle into the live FAISS index",
)
async def register_new_turtle(
    image:      UploadFile  = File(...,               description="Turtle image"),
    identity:   str         = Form(...,               description="New turtle ID (e.g. t439)"),
    species:    str         = Form(...,               description="Species name (must match classifier classes)"),
    image_side: str         = Form(default="AUTO",   description="AUTO | LEFT | RIGHT"),
    location:   Optional[str] = Form(default=None,   description="Human-readable location"),
    year:       Optional[int] = Form(default=None,   description="Year of sighting"),
):
    """
    Register a newly discovered turtle:
    1. Extract embedding from the image.
    2. Append embedding to the live FAISS v2 index.
    3. Append metadata slot to metadata_store.json.

    Does **not** retrain any model.
    """
    image_bytes = await image.read()
    side_upper  = image_side.upper().strip()

    if side_upper not in ("AUTO", "LEFT", "RIGHT"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image_side '{image_side}'. Allowed: AUTO | LEFT | RIGHT",
        )

    try:
        svc    = PredictService.get_instance()
        result = svc.register(
            image_bytes=image_bytes,
            identity=identity.strip(),
            species=species.strip(),
            image_side=side_upper,
            location=location or "",
            year=year or 0,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        log.exception("Unexpected error in /register_new_turtle")
        raise HTTPException(status_code=500, detail=f"Internal server error: {exc}")

    return RegisterNewTurtleResponse(
        success=result["success"],
        identity=result["identity"],
        faiss_idx=result["faiss_idx"],
        side=result["side"],
        message=f"Turtle '{identity}' registered successfully in FAISS index.",
    )


# ══════════════════════════════════════════════════════════════════════════════
# v1 — Legacy endpoints (kept for backward compat with backend-node)
# ══════════════════════════════════════════════════════════════════════════════

_v1 = APIRouter(prefix="/ml", tags=["ML v1 (legacy)"])


@_v1.post("/identify", response_model=IdentifyResponse)
async def identify_turtle(
    file:  UploadFile = File(...),
    top_k: int        = Form(default=5),
):
    """
    Legacy endpoint.  Prefer POST /predict for the full v2 pipeline.
    """
    start = time.time()
    allowed = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed:
        raise HTTPException(400, detail=f"Unsupported image type: {file.content_type}")

    image_bytes = await file.read()
    extractor   = FeatureExtractor.get_instance()
    embedding   = extractor.extract_from_bytes(image_bytes)

    index       = FAISSIndexManager.get_instance()
    raw_results = index.search(embedding, top_k=top_k)

    matches, top_score, is_new_turtle, match_strength = SimilarityScorer.score_results(raw_results)
    ms = (time.time() - start) * 1000

    return IdentifyResponse(
        matches=matches,
        top_score=round(top_score, 4),
        is_new_turtle=is_new_turtle,
        match_strength=match_strength,
        processing_time_ms=round(ms, 2),
        embedding_vector=embedding.tolist(),
    )


@_v1.post("/register", response_model=RegisterResponse)
async def register_turtle(
    turtle_id:        str           = Form(...),
    file:             Optional[UploadFile] = File(default=None),
    embedding_vector: Optional[str] = Form(default=None),
):
    extractor = FeatureExtractor.get_instance()
    index     = FAISSIndexManager.get_instance()

    if embedding_vector:
        try:
            vec       = json.loads(embedding_vector)
            embedding = np.array(vec, dtype=np.float32)
        except Exception:
            raise HTTPException(400, detail="Invalid embedding_vector JSON")
    elif file:
        image_bytes = await file.read()
        embedding   = extractor.extract_from_bytes(image_bytes)
    else:
        raise HTTPException(400, detail="Either file or embedding_vector must be provided")

    success = index.add(turtle_id, embedding)
    return RegisterResponse(
        success=success,
        turtle_id=turtle_id,
        message=f"Turtle {turtle_id} registered in index (total: {index.size})",
    )


@_v1.delete("/embeddings/{turtle_id}", response_model=RemoveResponse)
async def remove_embedding(turtle_id: str):
    index   = FAISSIndexManager.get_instance()
    success = index.remove(turtle_id)
    if not success:
        raise HTTPException(404, detail=f"Turtle {turtle_id} not found in index")
    return RemoveResponse(success=True, turtle_id=turtle_id)


@_v1.post("/predict-return/{turtle_id}", response_model=PredictReturnResponse)
async def predict_return(turtle_id: str):
    """Phase 2 stub — not yet implemented."""
    return PredictReturnResponse(status="not_implemented")


# ══════════════════════════════════════════════════════════════════════════════
# Shared — Health & Stats
# ══════════════════════════════════════════════════════════════════════════════

_shared = APIRouter(prefix="/ml", tags=["ML Health"])


@_shared.get("/health", response_model=HealthResponseV2)
async def health_check():
    """
    Comprehensive health check — verifies all v2 components are loaded.
    """
    extractor = FeatureExtractor.get_instance()
    index_v1  = FAISSIndexManager.get_instance()
    svc       = PredictService.get_instance()

    try:
        from ml.predict import _faiss_index, _metadata_store
        faiss_v2_loaded = _faiss_index is not None
        faiss_v2_size   = int(_faiss_index.ntotal) if faiss_v2_loaded else 0
        clf_loaded      = True
        from ml.predict import _species_clf
        clf_loaded = _species_clf is not None
    except Exception:
        faiss_v2_loaded = False
        faiss_v2_size   = 0
        clf_loaded      = False

    return HealthResponseV2(
        status="operational" if svc.is_ready else "degraded",
        model_loaded=extractor.model is not None,
        classifier_loaded=clf_loaded,
        faiss_v2_loaded=faiss_v2_loaded,
        faiss_v2_size=faiss_v2_size,
        model_name=settings.ml_model_name,
        embedding_dim=settings.ml_embedding_dim,
        similarity_threshold=settings.new_turtle_threshold,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@_shared.get("/stats", response_model=StatsResponseV2)
async def get_stats():
    """Return current ML service statistics."""
    svc   = PredictService.get_instance()
    stats = svc.get_stats()

    return StatsResponseV2(
        total_species=stats["total_species"],
        total_identities=stats["total_identities"],
        total_embeddings=stats["total_embeddings"],
        faiss_v2_index_size=stats["faiss_v2_index_size"],
        model_name=settings.ml_model_name,
        embedding_dim=settings.ml_embedding_dim,
        similarity_threshold=settings.new_turtle_threshold,
    )


# ── Register all sub-routers ───────────────────────────────────────────────────
router.include_router(_v1)
router.include_router(_shared)
