from pydantic import BaseModel, Field
from typing import Optional, List
import time


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
    match_strength: str  # 'strong' | 'probable' | 'new'
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
