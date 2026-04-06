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
from utils.deps import get_aggregation_service, get_store

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard/overview", response_model=OverviewResponse)
def get_overview(agg_service=Depends(get_aggregation_service)):
    return agg_service.overview()


@router.get("/dashboard/timeline", response_model=TimelineResponse)
def get_timeline(agg_service=Depends(get_aggregation_service)):
    return {"points": agg_service.timeline()}


@router.get("/dashboard/flow", response_model=FlowResponse)
def get_flow(agg_service=Depends(get_aggregation_service)):
    return {"points": agg_service.flow()}


@router.get("/dashboard/alerts", response_model=AlertsResponse)
def get_alerts(agg_service=Depends(get_aggregation_service)):
    return {"alerts": agg_service.alerts()}


@router.get("/dashboard/decision", response_model=DecisionResponse)
def get_decision(agg_service=Depends(get_aggregation_service)):
    return agg_service.decision()


@router.get("/dashboard/health", response_model=HealthResponse)
def get_health(agg_service=Depends(get_aggregation_service)):
    return agg_service.health()


@router.get("/dashboard/hardware", response_model=HardwareStatusResponse)
def get_hardware_status(store=Depends(get_store)):
    """Get current hardware status (zone statuses, LED colors, buzzer states, predictions)."""
    hw = store.hardware_status
    if hw.last_updated is None:
        return {
            "timestamp": None,
            "zone_status": {"z1": "UNKNOWN", "z2": "UNKNOWN", "z3": "UNKNOWN"},
            "hardware_commands": {"z2_led": "gray", "z3_led": "gray", "z2_buzzer": False, "z3_buzzer": False},
            "trend_prediction": {"trend": "UNKNOWN", "prediction": "NO_DATA", "predicted_density": 0.0, "confidence": 0.0},
        }
    return {
        "timestamp": hw.last_updated,
        "zone_status": hw.zone_status,
        "hardware_commands": hw.hardware_commands,
        "trend_prediction": hw.trend_prediction,
    }


@router.post("/dashboard/reset")
def reset_dashboard_state(store=Depends(get_store)):
    """Clear in-memory dashboard history and latest hardware status."""
    store.reset()
    return {"status": "ok", "message": "Dashboard state reset"}
