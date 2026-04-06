from fastapi import APIRouter, Depends, HTTPException, status

from api.schemas.input import PredictRequest
from api.schemas.output import PredictResponse
from utils.deps import get_aggregation_service, get_ml_service

router = APIRouter(tags=["prediction"])


@router.post("/predict", response_model=PredictResponse)
def predict(
    payload: PredictRequest,
    ml_service=Depends(get_ml_service),
    agg_service=Depends(get_aggregation_service),
):
    try:
        result = ml_service.run_iot_predict(payload)

        # Keep dashboard timeline/alerts functional using existing aggregation contracts.
        dashboard_output = ml_service.iot_result_to_intelligence_output(payload, result)
        agg_service.ingest(dashboard_output)
        return result
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
