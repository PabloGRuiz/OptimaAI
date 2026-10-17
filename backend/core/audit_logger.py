"""
OptimaAI - Audit Logger Subsystem
Stores and manages in-memory system optimization, security, and gaming event logs.
Decoupled to prevent circular imports across backend modules.
"""

from __future__ import annotations
import threading
from datetime import datetime
from typing import List, Dict, Any

class AuditLogger:
    def __init__(self, max_entries: int = 200):
        self._logs: List[Dict[str, Any]] = []
        self._max_entries = max_entries
        self._lock = threading.Lock()

    def add_entry(self, entry: Dict[str, Any]):
        with self._lock:
            if "timestamp" not in entry or not entry["timestamp"]:
                entry["timestamp"] = datetime.now().strftime("%H:%M:%S")
            self._logs.insert(0, entry)
            if len(self._logs) > self._max_entries:
                self._logs.pop()

    def get_logs(self) -> List[Dict[str, Any]]:
        with self._lock:
            return list(self._logs)

    def clear(self):
        with self._lock:
            self._logs.clear()

# Global singleton
audit_logger = AuditLogger()
