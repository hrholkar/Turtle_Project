"""
FAISS Index Manager for turtle embedding storage and similarity search.

Design decisions:
- IndexFlatIP: Inner product search (equivalent to cosine similarity on L2-normalized vectors).
- Thread-safe write operations via a threading.Lock.
- Index + ID map persisted to disk on every write operation.
- On startup: loads existing index if available, otherwise creates fresh index.

Upgrade path:
- For >10,000 turtles: swap IndexFlatIP for IndexIVFFlat with nlist clusters.
- Add GPU support with faiss.index_cpu_to_gpu().
"""

import faiss
import json
import numpy as np
import threading
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from app.config.settings import settings


class FAISSIndexManager:
    """
    Thread-safe FAISS index manager.

    Stores:
    - faiss.IndexFlatIP: The embedding search index (inner product = cosine sim for L2-normalized)
    - id_map: Maps FAISS integer indices → turtle_id strings
    """

    _instance: "FAISSIndexManager | None" = None
    _lock: threading.Lock = threading.Lock()

    def __init__(self):
        self._write_lock = threading.Lock()
        self.index_path = Path(settings.faiss_index_path)
        self.id_map_path = Path(settings.faiss_id_map_path)
        self.embedding_dim = settings.ml_embedding_dim

        # id_map: { faiss_int_idx (str) → turtle_id }
        # We keep a reverse map too for O(1) turtle_id lookups
        self._id_map: Dict[int, str] = {}         # faiss_idx → turtle_id
        self._turtle_to_idx: Dict[str, int] = {}  # turtle_id → faiss_idx

        self.index = self._load_or_create_index()
        print(f"[ML] FAISS index loaded — {self.index.ntotal} turtles indexed")

    @classmethod
    def get_instance(cls) -> "FAISSIndexManager":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def _load_or_create_index(self) -> faiss.IndexFlatIP:
        if self.index_path.exists() and self.id_map_path.exists():
            try:
                index = faiss.read_index(str(self.index_path))
                with open(self.id_map_path, "r") as f:
                    raw_map = json.load(f)
                self._id_map = {int(k): v for k, v in raw_map.items()}
                self._turtle_to_idx = {v: int(k) for k, v in raw_map.items()}
                return index
            except Exception as e:
                print(f"[ML] Failed to load FAISS index ({e}), creating fresh index.")

        return faiss.IndexFlatIP(self.embedding_dim)

    def _persist(self):
        """Save index and id map to disk."""
        self.index_path.parent.mkdir(parents=True, exist_ok=True)
        faiss.write_index(self.index, str(self.index_path))
        with open(self.id_map_path, "w") as f:
            json.dump({str(k): v for k, v in self._id_map.items()}, f)

    def add(self, turtle_id: str, embedding: np.ndarray) -> bool:
        """
        Add or update a turtle embedding in the index.
        If turtle_id already exists, it is effectively updated
        (we add a new vector; old one remains but is shadowed by id_map).
        """
        embedding = embedding.reshape(1, -1).astype(np.float32)

        with self._write_lock:
            if turtle_id in self._turtle_to_idx:
                # For simplicity at prototype scale: just add a new vector
                # The id_map always points to the latest one
                pass

            faiss_idx = self.index.ntotal
            self.index.add(embedding)
            self._id_map[faiss_idx] = turtle_id
            self._turtle_to_idx[turtle_id] = faiss_idx
            self._persist()

        return True

    def search(self, embedding: np.ndarray, top_k: int = 5) -> List[Tuple[str, float]]:
        """
        Search for nearest neighbors.

        Returns:
            List of (turtle_id, score) tuples, sorted by score descending.
            Scores are inner products (cosine similarity for normalized vectors), range 0-1.
        """
        if self.index.ntotal == 0:
            return []

        embedding = embedding.reshape(1, -1).astype(np.float32)
        k = min(top_k, self.index.ntotal)

        distances, indices = self.index.search(embedding, k)

        results = []
        seen_turtle_ids = set()

        for dist, idx in zip(distances[0], indices[0]):
            if idx == -1:
                continue
            turtle_id = self._id_map.get(int(idx))
            if turtle_id and turtle_id not in seen_turtle_ids:
                # Clamp score to [0, 1] — inner product can slightly exceed 1.0 due to float precision
                score = float(min(max(dist, 0.0), 1.0))
                results.append((turtle_id, score))
                seen_turtle_ids.add(turtle_id)

        return results

    def remove(self, turtle_id: str) -> bool:
        """
        Remove a turtle from the id_map (logical delete).
        FAISS IndexFlatIP doesn't support true deletion; the vector remains
        but will never be returned since its id_map entry is removed.
        """
        with self._write_lock:
            if turtle_id not in self._turtle_to_idx:
                return False

            faiss_idx = self._turtle_to_idx.pop(turtle_id)
            self._id_map.pop(faiss_idx, None)
            self._persist()

        return True

    @property
    def size(self) -> int:
        return len(self._turtle_to_idx)

    def contains(self, turtle_id: str) -> bool:
        return turtle_id in self._turtle_to_idx
