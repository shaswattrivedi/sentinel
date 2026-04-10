from functools import lru_cache
import base64
import json

from fastapi import Request
from services.aggregation_service import AggregationService
from services.ml_service import MLService
from storage.in_memory import InMemoryStore


DEFAULT_ORGANIZATION_ID = "default-org"


def _decode_token_payload(token: str) -> dict:
    try:
        parts = token.split(".")
        if len(parts) < 2:
            return {}

        payload = parts[1]
        padding = "=" * (-len(payload) % 4)
        decoded = base64.urlsafe_b64decode(f"{payload}{padding}".encode("utf-8")).decode("utf-8")
        data = json.loads(decoded)
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def get_organization_id(request: Request) -> str:
    explicit_org_id = request.headers.get("x-organization-id", "").strip()
    if explicit_org_id:
        return explicit_org_id

    auth_header = request.headers.get("authorization", "")
    if auth_header.lower().startswith("bearer "):
        token = auth_header[7:].strip()
        payload = _decode_token_payload(token)
        org_id = payload.get("organizationId") or payload.get("organization_id")
        if isinstance(org_id, str) and org_id.strip():
            return org_id.strip()

    return DEFAULT_ORGANIZATION_ID


@lru_cache(maxsize=1)
def get_store() -> InMemoryStore:
    return InMemoryStore()


@lru_cache(maxsize=1)
def get_ml_service() -> MLService:
    return MLService()


@lru_cache(maxsize=1)
def get_aggregation_service() -> AggregationService:
    return AggregationService(store=get_store())
