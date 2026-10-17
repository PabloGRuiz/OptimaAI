"""
Optima - Configuration Settings
Defines telemetry thresholds, Ollama LLM parameters, and OS security policies.
"""

from __future__ import annotations
import os
import sys
from pathlib import Path
from pydantic import BaseModel, Field

class OllamaConfig(BaseModel):
    base_url: str = Field(default="http://localhost:11434")
    model: str = Field(default="llama3.2:latest")  # Fast & native structured JSON support
    timeout_seconds: float = Field(default=45.0)
    temperature: float = Field(default=0.1)  # Low temperature for deterministic diagnostic JSON

class TelemetryConfig(BaseModel):
    # Sample duration for accurate CPU delta calculation
    cpu_sample_interval_sec: float = Field(default=0.15)
    
    # Thresholds for tagging anomalies
    cpu_warning_threshold_pct: float = Field(default=15.0)
    memory_warning_threshold_mb: float = Field(default=400.0)
    disk_warning_rate_mb_s: float = Field(default=20.0)
    
    # Maximum candidate processes passed to LLM to prevent context overflow and ensure ultra-fast inference
    max_processes_for_llm: int = Field(default=6)

class SecurityConfig(BaseModel):
    is_windows: bool = Field(default_factory=lambda: sys.platform.startswith("win"))
    is_linux: bool = Field(default_factory=lambda: sys.platform.startswith("linux"))

    # Core system processes that MUST NEVER be killed or modified
    # Exact lowercase executable names
    windows_critical_processes: set[str] = Field(default_factory=lambda: {
        "system",
        "system idle process",
        "registry",
        "smss.exe",
        "csrss.exe",
        "wininit.exe",
        "services.exe",
        "lsass.exe",
        "svchost.exe",
        "winlogon.exe",
        "fontdrvhost.exe",
        "dwm.exe",
        "spoolsv.exe",
        "explorer.exe",
        "sihost.exe",
        "taskhostw.exe",
        "searchindexer.exe",
        "securityhealthservice.exe",
        "memcompression",
        "msmpeng.exe",           # Windows Defender Antimalware Core
        "nissrv.exe",            # Windows Defender Network Inspection
        "conhost.exe",
        "runtimebroker.exe",
        "shellexperiencehost.exe"
    })

    linux_critical_processes: set[str] = Field(default_factory=lambda: {
        "systemd",
        "init",
        "kthreadd",
        "kworker",
        "rcu_sched",
        "dbus-daemon",
        "polkitd",
        "sshd",
        "cron",
        "systemd-journald",
        "systemd-logind",
        "systemd-resolved",
        "systemd-udevd",
        "networkmanager",
        "xorg",
        "wayland"
    })

    # Internal applications that should not be terminated by the optimizer
    protected_apps: set[str] = Field(default_factory=lambda: {
        "ollama.exe",
        "ollama_llama_server.exe",
        "llama-server.exe",
        "llama-server",
        "ollama",
        "python.exe",
        "pythonw.exe",
        "code.exe",
        "antigravity ide.exe"  # Current IDE development environment
    })

    # Legitimate canonical locations for sensitive Windows system binaries
    windows_canonical_system_paths: dict[str, list[str]] = Field(default_factory=lambda: {
        "svchost.exe": [r"c:\windows\system32", r"c:\windows\syswow64"],
        "csrss.exe": [r"c:\windows\system32"],
        "lsass.exe": [r"c:\windows\system32"],
        "services.exe": [r"c:\windows\system32"],
        "smss.exe": [r"c:\windows\system32"],
        "wininit.exe": [r"c:\windows\system32"],
        "winlogon.exe": [r"c:\windows\system32"],
        "explorer.exe": [r"c:\windows"],
        "dwm.exe": [r"c:\windows\system32"],
        "taskhostw.exe": [r"c:\windows\system32"],
        "msmpeng.exe": [r"c:\programdata\microsoft\windows defender\platform", r"c:\program files\windows defender"]
    })

    # Directories that are inherently suspicious for persistent background executables
    suspicious_directories: list[str] = Field(default_factory=lambda: [
        r"\appdata\local\temp",
        r"\windows\temp",
        r"\temp",
        r"\appdata\local\packages\temp"
    ])

class AppSettings(BaseModel):
    app_name: str = "OptimaAI"
    version: str = "1.0.0"
    ollama: OllamaConfig = Field(default_factory=OllamaConfig)
    telemetry: TelemetryConfig = Field(default_factory=TelemetryConfig)
    security: SecurityConfig = Field(default_factory=SecurityConfig)

# Global settings instance
settings = AppSettings()
