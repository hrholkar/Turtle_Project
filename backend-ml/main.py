"""
TurtleTrack ML Service — FastAPI Application Entry Point (v2)
"""

# Fix Windows OpenMP conflict between PyTorch and FAISS
# Must be set BEFORE any torch or faiss import
import os
os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.config.settings import settings
from app.services.extraction.feature_extractor import FeatureExtractor
from app.services.matching.faiss_index import FAISSIndexManager
from app.services.predict_service import PredictService

log = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup: pre-load all ML models into memory to avoid cold-start latency.

    Load order:
      1. MobileNetV2 feature extractor (shared by v1 + v2)
      2. FAISS v1 index (legacy — used by /ml/identify)
      3. PredictService v2 (species classifier + FAISS v2 + metadata store)
    """
    log.info("[Startup] Loading MobileNetV2 feature extractor …")
    FeatureExtractor.get_instance()

    log.info("[Startup] Loading FAISS v1 index (legacy) …")
    FAISSIndexManager.get_instance()

    log.info("[Startup] Loading PredictService v2 (species clf + FAISS v2) …")
    svc = PredictService.get_instance()
    if svc.is_ready:
        log.info("[Startup] ✅ All ML models loaded successfully.")
    else:
        log.warning(
            "[Startup] ⚠️  PredictService not ready: %s\n"
            "          Run the training pipeline first:\n"
            "            python ml/generate_embeddings.py\n"
            "            python ml/train_species_classifier.py\n"
            "            python ml/build_faiss.py",
            svc.load_error,
        )

    yield

    log.info("[Shutdown] Shutting down TurtleTrack ML Service …")


app = FastAPI(
    title="TurtleTrack ML Service",
    description=(
        "Sea turtle re-identification service.\n\n"
        "**v2 Pipeline**: `POST /predict`\n"
        "- Upload a turtle image (optionally specify LEFT / RIGHT side)\n"
        "- Species is predicted automatically\n"
        "- FAISS search is scoped to the predicted species + side\n"
        "- Returns Top 3 matching individuals, or NEW TURTLE DETECTED\n\n"
        "**v1 Legacy**: `POST /ml/identify` (FAISS-only, no species filter)"
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(router)


@app.get("/", tags=["Root"])
async def root():
    return {
        "service":  "TurtleTrack ML Service",
        "version":  "2.0.0",
        "docs":     "/docs",
        "health":   "/ml/health",
        "predict":  "POST /predict",
        "register": "POST /register_new_turtle",
    }


if __name__ == "__main__":
    import uvicorn
    is_dev = settings.ml_workers <= 1
    uvicorn.run(
        "main:app",
        host=settings.ml_host,
        port=settings.ml_port,
        workers=1 if is_dev else settings.ml_workers,
        reload=is_dev,
        log_level="info",
    )
