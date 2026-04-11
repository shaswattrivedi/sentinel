from functools import lru_cache
import base64
import json
import os
from typing import Optional

from fastapi import Header, Request
from services.aggregation_service import AggregationService
from services.ml_service import MLService
from storage.in_memory import InMemoryStore


DEFAULT_ORGANIZATION_ID = "default-org"
DEMO_SHARED_ORG_ID = (os.getenv("DEMO_SHARED_ORG_ID", "demo-shared-org") or "demo-shared-org").strip()
DEMO_BROADCAST_ALL_ORGS = (os.getenv("DEMO_BROADCAST_ALL_ORGS", "false") or "false").strip().lower() in {
    "1",
    "true",
    "yes",
    "on",
}


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


async def get_org_id(request: Request, x_organization_id: Optional[str] = Header(default=None)) -> str:
    explicit_org_id = (x_organization_id or "").strip()
    if explicit_org_id:
        return explicit_org_id

    if DEMO_BROADCAST_ALL_ORGS:
        return DEMO_SHARED_ORG_ID or DEFAULT_ORGANIZATION_ID

    auth_header = request.headers.get("authorization", "")
    if auth_header.lower().startswith("bearer "):
        token = auth_header[7:].strip()
        payload = _decode_token_payload(token)
        org_id = payload.get("organizationId") or payload.get("organization_id")
        if isinstance(org_id, str) and org_id.strip():
            return org_id.strip()

    return DEFAULT_ORGANIZATION_ID


async def get_organization_id(request: Request, x_organization_id: Optional[str] = Header(default=None)) -> str:
    """Backward-compatible alias for existing imports."""
    return await get_org_id(request=request, x_organization_id=x_organization_id)


@lru_cache(maxsize=1)
def get_store() -> InMemoryStore:
    return InMemoryStore()


@lru_cache(maxsize=1)
def get_ml_service() -> MLService:
    return MLService()


@lru_cache(maxsize=1)
def get_aggregation_service() -> AggregationService:
    return AggregationService(store=get_store())
