from collections import deque
from typing import Deque, Optional


class MovingAverageSmoother:
    """Simple moving average smoother for short windows."""

    def __init__(self, window_size: int = 5) -> None:
        if window_size <= 0:
            raise ValueError("window_size must be positive")
        self.window_size = window_size
        self.values: Deque[float] = deque(maxlen=window_size)

    def update(self, value: float) -> float:
        self.values.append(value)
        return self.value

    @property
    def value(self) -> float:
        if not self.values:
            return 0.0
        return sum(self.values) / len(self.values)


class ExponentialSmoother:
    """Exponential smoothing for responsive yet stable estimates."""

    def __init__(self, alpha: float = 0.5) -> None:
        if not 0.0 < alpha <= 1.0:
            raise ValueError("alpha must be in (0, 1]")
        self.alpha = alpha
        self._state: Optional[float] = None

    def update(self, value: float) -> float:
        if self._state is None:
            self._state = value
        else:
            self._state = self.alpha * value + (1.0 - self.alpha) * self._state
        return self._state

    @property
    def value(self) -> float:
        return self._state if self._state is not None else 0.0
