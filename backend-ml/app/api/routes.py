"""
ML Service API routes — FastAPI router for identification and index management.
"""

import time
import json
import numpy as np
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional

from app.services.extraction.feature_extractor import FeatureExtractor
from app.services.matching.faiss_index import FAISSIndexManager
from app.services.similarity.scorer import SimilarityScorer
from app.models.schemas import (
    IdentifyResponse,
    RegisterResponse,
    RemoveResponse,
    HealthResponse,
    StatsResponse,
    PredictReturnResponse,
)
from app.config.settings import settings

router = APIRouter(prefix="/ml", tags=["ML"])


@router.post("/identify", response_model=IdentifyResponse)
async def identify_turtle(
    file: UploadFile = File(...),
    top_k: int = Form(default=5),
):
    """
    Process an uploaded turtle image through the full identification pipeline:
    1. Preprocess image (EXIF fix, resize, normalize)
    2. Extract MobileNetV2 embedding (1280-dim)
    3. Search FAISS index for nearest neighbors
    4. Score and classify match strength
    """
    start_time = time.time()

    # Validate file type
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail=f"Unsupported image type: {file.content_type}")

    # Read image bytes
    image_bytes = await file.read()

    # Extract features
    extractor = FeatureExtractor.get_instance()
    embedding = extractor.extract_from_bytes(image_bytes)

    # Search index
    index = FAISSIndexManager.get_instance()
    raw_results = index.search(embedding, top_k=top_k)

    # Score results
    matches, top_score, is_new_turtle, match_strength = SimilarityScorer.score_results(raw_results)

    processing_time_ms = (time.time() - start_time) * 1000

    return IdentifyResponse(
        matches=matches,
        top_score=round(top_score, 4),
        is_new_turtle=is_new_turtle,
        match_strength=match_strength,
        processing_time_ms=round(processing_time_ms, 2),
        embedding_vector=embedding.tolist(),
    )


@router.post("/register", response_model=RegisterResponse)
async def register_turtle(
    turtle_id: str = Form(...),
    file: Optional[UploadFile] = File(default=None),
    embedding_vector: Optional[str] = Form(default=None),
):
    """
    Register a turtle's embedding in the FAISS index.
    Accepts either a raw image file (extracts embedding) or a pre-computed embedding vector.
    """
    extractor = FeatureExtractor.get_instance()
    index = FAISSIndexManager.get_instance()

    if embedding_vector:
        # Use pre-computed embedding
        try:
            vec = json.loads(embedding_vector)
            embedding = np.array(vec, dtype=np.float32)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid embedding_vector JSON")
    elif file:
        image_bytes = await file.read()
        embedding = extractor.extract_from_bytes(image_bytes)
    else:
        raise HTTPException(status_code=400, detail="Either file or embedding_vector must be provided")

    success = index.add(turtle_id, embedding)

    return RegisterResponse(
        success=success,
        turtle_id=turtle_id,
        message=f"Turtle {turtle_id} registered in index (total: {index.size})",
    )


@router.delete("/embeddings/{turtle_id}", response_model=RemoveResponse)
async def remove_embedding(turtle_id: str):
    """Remove a turtle's embedding from the FAISS index (logical delete)."""
    index = FAISSIndexManager.get_instance()
    success = index.remove(turtle_id)

    if not success:
        raise HTTPException(status_code=404, detail=f"Turtle {turtle_id} not found in index")

    return RemoveResponse(success=True, turtle_id=turtle_id)


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """ML service health check — verifies model is loaded and index is accessible."""
    extractor = FeatureExtractor.get_instance()
    index = FAISSIndexManager.get_instance()

    return HealthResponse(
        status="operational",
        model_loaded=extractor.model is not None,
        index_size=index.size,
        model_name=settings.ml_model_name,
        embedding_dim=settings.ml_embedding_dim,
        timestamp=datetime.utcnow().isoformat(),
    )


@router.get("/stats", response_model=StatsResponse)
async def get_stats():
    """Return current ML service configuration and index statistics."""
    index = FAISSIndexManager.get_instance()

    return StatsResponse(
        index_size=index.size,
        model_name=settings.ml_model_name,
        embedding_dim=settings.ml_embedding_dim,
        match_threshold_high=settings.match_threshold_high,
        match_threshold_low=settings.match_threshold_low,
        top_k=settings.ml_top_k,
    )


@router.post("/predict-return/{turtle_id}", response_model=PredictReturnResponse)
async def predict_return(turtle_id: str):
    """
    Phase 2 Stub: Predict when a turtle will return based on historical sighting patterns.
    Not yet implemented — returns placeholder response.
    """
    return PredictReturnResponse(status="not_implemented")
