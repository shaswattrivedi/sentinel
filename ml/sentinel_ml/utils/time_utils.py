from datetime import datetime, timezone
from typing import Union


def ensure_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def to_epoch_seconds(dt: datetime) -> float:
    utc_dt = ensure_utc(dt)
    return utc_dt.timestamp()


TimestampLike = Union[datetime, float, str]


def coerce_timestamp(ts: TimestampLike) -> datetime:
    if isinstance(ts, datetime):
        return ensure_utc(ts)
    if isinstance(ts, str):
        # Try ISO format first
        try:
            dt = datetime.fromisoformat(ts.replace('Z', '+00:00'))
            return ensure_utc(dt)
        except ValueError:
            pass
        # Try epoch timestamp as string
        try:
            return datetime.fromtimestamp(float(ts), tz=timezone.utc)
        except ValueError:
            raise ValueError(f"Cannot parse timestamp: {ts}")
    return datetime.fromtimestamp(float(ts), tz=timezone.utc)
