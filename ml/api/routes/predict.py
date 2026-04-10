from fastapi import APIRouter, Depends, HTTPException, status

from api.schemas.input import PredictRequest
from api.schemas.output import PredictResponse
from utils.deps import get_aggregation_service, get_ml_service, get_organization_id, get_store

router = APIRouter(tags=["prediction"])


@router.post("/predict", response_model=PredictResponse)
def predict(
    payload: PredictRequest,
    organization_id: str = Depends(get_organization_id),
    ml_service=Depends(get_ml_service),
    agg_service=Depends(get_aggregation_service),
    store=Depends(get_store),
):
    try:
        result = ml_service.run_iot_predict(payload)

        # Keep dashboard timeline/alerts functional using existing aggregation contracts.
        dashboard_output = ml_service.iot_result_to_intelligence_output(payload, result)
        agg_service.ingest(dashboard_output, organization_id)

        # Store hardware status for dashboard display
        store.update_hardware_status(
            risk_score=float(result.get("risk_score", 0.0)),
            system_status=str(result.get("system_status", "SAFE")),
            zone_status=result.get("zone_status", {}),
            zone_data=result.get("zone_data", {}),
            annotated_frames=result.get("annotated_frames", {}),
            trend_prediction=result.get("trend_prediction", {}),
            alerts=agg_service.alerts(organization_id),
            timestamp=dashboard_output.timestamp,
            organization_id=organization_id,
        )

        return result
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
