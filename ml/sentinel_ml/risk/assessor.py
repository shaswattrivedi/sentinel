from typing import Tuple

from sentinel_ml.features.temporal_model import TemporalFeatures


class RiskAssessor:
    """Explainable risk assessment based on density, growth, volatility, and persistence."""

    def __init__(
        self,
        high_growth_threshold: float = 0.4,
        high_volatility_threshold: float = 3.0,
        persistence_threshold_sec: float = 120.0,
    ) -> None:
        self.high_growth_threshold = high_growth_threshold
        self.high_volatility_threshold = high_volatility_threshold
        self.persistence_threshold_sec = persistence_threshold_sec

    def assess(self, density: str, features: TemporalFeatures) -> Tuple[str, str]:
        growth = features.rate_of_change
        volatility = features.volatility
        duration = features.duration_in_state_sec

        if density == "HIGH" and (growth > self.high_growth_threshold or duration > self.persistence_threshold_sec):
            reason = "HIGH: sustained congestion or rapid growth"
            return "HIGH", reason

        if density == "MEDIUM" and growth > self.high_growth_threshold:
            reason = "MEDIUM: medium density with rapid inflow"
            return "MEDIUM", reason

        if density == "HIGH" and volatility > self.high_volatility_threshold:
            reason = "MEDIUM: high density but unstable counts"
            return "MEDIUM", reason

        if density == "MEDIUM" and duration > self.persistence_threshold_sec:
            reason = "MEDIUM: persistent medium density"
            return "MEDIUM", reason

        return "LOW", "LOW: stable conditions"
