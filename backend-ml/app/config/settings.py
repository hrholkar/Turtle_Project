from pydantic_settings import BaseSettings
from pathlib import Path
import os

# Base directory of the backend-ml package (i.e. backend-ml/)
_BASE_DIR = Path(__file__).parent.parent.parent
_STORAGE_DIR = _BASE_DIR / "storage"


class Settings(BaseSettings):
    # Server
    ml_host: str = "0.0.0.0"
    ml_port: int = 8000
    ml_workers: int = 1

    # Upload storage
    ml_upload_dir: str = str(_BASE_DIR / "uploads")

    # ── FAISS v1 (legacy — kept for backward compat) ──────────────────────────
    faiss_index_path: str = str(_STORAGE_DIR / "index" / "turtles.index")
    faiss_id_map_path: str = str(_STORAGE_DIR / "index" / "id_map.json")

    # ── FAISS v2 (species + side aware) ───────────────────────────────────────
    faiss_v2_index_path: str = str(_STORAGE_DIR / "index" / "turtles_v2.index")
    metadata_store_path: str = str(_STORAGE_DIR / "index" / "metadata_store.json")

    # ── Trained model artefacts ───────────────────────────────────────────────
    embeddings_path: str = str(_STORAGE_DIR / "models" / "embeddings.pkl")
    species_classifier_path: str = str(_STORAGE_DIR / "models" / "species_classifier.pkl")
    label_encoder_path: str = str(_STORAGE_DIR / "models" / "label_encoder.pkl")
    side_classifier_path: str = str(_STORAGE_DIR / "models" / "side_classifier.pkl")

    # ── Embedding model ───────────────────────────────────────────────────────
    ml_model_name: str = "mobilenet_v2"
    ml_embedding_dim: int = 1280

    # ── Similarity thresholds (v1 legacy) ────────────────────────────────────
    match_threshold_high: float = 0.85
    match_threshold_low: float = 0.65

    # ── New turtle threshold (v2) ─────────────────────────────────────────────
    new_turtle_threshold: float = 0.80   # below this = NEW TURTLE
    top_k_matches: int = 3               # always return top 3

    # ── Search config (v1 legacy) ─────────────────────────────────────────────
    ml_top_k: int = 5

    # ── Dataset path (used by training scripts) ───────────────────────────────
    dataset_images_dir: str = str(
        _BASE_DIR.parent / "dataset" / "turtles-data" / "data" / "images"
    )
    dataset_metadata_path: str = str(
        _BASE_DIR.parent / "dataset" / "turtles-data" / "data" / "metadata_splits.csv"
    )

    model_config = {
        "env_file": str(_BASE_DIR / ".env"),
        "extra": "ignore",
    }


settings = Settings()

# Ensure required directories exist at startup
for path_str in [
    settings.ml_upload_dir,
    str(Path(settings.faiss_index_path).parent),
    str(Path(settings.faiss_v2_index_path).parent),
    str(Path(settings.embeddings_path).parent),
    os.path.join(settings.ml_upload_dir, "turtles"),
    os.path.join(settings.ml_upload_dir, "sightings"),
    os.path.join(settings.ml_upload_dir, "temporary"),
]:
    Path(path_str).mkdir(parents=True, exist_ok=True)
