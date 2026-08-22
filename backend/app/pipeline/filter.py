from typing import Dict, Any

# Events categorized as High-Value Security
HIGH_VALUE_EVENT_TYPES = {
    "AUTHENTICATION_FAILURE",
    "AUTHENTICATION_SUCCESS",
    "PRIVILEGE_ESCALATION",
    "PORT_SCAN",
    "CONNECTION_BLOCKED",
    "UNAUTHORIZED_ACCESS",
}

def apply_noise_filter(normalized_data: Dict[str, Any]) -> bool:
    """
    Stage 5: Noise Filtering Engine.
    Determines whether a log is low-value chatter (is_noise=True) or high-value security (is_noise=False).
    Note: Filtered-out noise logs are STILL saved and queryable, fulfilling zero-data-loss requirement.
    """
    ev_type = normalized_data.get("event_type")
    severity = normalized_data.get("severity", "LOW")

    # High severity or critical security event types are never noise
    if ev_type in HIGH_VALUE_EVENT_TYPES or severity in ("HIGH", "CRITICAL"):
        return False

    # Low severity system chatter or malformed logs default to noise
    if ev_type in ("SYSTEM_CHATTER", "CONNECTION_ALLOWED", "MALFORMED_LOG") and severity in ("LOW", "INFO"):
        return True

    return False
