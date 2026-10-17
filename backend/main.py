"""
Optima - FastAPI Server & Desktop Bridge
Exposes REST and WebSocket endpoints connecting the UI to Telemetry,
Ollama Diagnostic Engine, and Safe Action Executor.
"""

from __future__ import annotations
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional
import httpx
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure Optima root is in path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.config import settings
from backend.core.security import security_manager
from backend.core.telemetry import telemetry_collector, SystemSnapshot
from backend.core.ollama_client import ollama_engine, DiagnosticResponse
from backend.core.ollama_manager import ollama_manager
from backend.core.executor import action_executor, BatchExecutionSummary, ActionResult

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="Backend API para Optima AI System Optimizer"
)

# Enable CORS for local desktop UI (Vite / localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# State cache for active snapshot and diagnosis
_latest_snapshot: Optional[SystemSnapshot] = None
_latest_diagnosis: Optional[DiagnosticResponse] = None

class ActionItemRequest(BaseModel):
    pid: int
    action: str = Field(description="terminate or trim_memory")
    reason: Optional[str] = Field(default="", description="Reason provided by LLM or user for action")

class BatchActionRequest(BaseModel):
    actions: List[ActionItemRequest]

class ConfigureModelRequest(BaseModel):
    model: str

# Audit log storage
_execution_logs: List[Dict[str, Any]] = []

def add_log_entry(entry: Dict[str, Any]):
    import datetime
    if "timestamp" not in entry or not entry["timestamp"]:
        entry["timestamp"] = datetime.datetime.now().strftime("%H:%M:%S")
    _execution_logs.insert(0, entry)
    if len(_execution_logs) > 200:
        _execution_logs.pop()

@app.get("/api/logs")
def get_activity_logs():
    """
    Returns full history of optimization decisions, terminations, and memory trims.
    """
    return {
        "logs": _execution_logs,
        "total_events": len(_execution_logs)
    }

@app.delete("/api/logs")
def clear_activity_logs():
    """
    Clears the in-memory activity logs.
    """
    global _execution_logs
    _execution_logs = []
    return {"cleared": True}

@app.get("/api/health")
def get_health():
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.version,
        "is_admin": security_manager.is_elevated(),
        "ollama_url": settings.ollama.base_url,
        "active_model": ollama_engine.model
    }

@app.get("/api/ollama/status")
async def get_ollama_manager_status():
    """
    Returns Ollama running status, installation discovery, models, and idle consumption info.
    """
    return await ollama_manager.get_status()

@app.post("/api/ollama/launch")
def launch_local_ollama():
    """
    Spawns local Ollama background process with user confirmation.
    """
    return ollama_manager.launch_daemon()

@app.get("/api/models")
async def list_available_ollama_models():
    """
    Fetches locally installed models from Ollama daemon.
    """
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{settings.ollama.base_url}/api/tags")
            if resp.status_code == 200:
                data = resp.json()
                models = [m.get("name") for m in data.get("models", [])]
                return {
                    "models": models,
                    "active_model": ollama_engine.model,
                    "connected": True
                }
    except Exception:
        pass
    return {
        "models": [settings.ollama.model],
        "active_model": ollama_engine.model,
        "connected": False
    }

@app.post("/api/models/select")
def select_model(req: ConfigureModelRequest):
    ollama_engine.model = req.model
    settings.ollama.model = req.model
    return {"active_model": ollama_engine.model}

@app.get("/api/system/status")
def get_system_status():
    """
    Returns lightweight real-time hardware status without running full process delta scan.
    """
    hw = telemetry_collector.get_hardware_summary()
    return hw

@app.post("/api/scan")
def trigger_deep_scan():
    """
    Executes a two-phase deep system inspection and updates cached snapshot.
    """
    global _latest_snapshot
    snapshot = telemetry_collector.collect_deep_scan(sample_interval=settings.telemetry.cpu_sample_interval_sec)
    _latest_snapshot = snapshot
    sanitized = telemetry_collector.sanitize_for_ollama(snapshot)
    
    return {
        "snapshot": snapshot,
        "sanitized_for_llm": sanitized
    }

@app.post("/api/diagnose")
async def trigger_ai_diagnosis():
    """
    Takes the latest snapshot (or performs a fresh scan if needed)
    and sends it to Ollama for structured JSON diagnosis.
    """
    global _latest_snapshot, _latest_diagnosis
    
    if _latest_snapshot is None:
        _latest_snapshot = telemetry_collector.collect_deep_scan(sample_interval=settings.telemetry.cpu_sample_interval_sec)

    sanitized = telemetry_collector.sanitize_for_ollama(_latest_snapshot)
    diagnosis = await ollama_engine.analyze_system(sanitized)
    _latest_diagnosis = diagnosis
    
    return diagnosis

