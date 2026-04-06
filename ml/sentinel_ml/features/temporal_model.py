import math
from collections import deque
from dataclasses import dataclass
from datetime import datetime
from typing import Deque, List, Tuple

from sentinel_ml.utils.time_utils import coerce_timestamp


@dataclass
class TemporalFeatures:
    count: float
    rate_of_change: float
    volatility: float
    trend: float
    duration_in_state_sec: float


class TemporalCrowdModel:
    """Maintains rolling window of fused counts to derive temporal features."""

    def __init__(self, window: int = 30) -> None:
        self.window = window
        self.history: Deque[Tuple[datetime, float]] = deque(maxlen=window)
        self.last_density: str = "UNKNOWN"
        self.last_state_change: datetime = coerce_timestamp(datetime.utcnow().timestamp())

    def update(self, timestamp: datetime, fused_count: float) -> TemporalFeatures:
        ts = coerce_timestamp(timestamp)
        self.history.append((ts, fused_count))
        rate = self._rate()
        volatility = self._volatility()
        trend = self._trend()
        duration = self._state_duration(ts)
        return TemporalFeatures(
            count=fused_count,
            rate_of_change=rate,
            volatility=volatility,
            trend=trend,
            duration_in_state_sec=duration,
        )

    def _rate(self) -> float:
        if len(self.history) < 2:
            return 0.0
        (t0, c0), (t1, c1) = self.history[-2], self.history[-1]
        delta_seconds = max((t1 - t0).total_seconds(), 1e-3)
        return (c1 - c0) / delta_seconds

    def _volatility(self) -> float:
        if len(self.history) < 2:
            return 0.0
        values = [c for _, c in self.history]
        mean = sum(values) / len(values)
        variance = sum((c - mean) ** 2 for c in values) / len(values)
        return math.sqrt(variance)

    def _trend(self) -> float:
        if len(self.history) < 3:
            return 0.0
        counts = [c for _, c in self.history]
        return (counts[-1] - counts[0]) / max(len(counts) - 1, 1)

    def _state_duration(self, now_ts: datetime) -> float:
        return (now_ts - self.last_state_change).total_seconds()

    def notify_density(self, density_label: str, timestamp: datetime) -> None:
        if density_label != self.last_density:
            self.last_density = density_label
            self.last_state_change = coerce_timestamp(timestamp)
