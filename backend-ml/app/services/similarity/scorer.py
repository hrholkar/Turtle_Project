"""
Similarity scorer — translates raw FAISS scores into conservation-meaningful classifications.

Thresholds (configurable via .env):
  score >= 0.85  →  'strong'   match  (high confidence, auto-suggest)
  score >= 0.65  →  'probable' match  (requires admin review)
  score <  0.65  →  'new'      turtle (pending verification)
"""

from typing import List, Tuple
from app.config.settings import settings
from app.models.schemas import MatchResult


class SimilarityScorer:
    """Converts raw FAISS search results into structured match decisions."""

    @staticmethod
    def classify(score: float) -> str:
        """
        Classify a similarity score into a match strength category.

        Returns: 'strong' | 'probable' | 'new'
        """
        if score >= settings.match_threshold_high:
            return "strong"
        elif score >= settings.match_threshold_low:
            return "probable"
        return "new"

    @staticmethod
    def score_results(raw_results: List[Tuple[str, float]]) -> Tuple[List[MatchResult], float, bool, str]:
        """
        Process raw (turtle_id, score) pairs into structured MatchResult objects.

        Returns:
            matches        - Ranked list of MatchResult
            top_score      - Score of best match (0.0 if no results)
            is_new_turtle  - True if no strong or probable match found
            match_strength - Overall match strength category
        """
        if not raw_results:
            return [], 0.0, True, "new"

        matches = [
            MatchResult(
                turtle_id=turtle_id,
                score=round(score, 4),
                rank=rank + 1,
            )
            for rank, (turtle_id, score) in enumerate(raw_results)
        ]

        top_score = matches[0].score
        match_strength = SimilarityScorer.classify(top_score)
        is_new_turtle = match_strength == "new"

        return matches, top_score, is_new_turtle, match_strength
