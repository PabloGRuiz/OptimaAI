"""
Optima - Ollama Manager Subsystem
Handles Ollama daemon detection, executable location discovery,
background resource explanation, and controlled automated launching.
"""

from __future__ import annotations
import os
import sys
import shutil
import subprocess
import time
from pathlib import Path
from typing import Dict, Any, List, Optional
import httpx

from backend.config import settings

class OllamaManager:
    """
    Manages discovery, status checks, and lifecycle operations for local Ollama instances.
    """

    def __init__(self, base_url: Optional[str] = None):
        self.base_url = (base_url or settings.ollama.base_url).rstrip("/")

    def find_installed_executable(self) -> Optional[str]:
        """
        Locates the Ollama executable on the system across common install paths.
        """
        localappdata = os.environ.get("LOCALAPPDATA", "")
        program_files = os.environ.get("ProgramFiles", r"C:\Program Files")
        
        candidates = [
            shutil.which("ollama"),
            shutil.which("ollama.exe"),
            os.path.join(localappdata, "Programs", "Ollama", "ollama app.exe"),
            os.path.join(localappdata, "Programs", "Ollama", "ollama.exe"),
            os.path.join(program_files, "Ollama", "ollama.exe"),
            "/usr/local/bin/ollama",
            "/usr/bin/ollama"
        ]

        for path in candidates:
            if path and os.path.exists(path) and os.path.isfile(path):
                return path

        return None

    async def get_status(self) -> Dict[str, Any]:
        """
        Returns a comprehensive report of Ollama availability, installed models,
        and educational resource usage details.
        """
        exe_path = self.find_installed_executable()
        is_installed = exe_path is not None
        is_running = False
        models: List[str] = []
        active_model = settings.ollama.model

        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                if resp.status_code == 200:
                    is_running = True
                    data = resp.json()
                    models = [m.get("name") for m in data.get("models", [])]
        except Exception:
            is_running = False

        idle_explanation = (
            "Consumo en reposo: Cuando Ollama está abierto en segundo plano (con el icono de la llama en la bandeja de tareas), "
            "su consumo es prácticamente CERO (0% CPU y 0 MB VRAM). Solo activa la GPU o CPU de manera puntual cuando "
            "Optima solicita un diagnóstico, liberando la memoria automáticamente al finalizar."
        )

        return {
            "is_running": is_running,
            "is_installed": is_installed,
            "executable_path": exe_path,
            "models": models,
            "active_model": active_model,
            "base_url": self.base_url,
            "recommended_model": "llama3.2:latest",
            "has_recommended_model": any("llama3.2" in m for m in models),
            "idle_explanation": idle_explanation,
            "download_url": "https://ollama.com/download"
        }

    def launch_daemon(self) -> Dict[str, Any]:
        """
        Spawns the local Ollama GUI app or background daemon in a detached process.
        """
        exe_path = self.find_installed_executable()
        if not exe_path:
            return {
                "success": False,
                "message": "No se encontró ningún ejecutable de Ollama instalado en el equipo."
            }

        # If it's already running, return immediately
        try:
            import urllib.request
            with urllib.request.urlopen(f"{self.base_url}/api/tags", timeout=1.0) as r:
                if r.status == 200:
                    return {
                        "success": True,
                        "already_running": True,
                        "message": "Ollama ya se encuentra activo y listo para usar."
                    }
        except Exception:
            pass

        # Windows detached process flags
        creation_flags = 0
        if settings.security.is_windows:
            # DETACHED_PROCESS = 0x00000008, CREATE_NEW_PROCESS_GROUP = 0x00000200
            creation_flags = 0x00000008 | 0x00000200

        try:
            # If "ollama app.exe" exists, launching it opens the system tray icon cleanly
            if "ollama app.exe" in exe_path.lower():
                subprocess.Popen(
                    [exe_path],
                    creationflags=creation_flags,
                    close_fds=True
                )
            else:
                # Fallback to "ollama serve"
                subprocess.Popen(
                    [exe_path, "serve"],
                    creationflags=creation_flags,
                    close_fds=True
                )

            # Wait briefly for socket binding
            for _ in range(10):
                time.sleep(0.5)
                try:
                    import urllib.request
                    with urllib.request.urlopen(f"{self.base_url}/api/tags", timeout=1.0) as r:
                        if r.status == 200:
                            return {
                                "success": True,
                                "already_running": False,
                                "message": "Ollama se inició exitosamente en segundo plano."
                            }
                except Exception:
                    continue

            return {
                "success": True,
                "already_running": False,
                "message": "Comando de inicio enviado a Ollama. El servicio estará listo en unos segundos."
            }

        except Exception as e:
            return {
                "success": False,
                "message": f"Error al intentar iniciar Ollama: {str(e)}"
            }

# Global manager singleton
ollama_manager = OllamaManager()
