"""
app/models/schemas.py
=====================
Pydantic v2 schemas for the TurtleTrack ML Service API.

v1 schemas (legacy /identify, /register, /stats) are kept for backward compat.
v2 schemas power the new /predict and /register_new_turtle endpoints.
"""

from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


# ══════════════════════════════════════════════════════════════════════════════
# v1 — Legacy schemas (backward compatible)
# ══════════════════════════════════════════════════════════════════════════════

class IdentifyRequest(BaseModel):
    top_k: int = Field(default=5, ge=1, le=20)


class MatchResult(BaseModel):
    turtle_id: str
    score: float
    rank: int


class IdentifyResponse(BaseModel):
    matches: List[MatchResult]
    top_score: float
    is_new_turtle: bool
    match_strength: str          # 'strong' | 'probable' | 'new'
    processing_time_ms: float
    embedding_vector: Optional[List[float]] = None


class RegisterRequest(BaseModel):
    turtle_id: str
    embedding_vector: Optional[List[float]] = None


class RegisterResponse(BaseModel):
    success: bool
    turtle_id: str
    message: str


class RemoveResponse(BaseModel):
    success: bool
    turtle_id: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    index_size: int
    model_name: str
    embedding_dim: int
    timestamp: str


class StatsResponse(BaseModel):
    index_size: int
    model_name: str
    embedding_dim: int
    match_threshold_high: float
    match_threshold_low: float
    top_k: int


class PredictReturnResponse(BaseModel):
    predicted_return_year: None = None
    confidence: None = None
    status: str = "not_implemented"


# ══════════════════════════════════════════════════════════════════════════════
# v2 — New prediction pipeline schemas
# ══════════════════════════════════════════════════════════════════════════════

class TopMatch(BaseModel):
    """One entry in the top-3 match list."""
    identity:    str
    similarity:  float   = Field(description="Cosine similarity expressed as percentage (0–100)")
    species:     Optional[str]  = None
    first_seen:  Optional[int]  = Field(default=None, description="Earliest year the identity was sighted")
    latest_seen: Optional[int]  = Field(default=None, description="Most recent year the identity was sighted")
    location:    Optional[str]  = None


class PredictMatchedResponse(BaseModel):
    """Returned when at least one match exceeds the similarity threshold."""
    matched:             bool = True
    predicted_species:   str
    species_confidence:  float = Field(description="Species classifier confidence (0–100 %)")
    image_side:          str  = Field(description="Effective side used for filtering: LEFT | RIGHT | UNKNOWN")
    top_matches:         List[TopMatch]


class PredictNewTurtleResponse(BaseModel):
    """Returned when no match exceeds the similarity threshold."""
    matched:             bool = False
    predicted_species:   str
    species_confidence:  float
    image_side:          str
    message:             str = "NEW TURTLE DETECTED"
    new_identity:        str


class RegisterNewTurtleRequest(BaseModel):
    """Body fields for /register_new_turtle (non-file fields)."""
    identity:   str
    species:    str
    image_side: str  = "AUTO"
    location:   Optional[str] = None
    year:       Optional[int] = None
    notes:      Optional[str] = None


class RegisterNewTurtleResponse(BaseModel):
    success:   bool
    identity:  str
    faiss_idx: int
    side:      str
    message:   str


class HealthResponseV2(BaseModel):
    """Extended health check covering all v2 components."""
    status:              str
    model_loaded:        bool
    classifier_loaded:   bool
    faiss_v2_loaded:     bool
    faiss_v2_size:       int
    model_name:          str
    embedding_dim:       int
    similarity_threshold: float
    timestamp:           str


class StatsResponseV2(BaseModel):
    """v2 statistics endpoint."""
    total_species:      int
    total_identities:   int
    total_embeddings:   int
    faiss_v2_index_size: int
    model_name:         str
    embedding_dim:      int
    similarity_threshold: float
