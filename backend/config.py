import os

# Auto-Response Configuration
AUTO_RESPONSE_CONFIG = {
    "enabled": True,
    "strategy": "severity_based",
    
    # Severity-based thresholds
    # Format: {severity: min_confidence_score}
    "severity_thresholds": {
        "CRITICAL": 0.85,  # CRITICAL alerts with 85%+ confidence auto-approve
        "HIGH": 0.80,      # HIGH alerts with 80%+ confidence auto-approve
        # MEDIUM and LOW always require manual approval
    },
    
    # Action-type filtering (future enhancement)
    "safe_actions": [
        "NOTIFY_SOC",
        "REVOKE_SESSIONS",
        "DETACH_POLICY"
    ],
    
    # Time-based auto-escalation (disabled for now)
    "auto_escalate_hours": None,
    
    # Logging
    "log_auto_approvals": True
}

# AWS Configuration
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
USE_MOCK_DATA = os.getenv("USE_MOCK_DATA", "True").lower() == "true"
AWS_ENDPOINT_URL = os.getenv("AWS_ENDPOINT_URL", "http://localhost:4566")

# API Configuration
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("PORT", 5000))

# Metrics
METRICS_ENABLED = os.getenv("METRICS_ENABLED", "True").lower() == "true"

# Security
JWT_SECRET = os.getenv("JWT_SECRET", "athena-secure-secret-2026-replace-in-prod")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60 * 24))
