"""
Project Athena - Audit Logging System
Tracks all system actions, scans, and responses.
"""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List
import json
import os

@dataclass
class AuditLog:
    id: str
    timestamp: datetime
    action: str
    actor: str
    target: Optional[str]
    status: str
    details: Optional[str]

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat(),
            "action": self.action,
            "actor": self.actor,
            "target": self.target,
            "status": self.status,
            "details": self.details
        }

class AuditLogger:
    def __init__(self):
        self._logs: List[AuditLog] = []
        self._counter = 0

    def log(self, action: str, actor: str, target: Optional[str] = None, status: str = "success", details: Optional[str] = None):
        self._counter += 1
        log_entry = AuditLog(
            id=f"LOG-{self._counter:06d}",
            timestamp=datetime.now(),
            action=action,
            actor=actor,
            target=target,
            status=status,
            details=details
        )
        self._logs.append(log_entry)
        
        # In a real system, we would write to a DB or persistent file here
        # For MVP, we keep in memory (and could dump to JSON)
        print(f"AUDIT LOG: {action} by {actor} on {target} - {status}")

    def get_logs(self) -> List[dict]:
        return [l.to_dict() for l in reversed(self._logs)]

# Singleton instance
audit_logger = AuditLogger()
