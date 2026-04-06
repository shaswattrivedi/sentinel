from fastapi import APIRouter, Depends, HTTPException, status

from api.schemas.input import PredictRequest
from api.schemas.output import PredictResponse
from utils.deps import get_aggregation_service, get_ml_service, get_store

router = APIRouter(tags=["prediction"])


@router.post("/predict", response_model=PredictResponse)
def predict(
    payload: PredictRequest,
    ml_service=Depends(get_ml_service),
    agg_service=Depends(get_aggregation_service),
    store=Depends(get_store),
):
    try:
        result = ml_service.run_iot_predict(payload)

        # Keep dashboard timeline/alerts functional using existing aggregation contracts.
        dashboard_output = ml_service.iot_result_to_intelligence_output(payload, result)
        agg_service.ingest(dashboard_output)

        # Store hardware status for dashboard display
        store.update_hardware_status(
            zone_status=result.get("zone_status", {}),
            hardware_commands=result.get("hardware_commands", {}),
            trend_prediction=result.get("trend_prediction", {}),
            timestamp=payload.timestamp,
        )

        return result
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
