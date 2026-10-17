"""
Optima - Action Executor & Memory Optimization Subsystem
Executes vetted optimization actions:
- Safe process termination (graceful -> forceful) with strict PID verification
- Working set memory trimming via Windows Win32 API (EmptyWorkingSet / SetProcessWorkingSetSize)
- UAC elevation check and elevation relaunch utility
"""

from __future__ import annotations
import os
import sys
import ctypes
import time
from typing import List, Optional, Tuple
import psutil
from pydantic import BaseModel, Field

from backend.config import settings
from backend.core.security import security_manager

# Win32 Constants for memory trimming
PROCESS_QUERY_INFORMATION = 0x0400
PROCESS_SET_QUOTA = 0x0100
PROCESS_TERMINATE = 0x0001

class ActionResult(BaseModel):
    pid: int
    process_name: str
    action_type: str  # "terminate", "trim_memory", "blocked", "failed"
    success: bool
    freed_ram_mb: float = 0.0
    before_ram_mb: float = 0.0
    after_ram_mb: float = 0.0
    decision_reason: str = ""
    technical_mechanism: str = ""
    message: str
    timestamp: str = ""
    requires_elevation: bool = False

class MemoryTrimDetail(BaseModel):
    pid: int
    process_name: str
    before_mb: float
    after_mb: float
    freed_mb: float
    decision_reason: str

class BatchExecutionSummary(BaseModel):
    timestamp: float = Field(default_factory=time.time)
    total_requested: int = 0
    total_succeeded: int = 0
    total_failed: int = 0
    total_freed_ram_mb: float = 0.0
    technical_explanation: str = ""
    results: List[ActionResult] = Field(default_factory=list)
    top_freed: List[MemoryTrimDetail] = Field(default_factory=list)

