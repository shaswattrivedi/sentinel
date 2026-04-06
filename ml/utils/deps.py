from functools import lru_cache

from services.aggregation_service import AggregationService
from services.ml_service import MLService
from storage.in_memory import InMemoryStore


@lru_cache(maxsize=1)
def get_store() -> InMemoryStore:
    return InMemoryStore()


@lru_cache(maxsize=1)
def get_ml_service() -> MLService:
    return MLService()


@lru_cache(maxsize=1)
def get_aggregation_service() -> AggregationService:
    return AggregationService(store=get_store())
