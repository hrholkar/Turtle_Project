"""
Feature extractor using MobileNetV2 pre-trained on ImageNet.

Architecture choice rationale:
- MobileNetV2 final feature layer produces 1280-dimensional embeddings.
- These embeddings encode fine-grained texture and pattern information,
  which is exactly the discriminative signal needed for turtle neck patterns.
- The model runs efficiently on CPU (no GPU required for prototype).
- Thread-safe: model is loaded once at startup and reused.

Upgrade path:
- Replace MobileNetV2 with a fine-tuned EfficientNet or ViT model
  by swapping the _build_model() method only. The API remains identical.
"""

import torch
import torch.nn as nn
import numpy as np
from torchvision import models
from typing import List
from app.config.settings import settings
from app.services.preprocessing.image_processor import ImageProcessor


class FeatureExtractor:
    """
    Singleton feature extractor using MobileNetV2.

    The final classification layer is removed; we extract the
    global average pooled feature vector (1280-dim) as the embedding.
    """

    _instance: "FeatureExtractor | None" = None

    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = self._build_model()
        self.embedding_dim = settings.ml_embedding_dim
        print(f"[ML] FeatureExtractor initialized on {self.device} — dim={self.embedding_dim}")

    @classmethod
    def get_instance(cls) -> "FeatureExtractor":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _build_model(self) -> nn.Module:
        """
        Load MobileNetV2, remove classification head, add global average pooling.
        The output is a 1280-dim embedding vector.
        """
        model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.IMAGENET1K_V1)
        # Remove final classifier → keep features + avgpool
        model.classifier = nn.Identity()
        model.eval()
        model = model.to(self.device)
        return model

    @torch.no_grad()
    def extract_from_tensor(self, tensor: torch.Tensor) -> np.ndarray:
        """
        Extract normalized embedding from a preprocessed image tensor.

        Returns:
            np.ndarray of shape (1280,), L2-normalized.
        """
        tensor = tensor.to(self.device)
        features = self.model(tensor)  # Shape: (1, 1280)
        embedding = features.squeeze().cpu().numpy()

        # L2 normalize — makes cosine similarity equivalent to dot product
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm

        return embedding.astype(np.float32)

    def extract_from_bytes(self, image_bytes: bytes) -> np.ndarray:
        """Full pipeline: bytes → preprocess → extract embedding."""
        tensor = ImageProcessor.preprocess_bytes(image_bytes)
        return self.extract_from_tensor(tensor)

    def extract_from_path(self, image_path: str) -> np.ndarray:
        """Full pipeline: file path → preprocess → extract embedding."""
        tensor = ImageProcessor.preprocess_path(image_path)
        return self.extract_from_tensor(tensor)

    def embedding_to_list(self, embedding: np.ndarray) -> List[float]:
        """Convert numpy embedding to Python list for JSON serialization."""
        return embedding.tolist()
