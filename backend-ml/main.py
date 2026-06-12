"""
TurtleTrack ML Service — FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api.routes import router
from app.config.settings import settings
from app.services.extraction.feature_extractor import FeatureExtractor
from app.services.matching.faiss_index import FAISSIndexManager


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup: pre-load ML model and FAISS index into memory.
    This avoids cold-start latency on the first request.
    """
    print("\n[ML] Loading MobileNetV2 feature extractor...")
    FeatureExtractor.get_instance()

    print("[ML] Loading FAISS index...")
    FAISSIndexManager.get_instance()

    print("[ML] ✓ ML Service ready\n")
    yield
    print("[ML] Shutting down ML Service")


app = FastAPI(
    title="TurtleTrack ML Service",
    description=(
        "Sea turtle re-identification service using MobileNetV2 feature extraction "
        "and FAISS cosine similarity search."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
async def root():
    return {
        "service": "TurtleTrack ML Service",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/ml/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.ml_host,
        port=settings.ml_port,
        workers=settings.ml_workers,
        reload=True,
    )
