"""
Optima - Deep Telemetry & Process Inspection Engine
Collects system-level hardware metrics, inspects active processes,
calculates accurate CPU/Memory deltas, detects anomalies, and generates
sanitized payloads for the Ollama LLM diagnostic pipeline.
"""

from __future__ import annotations
import os
import time
from typing import List, Dict, Optional, Any
import psutil
from pydantic import BaseModel, Field

from backend.config import settings
from backend.core.security import security_manager

class ProcessMetric(BaseModel):
    pid: int
    name: str
    cpu_percent: float = 0.0
    memory_rss_mb: float = 0.0
    memory_percent: float = 0.0
    disk_read_mb_s: float = 0.0
    disk_write_mb_s: float = 0.0
    exe_path: Optional[str] = None
    username: Optional[str] = None
    status: str = "running"
    create_time: float = 0.0
    parent_pid: Optional[int] = None
    is_orphan: bool = False
    is_protected: bool = False
    protection_reason: str = "Standard process"
    is_suspicious: bool = False
    anomaly_flags: List[str] = Field(default_factory=list)
    risk_score: int = 0

class SystemSnapshot(BaseModel):
    timestamp: float = Field(default_factory=time.time)
    cpu_total_percent: float = 0.0
    cpu_count_logical: int = 0
    cpu_count_physical: int = 0
    memory_total_gb: float = 0.0
    memory_used_gb: float = 0.0
    memory_free_gb: float = 0.0
    memory_percent: float = 0.0
    swap_total_gb: float = 0.0
    swap_used_gb: float = 0.0
    disk_usage_percent: float = 0.0
    total_processes: int = 0
    is_elevated: bool = False
    all_inspected_processes: List[ProcessMetric] = Field(default_factory=list)
    top_candidates: List[ProcessMetric] = Field(default_factory=list)

