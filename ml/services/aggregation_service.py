from datetime import datetime
from typing import List, Tuple
from sentinel_ml.outputs.contracts import IntelligenceOutput
from storage.in_memory import InMemoryStore


class AggregationService:
    """Maintains lightweight in-memory history for dashboard-friendly views."""

    def __init__(self, store: InMemoryStore) -> None:
        self.store = store
        self.risk_score_map = {
            "LOW": 20.0,
            "MEDIUM": 60.0,
            "HIGH": 90.0,
            "SAFE": 20.0,
            "MODERATE": 60.0,
            "CRITICAL": 95.0,
        }
        self.risk_color_map = {
            "LOW": "green",
            "MEDIUM": "yellow",
            "HIGH": "red",
            "SAFE": "green",
            "MODERATE": "yellow",
            "CRITICAL": "red",
        }
        self.state_map = {
            "LOW": "NORMAL",
            "MEDIUM": "WARNING",
            "HIGH": "EVACUATE",
            "SAFE": "NORMAL",
            "MODERATE": "WARNING",
            "CRITICAL": "EVACUATE",
        }

    def ingest(self, output: IntelligenceOutput) -> None:
        self.store.add_output(output)

    def _latest(self):
        if not self.store.outputs:
            return None

        return self.store.outputs[-1]


    def overview(self) -> dict:
        latest = self._latest()
        if latest is None:
            return {
                "timestamp": None,
                "zone_id": None,
                "crowd_count": 0,
                "density_level": "UNKNOWN",
                "risk_level": "UNKNOWN",
                "risk_score": 0.0,
                "risk_color": "gray",
                "system_state": "NO_DATA",
                "fusion_confidence": 0.0,
            }

        risk_level = latest.risk_level
        return {
            "timestamp": latest.timestamp,
            "zone_id": latest.zone_id,
            "crowd_count": latest.fused_crowd_count,
            "density_level": latest.crowd_density,
            "risk_level": risk_level,
            "risk_score": self.risk_score_map.get(risk_level, 0.0),
            "risk_color": self.risk_color_map.get(risk_level, "gray"),
            "system_state": self.state_map.get(risk_level, "NORMAL"),
            "fusion_confidence": latest.fusion_confidence,
        }

 
    def timeline(self, limit: int = 200) -> List[dict]:
        points = []
        for o in self.store.get_recent_outputs(limit=limit):
            points.append(
                {
                    "timestamp": o.timestamp,
                    "risk_score": self.risk_score_map.get(o.risk_level, 0.0),
                    "risk_level": o.risk_level,
                    "density_level": o.crowd_density,
                }
            )
        return points

    def flow(self) -> dict:
        outputs = self.store.get_recent_outputs(limit=2)
        if len(outputs) < 2:
            return {
                "timestamp": datetime.now(tz=outputs[0].timestamp.tzinfo) if outputs else datetime.now(),
                "inflow_rate_per_min": 0.0,
                "outflow_rate_per_min": 0.0,
                "net_flow_per_min": 0.0,
            }
        older, newer = outputs[-2], outputs[-1]
        delta_count = newer.fused_crowd_count - older.fused_crowd_count
        delta_seconds = max((newer.timestamp - older.timestamp).total_seconds(), 1.0)
        rate_per_min = (delta_count / delta_seconds) * 60.0
        inflow = max(rate_per_min, 0.0)
        outflow = max(-rate_per_min, 0.0)
        return {
            "timestamp": newer.timestamp,
            "inflow_rate_per_min": inflow,
            "outflow_rate_per_min": outflow,
            "net_flow_per_min": rate_per_min,
        }

    def alerts(self, limit: int = 50) -> List[dict]:
        alert_outputs = self.store.get_recent_alerts(limit=limit)
        return [
            {
                "timestamp": output.timestamp,
                "alert_status": output.alert_status,
                "alert_severity": output.alert_severity,
                "explanation": output.explanation_text,  # Map explanation_text to explanation
            }
            for output in alert_outputs
        ]

    def decision(self) -> dict:
        latest = self._latest()
        if latest is None:
            return {
                "timestamp": None,
                "risk_level": "UNKNOWN",
                "recommendation": "NO_DATA",
                "direction": "NONE",
                "confidence": 0.0,
            }

        return {
            "timestamp": latest.timestamp,
            "risk_level": latest.risk_level,
            "recommendation": latest.recommended_action,
            "direction": latest.directional_guidance,
            "confidence": latest.fusion_confidence,
        }


    def health(self) -> dict:
        return {
            "status": "ok" if self.store.outputs else "waiting",
            "ml_pipeline": "ok",
            "last_inference": self.store.last_inference,
        }



