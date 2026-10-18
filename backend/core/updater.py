"""
OptimaAI - Update Checker & Auto-Updater Engine
Queries GitHub Releases API to detect new versions, compares semantic versions,
and provides seamless 1-click binary in-place updating on Windows.
"""

from __future__ import annotations
import os
import sys
import re
import time
import json
import urllib.request
import urllib.error
import subprocess
import threading
from pathlib import Path
from typing import Optional, Dict, Any, Tuple
from pydantic import BaseModel, Field

from backend.config import settings

GITHUB_REPO = "PabloGRuiz/OptimaAI"
LATEST_RELEASE_API = f"https://api.github.com/repos/{GITHUB_REPO}/releases/latest"

class UpdateInfo(BaseModel):
    has_update: bool = False
    current_version: str = ""
    latest_version: str = ""
    release_name: str = ""
    release_notes: str = ""
    release_url: str = ""
    download_url: Optional[str] = None
    download_size_mb: float = 0.0
    published_at: str = ""
    checked_at: str = ""

def parse_semver(v_str: str) -> Tuple[int, ...]:
    """Extracts numeric semver tuple from strings like 'v1.2.0' -> (1, 2, 0)."""
    clean = re.sub(r"[^\d.]", "", v_str)
    parts = clean.split(".")
    try:
        return tuple(int(p) for p in parts if p.isdigit())
    except Exception:
        return (0, 0, 0)

class UpdateManager:
    def __init__(self):
        self.cached_info: Optional[UpdateInfo] = None
        self._last_check_ts: float = 0.0
        self._check_lock = threading.Lock()
        self._download_progress: Dict[str, Any] = {"status": "idle", "percent": 0, "error": None}

    def check_for_updates(self, force: bool = False) -> UpdateInfo:
        """
        Queries GitHub API for the latest release.
        Caches results for 15 minutes unless force=True.
        """
        now = time.time()
        with self._check_lock:
            if not force and self.cached_info and (now - self._last_check_ts < 900):
                return self.cached_info

            current_ver = settings.version
            current_tuple = parse_semver(current_ver)

            try:
                req = urllib.request.Request(
                    LATEST_RELEASE_API,
                    headers={
                        "User-Agent": "OptimaAI-Desktop-App",
                        "Accept": "application/vnd.github.v3+json"
                    }
                )
                with urllib.request.urlopen(req, timeout=6) as response:
                    data = json.loads(response.read().decode("utf-8"))

                tag = data.get("tag_name", "")
                remote_tuple = parse_semver(tag)
                has_update = remote_tuple > current_tuple

                # Locate Windows binary asset
                download_url = None
                download_size_mb = 0.0
                assets = data.get("assets", [])
                for asset in assets:
                    name = asset.get("name", "").lower()
                    if name.endswith(".exe") and "optima" in name:
                        download_url = asset.get("browser_download_url")
                        download_size_mb = round(asset.get("size", 0) / (1024 * 1024), 2)
                        break

                info = UpdateInfo(
                    has_update=has_update,
                    current_version=current_ver,
                    latest_version=tag.lstrip("v"),
                    release_name=data.get("name") or f"OptimaAI {tag}",
                    release_notes=data.get("body") or "Novedades y optimizaciones de rendimiento.",
                    release_url=data.get("html_url") or f"https://github.com/{GITHUB_REPO}/releases/latest",
                    download_url=download_url,
                    download_size_mb=download_size_mb,
                    published_at=data.get("published_at", "")[:10],
                    checked_at=time.strftime("%H:%M:%S")
                )

                self.cached_info = info
                self._last_check_ts = now
                return info

            except Exception as e:
                # Return current info without update on network failure or rate limits
                fallback = UpdateInfo(
                    has_update=False,
                    current_version=current_ver,
                    latest_version=current_ver,
                    release_name=f"OptimaAI v{current_ver}",
                    release_notes="No se pudo comprobar la versión en GitHub (sin conexión).",
                    release_url=f"https://github.com/{GITHUB_REPO}/releases",
                    checked_at=time.strftime("%H:%M:%S")
                )
                self.cached_info = fallback
                self._last_check_ts = now
                return fallback

    def get_progress(self) -> Dict[str, Any]:
        return dict(self._download_progress)

    def apply_update_in_background(self) -> Dict[str, Any]:
        """
        Downloads latest OptimaAI.exe to %TEMP% and spawns a Windows replacement script.
        """
        info = self.check_for_updates()
        if not info.download_url:
            return {"success": False, "message": "No se encontró enlace de descarga del ejecutable."}

        # Check if running as packaged executable or Python script
        is_frozen = getattr(sys, "frozen", False)
        target_exe_path = sys.executable if is_frozen else str(Path(__file__).resolve().parent.parent.parent / "dist" / "OptimaAI.exe")

        def _worker():
            try:
                self._download_progress = {"status": "downloading", "percent": 0, "error": None}
                temp_dir = Path(os.environ.get("TEMP", "."))
                download_dest = temp_dir / "OptimaAI_new_update.exe"
                batch_script = temp_dir / "optima_apply_update.bat"

                req = urllib.request.Request(
                    info.download_url,
                    headers={"User-Agent": "OptimaAI-Updater"}
                )

                with urllib.request.urlopen(req, timeout=30) as resp, open(download_dest, "wb") as out_f:
                    total_bytes = int(resp.headers.get("Content-Length", 0))
                    downloaded = 0
                    chunk_size = 64 * 1024

                    while True:
                        chunk = resp.read(chunk_size)
                        if not chunk:
                            break
                        out_f.write(chunk)
                        downloaded += len(chunk)
                        if total_bytes > 0:
                            pct = int((downloaded / total_bytes) * 100)
                            self._download_progress["percent"] = min(pct, 99)

                self._download_progress = {"status": "ready_to_swap", "percent": 100, "error": None}

                if sys.platform.startswith("win"):
                    # Generate autonomous swap batch script
                    script_content = f"""@echo off
chcp 65001 >nul
echo Actualizando OptimaAI... Esperando que el proceso anterior finalice...
timeout /t 2 /nobreak >nul
:retry
copy /y "{download_dest}" "{target_exe_path}" >nul 2>&1
if errorlevel 1 (
    timeout /t 1 /nobreak >nul
    goto retry
)
del "{download_dest}" >nul 2>&1
echo Iniciando OptimaAI actualizado...
start "" "{target_exe_path}"
del "%~f0" >nul 2>&1
exit
"""
                    with open(batch_script, "w", encoding="utf-8") as bf:
                        bf.write(script_content)

                    # Launch batch detached and exit this process
                    DETACHED_PROCESS = 0x00000008
                    CREATE_NEW_PROCESS_GROUP = 0x00000200
                    subprocess.Popen(
                        ["cmd.exe", "/c", str(batch_script)],
                        creationflags=DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP,
                        close_fds=True
                    )
                    
                    time.sleep(0.8)
                    os._exit(0)

            except Exception as e:
                self._download_progress = {"status": "error", "percent": 0, "error": str(e)}

        t = threading.Thread(target=_worker, daemon=True, name="OptimaAutoUpdaterThread")
        t.start()
        return {
            "success": True,
            "message": "Descarga iniciada. La aplicación se reiniciará automáticamente al completar."
        }

# Global singleton
update_manager = UpdateManager()