class TelemetryCollector:
    """
    High-performance, fault-tolerant system telemetry collector.
    Handles Windows UAC / Linux root access denials gracefully.
    """

    def __init__(self):
        self._prev_io_samples: Dict[int, tuple[float, float, float]] = {}  # pid: (read_bytes, write_bytes, timestamp)

    def get_hardware_summary(self) -> Dict[str, Any]:
        """
        Gathers high-level system CPU, RAM, and Disk metrics.
        """
        mem = psutil.virtual_memory()
        swap = psutil.swap_memory()
        
        # Disk usage for primary system drive
        primary_drive = "C:\\" if settings.security.is_windows else "/"
        try:
            disk = psutil.disk_usage(primary_drive)
            disk_percent = disk.percent
        except Exception:
            disk_percent = 0.0

        return {
            "cpu_total_percent": psutil.cpu_percent(interval=None),
            "cpu_count_logical": psutil.cpu_count(logical=True) or 1,
            "cpu_count_physical": psutil.cpu_count(logical=False) or 1,
            "memory_total_gb": round(mem.total / (1024 ** 3), 2),
            "memory_used_gb": round(mem.used / (1024 ** 3), 2),
            "memory_free_gb": round(mem.available / (1024 ** 3), 2),
            "memory_percent": round(mem.percent, 1),
            "swap_total_gb": round(swap.total / (1024 ** 3), 2),
            "swap_used_gb": round(swap.used / (1024 ** 3), 2),
            "disk_usage_percent": round(disk_percent, 1),
            "is_elevated": security_manager.is_elevated()
        }

    def collect_deep_scan(self, sample_interval: Optional[float] = None) -> SystemSnapshot:
        """
        Executes a two-phase deep scan to obtain accurate delta-based CPU & Disk metrics.
        Phase 1: Warmup sampling on all active processes.
        Phase 2: Interval delay + secondary read to calculate exact CPU percentages.
        """
        interval = sample_interval or settings.telemetry.cpu_sample_interval_sec
        active_pids = set(psutil.pids())

        # Phase 1: Initialize baseline CPU counter
        procs_map: Dict[int, psutil.Process] = {}
        for pid in active_pids:
            try:
                p = psutil.Process(pid)
                p.cpu_percent(interval=None)  # Baseline call
                procs_map[pid] = p
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue

        # Controlled delta interval for accurate CPU measurements
        time.sleep(interval)

        # Phase 2: Collect real metrics
        now = time.time()
        metrics: List[ProcessMetric] = []

        for pid, proc in procs_map.items():
            try:
                # Basic identification
                name = proc.name()
                
                # CPU percent over the sample interval
                cpu_pct = round(proc.cpu_percent(interval=None), 1)

                # Memory metrics
                mem_info = proc.memory_info()
                rss_mb = round(mem_info.rss / (1024 * 1024), 1)
                mem_pct = round(proc.memory_percent(), 2)

                # Binary Path & User
                exe_path: Optional[str] = None
                try:
                    exe_path = proc.exe()
                except (psutil.AccessDenied, psutil.NoSuchProcess):
                    exe_path = None

                username: Optional[str] = None
                try:
                    username = proc.username()
                except (psutil.AccessDenied, psutil.NoSuchProcess):
                    username = None

                # Status & Creation
                status = proc.status()
                try:
                    create_time = proc.create_time()
                except Exception:
                    create_time = 0.0

                # Parent and orphan detection
                parent_pid: Optional[int] = None
                is_orphan = False
                try:
                    parent_pid = proc.ppid()
                    if parent_pid and parent_pid not in active_pids and pid > 4:
                        is_orphan = True
                except (psutil.AccessDenied, psutil.NoSuchProcess):
                    pass

                # Disk I/O Rate estimation
                read_mbs = 0.0
                write_mbs = 0.0
                try:
                    io = proc.io_counters()
                    prev = self._prev_io_samples.get(pid)
                    if prev:
                        prev_r, prev_w, prev_t = prev
                        dt = max(now - prev_t, 0.001)
                        read_mbs = round(max(io.read_bytes - prev_r, 0) / (1024 * 1024 * dt), 2)
                        write_mbs = round(max(io.write_bytes - prev_w, 0) / (1024 * 1024 * dt), 2)
                    self._prev_io_samples[pid] = (io.read_bytes, io.write_bytes, now)
                except (psutil.AccessDenied, psutil.NoSuchProcess, AttributeError):
                    pass

                # Security & Anomaly Assessment
                is_protected, protection_reason, anomaly_flags, risk_score = (
                    security_manager.evaluate_process_safety(pid, name, exe_path)
                )

                # Behavioral resource anomaly checks
                if cpu_pct >= settings.telemetry.cpu_warning_threshold_pct:
                    anomaly_flags.append(f"HIGH_CPU_SPIKE: Consuming {cpu_pct}% CPU")
                    risk_score += 15

                if rss_mb >= settings.telemetry.memory_warning_threshold_mb:
                    anomaly_flags.append(f"HIGH_MEMORY_USAGE: Allocating {rss_mb} MB RAM")
                    risk_score += 10

                if is_orphan:
                    anomaly_flags.append(f"ORPHAN_PROCESS: Parent PID {parent_pid} terminated")
                    risk_score += 10

                is_suspicious = len(anomaly_flags) > 0 and not is_protected

                metric = ProcessMetric(
                    pid=pid,
                    name=name,
                    cpu_percent=cpu_pct,
                    memory_rss_mb=rss_mb,
                    memory_percent=mem_pct,
                    disk_read_mb_s=read_mbs,
                    disk_write_mb_s=write_mbs,
                    exe_path=exe_path,
                    username=username,
                    status=status,
                    create_time=create_time,
                    parent_pid=parent_pid,
                    is_orphan=is_orphan,
                    is_protected=is_protected,
                    protection_reason=protection_reason,
                    is_suspicious=is_suspicious,
                    anomaly_flags=anomaly_flags,
                    risk_score=risk_score
                )
                metrics.append(metric)

            except (psutil.NoSuchProcess, psutil.ZombieProcess):
                continue

        # Clean old I/O samples for terminated processes
        current_pids_set = set(procs_map.keys())
        self._prev_io_samples = {
            p: data for p, data in self._prev_io_samples.items() if p in current_pids_set
        }

        # Select Top-N Candidate processes for optimization & LLM evaluation
        top_candidates = self._rank_top_candidates(metrics, limit=settings.telemetry.max_processes_for_llm)

        hw = self.get_hardware_summary()
        return SystemSnapshot(
            timestamp=now,
            cpu_total_percent=hw["cpu_total_percent"],
            cpu_count_logical=hw["cpu_count_logical"],
            cpu_count_physical=hw["cpu_count_physical"],
            memory_total_gb=hw["memory_total_gb"],
            memory_used_gb=hw["memory_used_gb"],
            memory_free_gb=hw["memory_free_gb"],
            memory_percent=hw["memory_percent"],
            swap_total_gb=hw["swap_total_gb"],
            swap_used_gb=hw["swap_used_gb"],
            disk_usage_percent=hw["disk_usage_percent"],
            total_processes=len(metrics),
            is_elevated=hw["is_elevated"],
            all_inspected_processes=metrics,
            top_candidates=top_candidates
        )

    def _rank_top_candidates(self, processes: List[ProcessMetric], limit: int) -> List[ProcessMetric]:
        """
        Ranks processes giving highest priority to:
        1. High risk/anomaly processes (unprotected suspicious items).
        2. Top CPU consumers.
        3. Top Memory consumers.
        Guarantees deduplication and limits to top N candidates.
        """
        # Sort priority key: (risk_score, cpu_percent, memory_rss_mb)
        # We want suspicious unprotected processes at the very top
        candidates = sorted(
            processes,
            key=lambda p: (
                p.risk_score if not p.is_protected else 0,
                p.cpu_percent,
                p.memory_rss_mb
            ),
            reverse=True
        )

        selected: List[ProcessMetric] = []
        selected_pids = set()

        for proc in candidates:
            if proc.pid in selected_pids:
                continue
            # System Idle Process and Kernel PID 0/4 should never be sent as candidates to LLM
            if proc.pid in (0, 4) or proc.name.lower() in ("system idle process", "system"):
                continue
            # Filter out passive low-impact orphans (crash handlers, helpers with 0% CPU and low RAM)
            if proc.is_orphan and proc.cpu_percent == 0.0 and proc.memory_rss_mb < 120.0:
                continue
            # Keep items that have meaningful resource footprint or high anomaly score
            if proc.cpu_percent >= 1.5 or proc.memory_rss_mb >= 150.0 or proc.risk_score >= 20:
                selected.append(proc)
                selected_pids.add(proc.pid)
            if len(selected) >= limit:
                break

        # Fallback if system is almost completely idle: take top 3 by memory
        if not selected and candidates:
            selected = candidates[:3]

        return selected

    def sanitize_for_ollama(self, snapshot: SystemSnapshot) -> Dict[str, Any]:
        """
        Converts the snapshot into an ultra-concise, token-efficient JSON structure
        specifically tailored for Ollama LLMs (llama3.2 / mistral / qwen).
        Prevents prompt context saturation while providing full diagnostic signal.
        """
        candidates_summary = []
        for p in snapshot.top_candidates:
            candidates_summary.append({
                "pid": p.pid,
                "process_name": p.name,
                "cpu_percent": p.cpu_percent,
                "memory_rss_mb": p.memory_rss_mb,
                "disk_io_mb_s": round(p.disk_read_mb_s + p.disk_write_mb_s, 2),
                "is_protected": p.is_protected,
                "protection_reason": p.protection_reason if p.is_protected else None,
                "is_suspicious": p.is_suspicious,
                "anomaly_flags": p.anomaly_flags,
                "risk_score": p.risk_score,
                "exe_path": p.exe_path or "restricted/unknown"
            })

        return {
            "system_state": {
                "cpu_total_percent": snapshot.cpu_total_percent,
                "memory_used_gb": snapshot.memory_used_gb,
                "memory_total_gb": snapshot.memory_total_gb,
                "memory_percent": snapshot.memory_percent,
                "disk_usage_percent": snapshot.disk_usage_percent,
                "active_processes_count": snapshot.total_processes,
                "running_as_admin": snapshot.is_elevated
            },
            "candidate_processes": candidates_summary
        }

# Global telemetry collector singleton
telemetry_collector = TelemetryCollector()
