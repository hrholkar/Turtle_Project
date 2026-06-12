from pydantic_settings import BaseSettings
from pathlib import Path
import os


class Settings(BaseSettings):
    # Server
    ml_host: str = "0.0.0.0"
    ml_port: int = 8000
    ml_workers: int = 1

    # Upload storage
    ml_upload_dir: str = str(Path(__file__).parent.parent.parent / "uploads")

    # FAISS index persistence
    faiss_index_path: str = str(Path(__file__).parent.parent / "storage" / "index" / "turtles.index")
    faiss_id_map_path: str = str(Path(__file__).parent.parent / "storage" / "index" / "id_map.json")

    # Model
    ml_model_name: str = "mobilenet_v2"
    ml_embedding_dim: int = 1280

    # Similarity thresholds
    match_threshold_high: float = 0.85
    match_threshold_low: float = 0.65

    # Search config
    ml_top_k: int = 5

    class Config:
        env_file = str(Path(__file__).parent.parent.parent / ".env")
        extra = "ignore"


settings = Settings()

# Ensure required directories exist
for path_str in [
    settings.ml_upload_dir,
    str(Path(settings.faiss_index_path).parent),
    str(Path(settings.faiss_id_map_path).parent),
    os.path.join(settings.ml_upload_dir, "turtles"),
    os.path.join(settings.ml_upload_dir, "sightings"),
    os.path.join(settings.ml_upload_dir, "temporary"),
]:
    Path(path_str).mkdir(parents=True, exist_ok=True)