@app.post("/api/optimize/trim-all-ram")
def trim_all_memory():
    """
    Executes a non-destructive system-wide RAM sweep via EmptyWorkingSet,
    records detailed justification logs, and returns top reclaimed processes.
    """
    count, freed_mb, top_reclaimed, technical_explanation = action_executor.trim_all_user_processes()
    
    import datetime
    now_str = datetime.datetime.now().strftime("%H:%M:%S")

    # Add master summary log
    add_log_entry({
        "timestamp": now_str,
        "type": "ram_sweep",
        "action_title": "Barrido Global de Memoria (EmptyWorkingSet)",
        "summary": f"Se desocuparon las páginas de memoria inactivas en {count} procesos, recuperando {freed_mb} MB de RAM.",
        "freed_mb": freed_mb,
        "technical_explanation": technical_explanation,
        "top_processes": [item.model_dump() for item in top_reclaimed[:10]]
    })

    # Add individual log items for top contributors
    for p in top_reclaimed[:8]:
        add_log_entry({
            "timestamp": now_str,
            "type": "process_trimmed",
            "pid": p.pid,
            "process_name": p.process_name,
            "freed_mb": p.freed_mb,
            "before_mb": p.before_mb,
            "after_mb": p.after_mb,
            "decision_reason": p.decision_reason,
            "technical_mechanism": "psapi.dll::EmptyWorkingSet() - Páginas no referenciadas movidas a Standby Cache sin cerrar proceso."
        })

    return {
        "success": True,
        "processes_optimized": count,
        "total_freed_ram_mb": freed_mb,
        "top_reclaimed": [p.model_dump() for p in top_reclaimed],
        "technical_explanation": technical_explanation,
        "message": f"Se optimizaron {count} procesos, recuperando {freed_mb} MB de memoria física sin cerrar aplicaciones."
    }

@app.post("/api/optimize/execute-actions")
def execute_optimization_actions(req: BatchActionRequest):
    """
    Executes user-confirmed action items (terminating processes, trimming memory)
    with strict security verification and records complete audit logs.
    """
    action_dicts = [item.model_dump() for item in req.actions]
    summary = action_executor.execute_batch_actions(action_dicts)

    for res in summary.results:
        add_log_entry({
            "timestamp": res.timestamp,
            "type": "action_execution",
            "action_type": res.action_type,
            "pid": res.pid,
            "process_name": res.process_name,
            "success": res.success,
            "freed_ram_mb": res.freed_ram_mb,
            "before_ram_mb": res.before_ram_mb,
            "after_ram_mb": res.after_ram_mb,
            "decision_reason": res.decision_reason,
            "technical_mechanism": res.technical_mechanism,
            "message": res.message
        })

    return summary

@app.post("/api/optimize/game-boost")
def trigger_game_boost():
    """
    Executes a 1-click Game Boost, freeing working set RAM and setting background apps to IDLE CPU priority.
    """
    result = action_executor.apply_game_boost()
    import datetime
    now_str = datetime.datetime.now().strftime("%H:%M:%S")

    add_log_entry({
        "timestamp": now_str,
        "type": "game_boost",
        "action_title": "🚀 Game Boost / Modo Rendimiento Extremo",
        "summary": result["message"],
        "freed_mb": result["total_freed_ram_mb"],
        "technical_explanation": (
            f"Vaciado de memoria Win32 en {result['processes_trimmed_count']} procesos y "
            f"baja de prioridad de CPU (IDLE_PRIORITY_CLASS) en {result['throttled_count']} aplicaciones secundarias."
        ),
        "top_processes": result.get("top_reclaimed", [])
    })

    return result

@app.post("/api/system/relaunch-admin")
def request_admin_elevation():
    """
    Attempts to trigger a UAC prompt to restart Optima as Administrator.
    """
    if security_manager.is_elevated():
        return {"already_admin": True, "message": "Optima ya se está ejecutando con permisos de Administrador."}

    success = action_executor.relaunch_as_admin()
    return {
        "already_admin": False,
        "uac_prompted": success,
        "message": "Solicitud UAC enviada. Si aceptaste el diálogo de Windows, Optima se iniciará como Administrador."
    }

# Mount static build if available (supports both source dev and PyInstaller frozen bundle)
if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
    base_dir = Path(sys._MEIPASS)
else:
    base_dir = Path(__file__).resolve().parent.parent

frontend_dist = base_dir / "frontend" / "dist"
if frontend_dist.exists():
    from fastapi.staticfiles import StaticFiles
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8765, reload=False)
