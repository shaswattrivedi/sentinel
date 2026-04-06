from fastapi import APIRouter, Depends, HTTPException, status

from api.schemas.input import CameraFrameRequest, SensorTelemetryRequest
from utils.deps import get_aggregation_service, get_ml_service

router = APIRouter(prefix="/api/v1/telemetry", tags=["telemetry"])


@router.post("/sensor")
def ingest_sensor(
    payload: SensorTelemetryRequest,
    ml_service=Depends(get_ml_service),
    agg_service=Depends(get_aggregation_service),
):
    try:
        output = ml_service.run(sensor_payloads=payload.readings, camera_payload=None)
        agg_service.ingest(output)
        return {"status": "ok", "crowd_count": output.fused_crowd_count, "density": output.crowd_density, "risk": output.risk_level}
    except Exception as exc:  # keep surface simple for frontend
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/camera")
def ingest_camera(
    payload: CameraFrameRequest,
    ml_service=Depends(get_ml_service),
    agg_service=Depends(get_aggregation_service),
):
    try:
        sensor_readings = payload.readings or []
        output = ml_service.run(sensor_payloads=sensor_readings, camera_payload=payload.frame)
        agg_service.ingest(output)
        return {"status": "ok", "crowd_count": output.fused_crowd_count, "density": output.crowd_density, "risk": output.risk_level}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
