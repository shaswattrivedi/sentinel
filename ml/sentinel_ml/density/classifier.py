from dataclasses import dataclass
from typing import Tuple


@dataclass
class DensityThresholds:
    low_max: float = 5.0
    medium_max: float = 15.0


class CrowdDensityClassifier:
    """Deterministic density classifier using tunable thresholds."""

    def __init__(self, thresholds: DensityThresholds = DensityThresholds()) -> None:
        self.thresholds = thresholds

    def classify(self, count: float) -> Tuple[str, str]:
        if count < self.thresholds.low_max:
            return "LOW", f"Count {count:.1f} below {self.thresholds.low_max}"
        if count < self.thresholds.medium_max:
            return "MEDIUM", f"Count {count:.1f} between {self.thresholds.low_max}-{self.thresholds.medium_max}"
        return "HIGH", f"Count {count:.1f} above {self.thresholds.medium_max}"
