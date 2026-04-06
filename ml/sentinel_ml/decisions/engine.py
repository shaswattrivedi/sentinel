from typing import Dict, Tuple


class DecisionEngine:
    """Deterministic decision logic mapping risk to alerts and actions."""

    def decide(self, density: str, risk_level: str) -> Dict[str, object]:
        if risk_level == "HIGH":
            return {
                "alert_status": True,
                "alert_severity": "CRITICAL",
                "recommended_action": "Initiate evacuation. Direct occupants to nearest exits and open relief corridors.",
                "directional_guidance": "Guide flow to primary and secondary exits; block inflow where possible.",
                "explanation": f"Risk {risk_level} driven by density {density}. Immediate evacuation advised.",
            }

        if risk_level == "MEDIUM":
            return {
                "alert_status": True,
                "alert_severity": "ELEVATED",
                "recommended_action": "Issue crowding alert. Prepare stewards and open additional egress lanes.",
                "directional_guidance": "Meter inflow; route occupants toward main exit; keep secondary exit ready.",
                "explanation": f"Risk {risk_level} with density {density}. Mitigate and monitor closely.",
            }

        return {
            "alert_status": False,
            "alert_severity": "NORMAL",
            "recommended_action": "Monitor conditions. No evacuation required.",
            "directional_guidance": "Maintain normal guidance signage.",
            "explanation": f"Risk {risk_level} with density {density}. Conditions stable.",
        }
