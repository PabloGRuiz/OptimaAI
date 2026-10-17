"""
Optima - Security & Process Protection Subsystem
Enforces the strict Safe List, detects camouflage/imposter processes,
identifies suspicious executable paths, and validates process termination permissions.
"""

from __future__ import annotations
import os
import sys
import ctypes
from pathlib import Path
from typing import Optional, Tuple, List
from backend.config import settings

class SecurityManager:
    """
    Central authority for process safety, anomaly heuristics, and privilege checking.
    """

    def __init__(self):
        self._current_pid = os.getpid()
        self._parent_pid = os.getppid()

    @staticmethod
    def is_elevated() -> bool:
        """
        Checks whether Optima is running with elevated privileges (Admin / root).
        """
        if settings.security.is_windows:
            try:
                return ctypes.windll.shell32.IsUserAnAdmin() != 0
            except Exception:
                return False
        elif settings.security.is_linux:
            return os.geteuid() == 0
        return False

    def is_self_or_parent(self, pid: int) -> bool:
        """
        Prevents Optima from inspecting/killing itself or its spawning shell/IDE.
        """
        return pid in (self._current_pid, self._parent_pid)

    def evaluate_process_safety(
        self,
        pid: int,
        name: str,
        exe_path: Optional[str]
    ) -> Tuple[bool, str, List[str], int]:
        """
        Evaluates a process against safety lists and heuristics.
        Returns:
            - is_protected (bool): If True, process cannot be terminated under ANY condition.
            - protection_reason (str): Explanation for protection or safety state.
            - anomaly_flags (List[str]): Detected suspicious characteristics.
            - risk_score (int): 0 (safest) to 100 (critical threat/anomaly).
        """
        name_lower = (name or "").lower().strip()
        exe_lower = (exe_path or "").lower().strip()
        anomaly_flags: List[str] = []
        risk_score = 0

        # 1. Self and parent immunity
        if self.is_self_or_parent(pid):
            return True, "Protected: Optima core process or direct parent", [], 0

        # 2. Kernel and critical PID 0/4 protections on Windows
        if settings.security.is_windows and pid in (0, 4):
            return True, "Protected: Windows System Kernel / Idle process", [], 0

        # 3. Check for Camouflage / Imposter Processes
        # If a process claims to be a system binary (e.g. svchost.exe), verify its path!
        if settings.security.is_windows and name_lower in settings.security.windows_canonical_system_paths:
            allowed_dirs = settings.security.windows_canonical_system_paths[name_lower]
            if exe_lower:
                exe_dir = str(Path(exe_lower).parent).lower()
                is_legitimate = any(exe_dir.startswith(allowed) for allowed in allowed_dirs)
                if not is_legitimate:
                    # CRITICAL: This is an imposter process pretending to be a system binary!
                    anomaly_flags.append(f"CAMOUFLAGE_PROCESS: '{name}' running outside system directories ({exe_lower})")
                    risk_score += 85
                    return False, "High Risk: Camouflage / Imposter process impersonating system binary", anomaly_flags, risk_score
            else:
                # Process masked without accessible path
                anomaly_flags.append(f"SUSPICIOUS_SYSTEM_MASK: '{name}' has hidden or inaccessible binary path")
                risk_score += 30

        # 4. Check Protected Developer & LLM Services (e.g., Ollama)
        if name_lower in settings.security.protected_apps:
            return True, f"Protected: Essential service/runtime ({name_lower})", [], 0

        # 5. Check Windows Critical System Processes
        if settings.security.is_windows and name_lower in settings.security.windows_critical_processes:
            return True, f"Protected: Core Windows OS component ({name_lower})", [], 0

        # 6. Check Linux Critical System Processes
        if settings.security.is_linux and name_lower in settings.security.linux_critical_processes:
            return True, f"Protected: Essential Linux system daemon ({name_lower})", [], 0

        # 7. Check for suspicious directories (e.g. Temp folder execution)
        if exe_lower:
            for susp_dir in settings.security.suspicious_directories:
                if susp_dir in exe_lower:
                    anomaly_flags.append(f"SUSPICIOUS_PATH: Running from temporary/volatile path ({susp_dir})")
                    risk_score += 45
                    break

        # Normal, unprotected process
        status_reason = "Standard user or background process" if not anomaly_flags else "Flagged with anomaly warnings"
        return False, status_reason, anomaly_flags, risk_score

    def can_terminate(self, pid: int, is_protected: bool) -> Tuple[bool, str]:
        """
        Final safety gatekeeper before any kill or terminate call is executed.
        """
        if self.is_self_or_parent(pid):
            return False, "Cannot terminate Optima internal process"
        if is_protected:
            return False, "Action blocked by Optima Safe List: Process is an essential system component"
        return True, "Permitted"

# Global security manager singleton
security_manager = SecurityManager()
