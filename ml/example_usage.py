from datetime import datetime, timedelta, timezone

from api.schemas.input import PredictRequest
from services.ml_service import MLService


if __name__ == "__main__":
    ml_service = MLService()

    # Sample 1: moderate load
    payload_1 = PredictRequest(
        z1_cam_count=2,
        z2_density_score=65,
        z3_density_score=30,
        timestamp=datetime.now(timezone.utc),
    )
    output_1 = ml_service.run_iot_predict(payload_1)

    # Sample 2 (30s later): rising load to demonstrate density_gradient
    payload_2 = PredictRequest(
        z1_cam_count=7,
        z2_density_score=82,
        z3_density_score=56,
        timestamp=datetime.now(timezone.utc) + timedelta(seconds=30),
    )
    output_2 = ml_service.run_iot_predict(payload_2)

    print("\n=== IoT Prediction #1 ===")
    print(output_1)
    print("\n=== IoT Prediction #2 ===")
    print(output_2)
