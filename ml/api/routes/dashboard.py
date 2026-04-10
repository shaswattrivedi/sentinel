from fastapi import APIRouter, Depends, HTTPException, status
from api.schemas.output import (
    AlertsResponse,
    DecisionResponse,
    FlowResponse,
    HealthResponse,
    HardwareStatusResponse,
    OverviewResponse,
    TimelineResponse,
)
from utils.deps import get_aggregation_service, get_org_id, get_store

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard/overview", response_model=OverviewResponse)
def get_overview(organization_id: str = Depends(get_org_id), agg_service=Depends(get_aggregation_service)):
    return agg_service.overview(organization_id)


@router.get("/dashboard/timeline", response_model=TimelineResponse)
def get_timeline(organization_id: str = Depends(get_org_id), agg_service=Depends(get_aggregation_service)):
    return {"points": agg_service.timeline(organization_id)}


@router.get("/dashboard/flow", response_model=FlowResponse)
def get_flow(organization_id: str = Depends(get_org_id), agg_service=Depends(get_aggregation_service)):
    return {"points": agg_service.flow(organization_id)}


@router.get("/dashboard/alerts", response_model=AlertsResponse)
def get_alerts(organization_id: str = Depends(get_org_id), agg_service=Depends(get_aggregation_service)):
    return {"alerts": agg_service.alerts(organization_id)}


@router.get("/dashboard/decision", response_model=DecisionResponse)
def get_decision(organization_id: str = Depends(get_org_id), agg_service=Depends(get_aggregation_service)):
    return agg_service.decision(organization_id)


@router.get("/dashboard/health", response_model=HealthResponse)
def get_health(organization_id: str = Depends(get_org_id), agg_service=Depends(get_aggregation_service)):
    return agg_service.health(organization_id)


@router.get("/dashboard/hardware", response_model=HardwareStatusResponse)
def get_hardware_status(organization_id: str = Depends(get_org_id), store=Depends(get_store)):
    """Get current two-zone super-node snapshot."""
    hw = store.get_hardware_status(organization_id)

    return {
        "risk_score": hw.risk_score,
        "system_status": hw.system_status,
        "zone_status": hw.zone_status,
        "zone_data": hw.zone_data,
        "annotated_frames": hw.annotated_frames,
        "trend_prediction": hw.trend_prediction,
        "alerts": hw.alerts,
        "timestamp": hw.timestamp,
    }


@router.get("/dashboard/snapshot", response_model=HardwareStatusResponse)
def get_dashboard_snapshot(organization_id: str = Depends(get_org_id), store=Depends(get_store)):
    """Alias endpoint for the latest hardware/status snapshot."""
    return get_hardware_status(organization_id=organization_id, store=store)


@router.post("/dashboard/reset")
def reset_dashboard_state(organization_id: str = Depends(get_org_id), store=Depends(get_store)):
    """Clear in-memory dashboard history and latest hardware status."""
    store.reset(organization_id)
    return {"status": "ok", "message": "Dashboard state reset"}
