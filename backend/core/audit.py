"""
Project Athena - Audit Logging System
Tracks all system actions, scans, and responses.
"""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List
import json
from pathlib import Path

AUDIT_LOGS_FILE = Path(__file__).resolve().parent.parent / "audit_logs.json"

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
        self._load_logs()

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
        self._save_logs()
        
        # In a real system, we would write to a DB or persistent file here
        # For MVP, we keep in memory (and could dump to JSON)
        print(f"AUDIT LOG: {action} by {actor} on {target} - {status}")

    def get_logs(self) -> List[dict]:
        return [log.to_dict() for log in reversed(self._logs)]

    def _save_logs(self) -> None:
        data = [log.to_dict() for log in self._logs]
        with open(AUDIT_LOGS_FILE, "w", encoding="utf-8") as file:
            json.dump(data, file, indent=2)

    def _load_logs(self) -> None:
        if not AUDIT_LOGS_FILE.exists():
            return

        try:
            with open(AUDIT_LOGS_FILE, "r", encoding="utf-8") as file:
                data = json.load(file)
        except (json.JSONDecodeError, OSError):
            return

        loaded_logs = []
        max_counter = 0
        for item in data:
            loaded_logs.append(
                AuditLog(
                    id=item.get("id", ""),
                    timestamp=datetime.fromisoformat(item.get("timestamp")) if item.get("timestamp") else datetime.now(),
                    action=item.get("action", ""),
                    actor=item.get("actor", ""),
                    target=item.get("target"),
                    status=item.get("status", "success"),
                    details=item.get("details"),
                )
            )
            log_id = item.get("id", "")
            if log_id.startswith("LOG-"):
                try:
                    max_counter = max(max_counter, int(log_id.split("-")[1]))
                except (IndexError, ValueError):
                    pass

        self._logs = loaded_logs
        self._counter = max_counter

# Singleton instance
audit_logger = AuditLogger()
