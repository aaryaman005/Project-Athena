"""
Project Athena - Configuration
Auto-response and system settings
"""

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
AWS_REGION = "us-east-1"
USE_MOCK_DATA = True  # Toggle for simulation vs live AWS

# API Configuration
API_HOST = "0.0.0.0"
API_PORT = 5000

# Metrics
METRICS_ENABLED = True
