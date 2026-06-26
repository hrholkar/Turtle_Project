"""
generate_embeddings.py
======================
Batch-extracts MobileNetV2 embeddings for all images in the dataset.

Usage:
    cd backend-ml
    python ml/generate_embeddings.py

Output:
    storage/models/embeddings.pkl  — dict:
        {
          "identity": List[str],     # turtle identity (e.g. "t001")
          "file_name": List[str],    # relative path from data root
          "turtle_type": List[str],  # species label
          "side": List[str],         # "LEFT" | "RIGHT" | "UNKNOWN"
          "embedding": np.ndarray    # shape (N, 1280) float32
        }
"""

import os
import sys
import pickle
import logging
from pathlib import Path

import numpy as np
import pandas as pd
from PIL import Image, ImageOps
import torch
import torch.nn as nn
from torchvision import models, transforms
from tqdm import tqdm

# ── Path bootstrap ──────────────────────────────────────────────────────────────
# Allow imports from backend-ml root when running as script
_REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_REPO_ROOT))

from app.config.settings import settings

logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

# ── Constants ───────────────────────────────────────────────────────────────────
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]

TRANSFORM = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])

BATCH_SIZE = 32


# ── Side heuristic ──────────────────────────────────────────────────────────────
def infer_side_from_image(img: Image.Image) -> str:
    """
    Lightweight left/right heuristic based on horizontal brightness asymmetry.

    Approach:
      - Convert to grayscale
      - Compare mean brightness of left half vs right half
      - If left is noticeably brighter → turtle facing RIGHT (lit from left)
      - If right is noticeably brighter → turtle facing LEFT
      - If similar → UNKNOWN

    This is used as pseudo-labels for training the side detector.
    Not perfectly accurate but provides a statistically useful signal.
    """
    gray = img.convert("L")
    arr = np.array(gray, dtype=np.float32)
    mid = arr.shape[1] // 2
    left_mean  = arr[:, :mid].mean()
    right_mean = arr[:, mid:].mean()
    diff = abs(left_mean - right_mean)

    if diff < 5.0:
        return "UNKNOWN"
    return "LEFT" if right_mean > left_mean else "RIGHT"


# ── Model ───────────────────────────────────────────────────────────────────────
def build_extractor(device: torch.device) -> nn.Module:
    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.IMAGENET1K_V1)
    model.classifier = nn.Identity()
    model.eval()
    return model.to(device)


def load_image(path: str) -> Image.Image | None:
    try:
        img = Image.open(path)
        img = ImageOps.exif_transpose(img)
        if img.mode == "RGBA":
            bg = Image.new("RGB", img.size, (255, 255, 255))
            bg.paste(img, mask=img.split()[3])
            return bg
        return img.convert("RGB")
    except Exception as e:
        log.warning(f"Skipping {path}: {e}")
        return None


@torch.no_grad()
def extract_batch(model: nn.Module, tensors: list, device: torch.device) -> np.ndarray:
    batch = torch.stack(tensors).to(device)
    feats = model(batch)                         # (B, 1280)
    feats = feats.cpu().numpy().astype(np.float32)
    # L2 normalize each row
    norms = np.linalg.norm(feats, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1.0, norms)
    return feats / norms


# ── Main ────────────────────────────────────────────────────────────────────────
def main() -> None:
    log.info("Loading metadata CSV …")
    df = pd.read_csv(settings.dataset_metadata_path)
    # Deduplicate — keep one row per file_name (metadata_splits may have duplicates)
    df = df.drop_duplicates(subset=["file_name"]).reset_index(drop=True)
    log.info(f"  {len(df)} images in metadata")

    data_root = Path(settings.dataset_images_dir).parent  # …/data/
    device    = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    log.info(f"Using device: {device}")

    model = build_extractor(device)

    identities: list[str]  = []
    file_names: list[str]  = []
    species:    list[str]  = []
    sides:      list[str]  = []
    embeddings: list[np.ndarray] = []

    # Buffer for batching
    buf_tensors: list[torch.Tensor] = []
    buf_meta:    list[dict]          = []

    def flush_buffer() -> None:
        if not buf_tensors:
            return
        batch_embs = extract_batch(model, buf_tensors, device)
        for i, meta in enumerate(buf_meta):
            identities.append(meta["identity"])
            file_names.append(meta["file_name"])
            species.append(meta["turtle_type"])
            sides.append(meta["side"])
            embeddings.append(batch_embs[i])
        buf_tensors.clear()
        buf_meta.clear()

    for _, row in tqdm(df.iterrows(), total=len(df), desc="Extracting embeddings"):
        img_path = str(data_root / row["file_name"])
        if not os.path.exists(img_path):
            log.warning(f"Missing: {img_path}")
            continue

        img = load_image(img_path)
        if img is None:
            continue

        side = infer_side_from_image(img)
        tensor = TRANSFORM(img)                  # (3, 224, 224)

        buf_tensors.append(tensor)
        buf_meta.append({
            "identity":    str(row["identity"]),
            "file_name":   str(row["file_name"]),
            "turtle_type": str(row["turtle_type"]),
            "side":        side,
        })

        if len(buf_tensors) >= BATCH_SIZE:
            flush_buffer()

    flush_buffer()  # process remaining

    log.info(f"Extracted {len(embeddings)} embeddings")

    output = {
        "identity":  identities,
        "file_name": file_names,
        "turtle_type": species,
        "side":      sides,
        "embedding": np.array(embeddings, dtype=np.float32),
    }

    out_path = Path(settings.embeddings_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "wb") as f:
        pickle.dump(output, f)

    log.info(f"Saved embeddings → {out_path}")
    log.info(f"  Shape: {output['embedding'].shape}")
    log.info(f"  Species distribution:\n{pd.Series(species).value_counts().to_string()}")
    log.info(f"  Side distribution:\n{pd.Series(sides).value_counts().to_string()}")


if __name__ == "__main__":
    main()
