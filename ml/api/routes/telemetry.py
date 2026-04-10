from functools import lru_cache

from fastapi import APIRouter, Depends, HTTPException, status

from api.schemas.input import CameraFrameRequest, SensorTelemetryRequest
from sentinel_ml.vision.people_counter import CameraPeopleCounter
from utils.deps import get_aggregation_service, get_ml_service, get_org_id, get_store

router = APIRouter(prefix="/api/v1/telemetry", tags=["telemetry"])


@lru_cache(maxsize=1)
def get_camera_counter() -> CameraPeopleCounter:
    return CameraPeopleCounter()


@router.post("/sensor")
def ingest_sensor(
    payload: SensorTelemetryRequest,
    organization_id: str = Depends(get_org_id),
    ml_service=Depends(get_ml_service),
    agg_service=Depends(get_aggregation_service),
):
    try:
        output = ml_service.run(sensor_payloads=payload.readings, camera_payload=None)
        agg_service.ingest(output, organization_id)
        return {"status": "ok", "crowd_count": output.fused_crowd_count, "density": output.crowd_density, "risk": output.risk_level}
    except Exception as exc:  # keep surface simple for frontend
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/camera")
def ingest_camera(
    payload: CameraFrameRequest,
    organization_id: str = Depends(get_org_id),
    store=Depends(get_store),
    counter=Depends(get_camera_counter),
):
    try:
        frame_payload = payload.to_frame_payload()
        people_count, confidence, annotated_frame = counter.count_and_annotate(frame_payload.frame_b64)
        store.update_camera_snapshot(
            latest_annotated_frame=annotated_frame,
            z1_people_count=people_count,
            timestamp=frame_payload.timestamp,
            organization_id=organization_id,
        )
        return {
            "people_count": people_count,
            "confidence": confidence,
            "annotated_frame": annotated_frame,
            "zone_id": frame_payload.zone_id,
            "timestamp": frame_payload.timestamp,
        }
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