class SystemActionExecutor:
    """
    Executes vetted optimizations with strict safety guardrails.
    """

    @staticmethod
    def relaunch_as_admin(command_args: Optional[List[str]] = None) -> bool:
        """
        Relaunches the current python script with elevated Administrator privileges via Windows UAC.
        """
        if not settings.security.is_windows:
            return False
        
        args = command_args or sys.argv
        params = " ".join([f'"{a}"' for a in args])
        
        try:
            # ShellExecuteW with verb 'runas' prompts the Windows UAC dialog
            ret = ctypes.windll.shell32.ShellExecuteW(
                None,
                "runas",
                sys.executable,
                params,
                None,
                1  # SW_SHOWNORMAL
            )
            return ret > 32
        except Exception:
            return False

    def trim_process_working_set(self, pid: int) -> Tuple[bool, float, float, float, str]:
        """
        Flushes unreferenced pages from a process's working set to RAM standby cache.
        On Windows: calls EmptyWorkingSet via psapi.dll.
        Returns (success, freed_mb, before_mb, after_mb, message).
        """
        if not settings.security.is_windows:
            return False, 0.0, 0.0, 0.0, "El vaciado de Working Set solo está soportado nativamente en Windows"

        try:
            p = psutil.Process(pid)
            before_rss = p.memory_info().rss
            before_mb = round(before_rss / (1024 * 1024), 2)
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            return False, 0.0, 0.0, 0.0, f"Proceso PID {pid} no accesible o ya cerrado"

        try:
            h_process = ctypes.windll.kernel32.OpenProcess(
                PROCESS_QUERY_INFORMATION | PROCESS_SET_QUOTA,
                False,
                pid
            )
            if not h_process:
                return False, 0.0, before_mb, before_mb, "Permiso denegado al abrir el handle del proceso (requiere Administrador)"

            try:
                res = ctypes.windll.psapi.EmptyWorkingSet(h_process)
                if res != 0:
                    time.sleep(0.04)
                    after_rss = psutil.Process(pid).memory_info().rss
                    after_mb = round(after_rss / (1024 * 1024), 2)
                    freed_mb = round(max(before_rss - after_rss, 0) / (1024 * 1024), 2)
                    return True, freed_mb, before_mb, after_mb, f"Memoria recortada: {before_mb} MB -> {after_mb} MB ({freed_mb} MB liberados)"
                else:
                    return False, 0.0, before_mb, before_mb, "EmptyWorkingSet retornó 0"
            finally:
                ctypes.windll.kernel32.CloseHandle(h_process)

        except Exception as e:
            return False, 0.0, before_mb, before_mb, f"Error durante vaciado de memoria: {str(e)}"

    def trim_all_user_processes(self) -> Tuple[int, float, List[MemoryTrimDetail], str]:
        """
        Performs a system-wide memory trim across all non-kernel processes.
        Safely reclaims hundreds of MBs without terminating anything.
        Returns (success_count, total_freed_mb, top_reclaimed, technical_explanation).
        """
        import datetime
        freed_total = 0.0
        success_count = 0
        details: List[MemoryTrimDetail] = []

        explanation = (
            "Mecanismo técnico: Optima invocó la API nativa de Windows Win32 `psapi.dll::EmptyWorkingSet()`. "
            "Esta llamada solicita al Administrador de Memoria del kernel de Windows desocupar las páginas "
            "físicas (RAM) que los programas mantienen reservadas pero que no están siendo utilizadas activamente "
            "(Working Set Pages no referenciadas). El kernel transfiere esas páginas a la 'Standby List' o memoria en espera, "
            "poniendo la memoria RAM inmediatamente a disposición del sistema SIN forzar el cierre ni reiniciar ninguna aplicación."
        )

        for pid in psutil.pids():
            if pid in (0, 4):
                continue
            
            proc_name = "unknown"
            try:
                p = psutil.Process(pid)
                proc_name = p.name()
            except Exception:
                continue

            success, freed_mb, b_mb, a_mb, msg = self.trim_process_working_set(pid)
            if success and freed_mb > 0.5:
                freed_total += freed_mb
                success_count += 1
                details.append(MemoryTrimDetail(
                    pid=pid,
                    process_name=proc_name,
                    before_mb=b_mb,
                    after_mb=a_mb,
                    freed_mb=freed_mb,
                    decision_reason=f"Proceso de usuario con páginas inactivas detectadas ({b_mb} MB asignados). Vaciado sin impacto operativo."
                ))

        # Sort top reclaimed
        details.sort(key=lambda x: x.freed_mb, reverse=True)
        return success_count, round(freed_total, 2), details[:25], explanation

    def terminate_process(self, pid: int, user_reason: str = "", force: bool = False) -> ActionResult:
        """
        Terminates a process safely after rigorous Safe List validation.
        Tries SIGTERM/terminate() first, then kill() if needed.
        """
        import datetime
        now_str = datetime.datetime.now().strftime("%H:%M:%S")

        try:
            proc = psutil.Process(pid)
            proc_name = proc.name()
            exe_path = None
            try:
                exe_path = proc.exe()
            except Exception:
                pass
        except psutil.NoSuchProcess:
            return ActionResult(
                pid=pid,
                process_name="desconocido",
                action_type="terminate",
                success=True,
                decision_reason="El proceso ya no existe en la tabla activa del sistema operativo.",
                technical_mechanism="Validación de PID en árbol de procesos de psutil.",
                message="El proceso ya no existe en el sistema",
                timestamp=now_str
            )

        is_prot, prot_reason, flags, risk = security_manager.evaluate_process_safety(pid, proc_name, exe_path)
        can_kill, block_msg = security_manager.can_terminate(pid, is_prot)
        
        # Measure RAM to be released
        try:
            mem_mb = round(proc.memory_info().rss / (1024 * 1024), 2)
        except Exception:
            mem_mb = 0.0

        if not can_kill:
            return ActionResult(
                pid=pid,
                process_name=proc_name,
                action_type="blocked",
                success=False,
                before_ram_mb=mem_mb,
                after_ram_mb=mem_mb,
                decision_reason=f"PROTECCIÓN CRÍTICA: {block_msg}. Razón: {prot_reason}.",
                technical_mechanism="Interceptor de seguridad Optima Safe List (interrupción antes de abrir handle PROCESS_TERMINATE).",
                message=f"ACCIÓN DENEGADA POR SEGURIDAD: {block_msg}",
                timestamp=now_str
            )

        decision = user_reason or f"Consumo anómalo o proceso no esencial ({mem_mb} MB RAM). Flags: {', '.join(flags) if flags else 'Seleccionado por usuario'}."

        try:
            if not force:
                proc.terminate()
                gone, alive = psutil.wait_procs([proc], timeout=1.5)
                if proc not in alive:
                    return ActionResult(
                        pid=pid,
                        process_name=proc_name,
                        action_type="terminate",
                        success=True,
                        before_ram_mb=mem_mb,
                        after_ram_mb=0.0,
                        freed_ram_mb=mem_mb,
                        decision_reason=decision,
                        technical_mechanism="Envío de señal SIGTERM / WM_CLOSE para cierre limpio de sockets y buffers.",
                        message=f"Proceso finalizado limpiamente (+{mem_mb} MB liberados)",
                        timestamp=now_str
                    )
            
            proc.kill()
            return ActionResult(
                pid=pid,
                process_name=proc_name,
                action_type="terminate",
                success=True,
                before_ram_mb=mem_mb,
                after_ram_mb=0.0,
                freed_ram_mb=mem_mb,
                decision_reason=decision,
                technical_mechanism="Invocación Win32 TerminateProcess() forzando cierre de threads y liberación de handles.",
                message=f"Proceso forzado a terminar (+{mem_mb} MB liberados)",
                timestamp=now_str
            )

        except psutil.AccessDenied:
            return ActionResult(
                pid=pid,
                process_name=proc_name,
                action_type="failed",
                success=False,
                before_ram_mb=mem_mb,
                after_ram_mb=mem_mb,
                requires_elevation=True,
                decision_reason=decision,
                technical_mechanism="Fallo de permisos en OpenProcess(PROCESS_TERMINATE). El proceso pertenece a otra sesión o servicio del sistema.",
                message="Permiso denegado por el sistema. Requiere privilegios de Administrador (UAC).",
                timestamp=now_str
            )
        except Exception as err:
            return ActionResult(
                pid=pid,
                process_name=proc_name,
                action_type="failed",
                success=False,
                before_ram_mb=mem_mb,
                after_ram_mb=mem_mb,
                decision_reason=decision,
                technical_mechanism="Excepción inesperada en runtime.",
                message=f"Error inesperado al cerrar proceso: {str(err)}",
                timestamp=now_str
            )

    def execute_batch_actions(self, action_requests: List[dict]) -> BatchExecutionSummary:
        """
        Executes a vetted list of user-confirmed action requests:
        action_requests: [{"pid": 1234, "action": "terminate" | "trim_memory"}]
        """
        import datetime
        now_str = datetime.datetime.now().strftime("%H:%M:%S")

        summary = BatchExecutionSummary(total_requested=len(action_requests))
        summary.technical_explanation = (
            "Acciones de optimización auditadas por Optima Safe List. Cada terminación validó previamente que el proceso "
            "no sea parte del kernel del sistema operativo (PID 0, 4), servicios críticos (svchost, csrss, lsass) "
            "ni procesos del entorno de desarrollo. Para el recorte de memoria se invocó psapi.dll::EmptyWorkingSet()."
        )

        for req in action_requests:
            pid = req.get("pid")
            action = req.get("action", "ignore")
            reason = req.get("reason", "")

            if not pid or action == "ignore":
                continue

            if action == "terminate":
                res = self.terminate_process(pid, user_reason=reason)
            elif action == "trim_memory":
                proc_name = "unknown"
                try:
                    proc_name = psutil.Process(pid).name()
                except Exception:
                    pass
                success, freed_mb, b_mb, a_mb, msg = self.trim_process_working_set(pid)
                res = ActionResult(
                    pid=pid,
                    process_name=proc_name,
                    action_type="trim_memory",
                    success=success,
                    before_ram_mb=b_mb,
                    after_ram_mb=a_mb,
                    freed_ram_mb=freed_mb,
                    decision_reason=reason or f"Vaciado de working set en proceso {proc_name} ({b_mb} MB -> {a_mb} MB).",
                    technical_mechanism="Llamada Win32 psapi.dll::EmptyWorkingSet() sobre handle con PROCESS_SET_QUOTA.",
                    message=msg,
                    timestamp=now_str
                )
            else:
                continue

            summary.results.append(res)
            if res.success:
                summary.total_succeeded += 1
                summary.total_freed_ram_mb += res.freed_ram_mb
            else:
                summary.total_failed += 1

        summary.total_freed_ram_mb = round(summary.total_freed_ram_mb, 2)
        return summary

    def apply_game_boost(self) -> Dict[str, Any]:
        """
        Executes a 1-Click Game Boost / Extreme Performance Profile:
        1. Vaciado masivo de memoria RAM (EmptyWorkingSet).
        2. Baja la prioridad de CPU de procesos en segundo plano secundarios (Discord, Launchers, Updaters, etc.)
           a IDLE_PRIORITY_CLASS para que el juego obtenga el 100% de los ciclos de CPU y GPU.
        """
        import datetime
        now_str = datetime.datetime.now().strftime("%H:%M:%S")

        # 1. Mass RAM trim
        count_trimmed, total_freed_mb, top_reclaimed, _ = self.trim_all_user_processes()

        # 2. Identify and deprioritize background hogs
        throttled_processes: List[Dict[str, Any]] = []
        
        # Priority constants
        idle_priority = psutil.IDLE_PRIORITY_CLASS if settings.security.is_windows else 15

        # Typical non-critical background apps to throttle when gaming
        throttle_candidates = {
            "discord.exe", "spotify.exe", "steamwebhelper.exe", "epicgameslauncher.exe",
            "battle.net.exe", "origin.exe", "ea.exe", "riotclientservices.exe",
            "onedrive.exe", "dropbox.exe", "googledrivesync.exe", "update.exe",
            "crashhandler.exe", "brave.exe", "chrome.exe", "msedge.exe"
        }

        current_pid = os.getpid()

        for pid in psutil.pids():
            if pid in (0, 4) or pid == current_pid:
                continue

            try:
                p = psutil.Process(pid)
                name_lower = p.name().lower()

                # Never touch critical or protected processes
                is_prot, _, _, _ = security_manager.evaluate_process_safety(pid, name_lower, None)
                if is_prot:
                    continue

                if name_lower in throttle_candidates or "updater" in name_lower or "crash" in name_lower:
                    try:
                        # Set to IDLE priority
                        p.nice(idle_priority)
                        throttled_processes.append({
                            "pid": pid,
                            "name": p.name(),
                            "action": "Prioridad de CPU reducida a Idle (segundo plano pasivo)"
                        })
                    except (psutil.AccessDenied, psutil.NoSuchProcess):
                        pass

            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

        return {
            "success": True,
            "timestamp": now_str,
            "total_freed_ram_mb": total_freed_mb,
            "processes_trimmed_count": count_trimmed,
            "throttled_count": len(throttled_processes),
            "throttled_pids": [item["pid"] for item in throttled_processes],
            "throttled_processes": throttled_processes[:10],
            "top_reclaimed": [p.model_dump() for p in top_reclaimed[:8]],
            "message": (
                f"🚀 Game Boost completado: +{total_freed_mb} MB de memoria física liberados y "
                f"{len(throttled_processes)} procesos secundarios relegados a baja prioridad de CPU."
            )
        }

# Global executor singleton
action_executor = SystemActionExecutor()
