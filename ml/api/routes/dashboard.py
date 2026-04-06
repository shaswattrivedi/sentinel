from fastapi import APIRouter, Depends, HTTPException, status
from api.schemas.output import (
    AlertsResponse,
    DecisionResponse,
    FlowResponse,
    HealthResponse,
    OverviewResponse,
    TimelineResponse,
)
from utils.deps import get_aggregation_service

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard/overview", response_model=OverviewResponse)
def get_overview(agg_service=Depends(get_aggregation_service)):
    return agg_service.overview()


@router.get("/dashboard/timeline", response_model=TimelineResponse)
def get_timeline(agg_service=Depends(get_aggregation_service)):
    return {"points": agg_service.timeline()}


@router.get("/dashboard/flow", response_model=FlowResponse)
def get_flow(agg_service=Depends(get_aggregation_service)):
    return agg_service.flow()


@router.get("/dashboard/alerts", response_model=AlertsResponse)
def get_alerts(agg_service=Depends(get_aggregation_service)):
    return {"alerts": agg_service.alerts()}


@router.get("/dashboard/decision", response_model=DecisionResponse)
def get_decision(agg_service=Depends(get_aggregation_service)):
    return agg_service.decision()


@router.get("/dashboard/health", response_model=HealthResponse)
def get_health(agg_service=Depends(get_aggregation_service)):
    return agg_service.health()
