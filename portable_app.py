"""
OptimaAI - Standalone Desktop Launcher
Serves the bundled React UI and Python engine natively on http://127.0.0.1:8765
Opens as a dedicated, standalone Windows desktop application window (Chromium App Mode)
without browser tabs or URL bars, and automatically exits when the window is closed.
"""

from __future__ import annotations
import os
import sys
import time
import shutil
import ctypes
import threading
import subprocess
import webbrowser
import socket
import urllib.request
from pathlib import Path

# Fix for Windows asyncio ProactorEventLoop WinError 64 / WinError 1236 crashes
if sys.platform.startswith("win"):
    import asyncio
    try:
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    except Exception:
        pass

# Setup log file in %LOCALAPPDATA%\OptimaAI\launcher.log for PyInstaller --noconsole mode
log_file_path = None
try:
    log_dir = Path(os.environ.get("LOCALAPPDATA", os.environ.get("TEMP", "."))) / "OptimaAI"
    log_dir.mkdir(parents=True, exist_ok=True)
    log_file_path = log_dir / "launcher.log"
    if sys.stdout is None:
        sys.stdout = open(log_file_path, "a", encoding="utf-8")
    if sys.stderr is None:
        sys.stderr = open(log_file_path, "a", encoding="utf-8")
except Exception:
    if sys.stdout is None:
        sys.stdout = open(os.devnull, "w", encoding="utf-8")
    if sys.stderr is None:
        sys.stderr = open(os.devnull, "w", encoding="utf-8")

# Setup paths for both standard execution and PyInstaller bundled runtime
if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
    base_dir = Path(sys._MEIPASS)
else:
    base_dir = Path(__file__).resolve().parent

if str(base_dir) not in sys.path:
    sys.path.insert(0, str(base_dir))

from backend.main import app
import uvicorn

CANDIDATE_BROWSERS = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe",
]

def kill_previous_instances():
    """Terminates any previous hung instances of OptimaAI to free port 8765 cleanly."""
    if not sys.platform.startswith("win"):
        return
    current_pid = os.getpid()
    try:
        import psutil
        for p in psutil.process_iter(['pid', 'name']):
            try:
                if p.info['pid'] != current_pid and p.info['name']:
                    if p.info['name'].lower() in ['optimaai.exe', 'optima.exe']:
                        p.kill()
            except Exception:
                pass
    except Exception:
        pass

def get_browser_profile_dir() -> Path:
    """Returns dedicated profile directory for OptimaAI app window."""
    base = os.environ.get("LOCALAPPDATA") or os.environ.get("TEMP") or "."
    profile_dir = Path(base) / "OptimaAI" / "app_profile"
    profile_dir.mkdir(parents=True, exist_ok=True)
    return profile_dir

def clean_stale_browser_locks(profile_dir: Path):
    """
    Terminates any orphan browser helper processes and cleans lockfiles
    that could cause Chromium error code 21 (ProcessSingleton collision).
    """
    try:
        import psutil
        profile_str = str(profile_dir).lower()
        for proc in psutil.process_iter(['name', 'cmdline']):
            try:
                name = (proc.info.get('name') or '').lower()
                if any(b in name for b in ['msedge', 'chrome', 'brave']):
                    cmd = ' '.join(proc.info.get('cmdline') or []).lower()
                    if profile_str in cmd:
                        proc.kill()
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
    except Exception:
        pass

    # Remove stale lock files
    for lock_name in ['lockfile', 'SingletonLock', 'SingletonSocket', 'SingletonCookie']:
        lock_file = profile_dir / lock_name
        if lock_file.exists():
            try:
                lock_file.unlink()
            except Exception:
                pass

def show_error_dialog(title: str, message: str):
    """Displays native Windows dialog box if console is hidden."""
    if sys.platform.startswith("win"):
        try:
            ctypes.windll.user32.MessageBoxW(0, message, title, 0x10)  # MB_ICONERROR
        except Exception:
            pass

def is_port_open(host: str = "127.0.0.1", port: int = 8765) -> bool:
    """Fast socket-level connectivity check."""
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(0.4)
    try:
        s.connect((host, port))
        s.close()
        return True
    except Exception:
        return False

def is_server_ready(url: str = "http://127.0.0.1:8765") -> bool:
    """Checks if OptimaAI backend is responsive and returning HTTP 200."""
    try:
        req = urllib.request.Request(f"{url}/api/health", headers={"User-Agent": "OptimaAI-Probe"})
        with urllib.request.urlopen(req, timeout=1.0) as resp:
            return resp.status == 200
    except Exception:
        return False

def wait_for_server(url: str = "http://127.0.0.1:8765", timeout_seconds: float = 15.0) -> bool:
    """Waits until FastAPI server is fully ready and returning 200 OK."""
    start = time.time()
    while time.time() - start < timeout_seconds:
        if is_port_open("127.0.0.1", 8765) and is_server_ready(url):
            return True
        time.sleep(0.2)
    return False

def spawn_app_window(url: str = "http://127.0.0.1:8765"):
    """
    Launches browser in standalone Chromium App Mode (frameless window).
    Uses a dedicated, isolated user-data-dir to prevent ProcessSingleton collisions.
    If Chromium fails or exits within 1.2s, falls back to the system default browser.
    """
    profile_dir = get_browser_profile_dir()
    clean_stale_browser_locks(profile_dir)

    candidates = list(CANDIDATE_BROWSERS)
    for name in ["msedge", "chrome", "brave"]:
        found = shutil.which(name)
        if found and found not in candidates:
            candidates.append(found)

    # 0x08000000 = CREATE_NO_WINDOW (prevents any console flashing)
    creation_flags = 0x08000000 if sys.platform.startswith("win") else 0

    # Attempt to open as dedicated App window
    for browser_path in candidates:
        if Path(browser_path).exists():
            try:
                cmd = [
                    str(browser_path),
                    f"--user-data-dir={profile_dir}",
                    f"--app={url}",
                    "--window-size=1280,840",
                    "--test-type",
                    "--disable-infobars",
                    "--no-first-run",
                    "--no-default-browser-check",
                    "--disable-extensions",
                    "--disable-sync"
                ]
                proc = subprocess.Popen(cmd, creationflags=creation_flags)
                time.sleep(1.0)
                
                # If the process did not exit immediately with an error, it succeeded!
                if proc.poll() is None:
                    return True
            except Exception:
                continue

    # Fallback guaranteed: open in user's default browser
    webbrowser.open(url)
    return True

def launch_window_worker():
    url = "http://127.0.0.1:8765"
    if wait_for_server(url, timeout_seconds=15.0):
        time.sleep(0.2)
        spawn_app_window(url)
    else:
        # If server failed to respond within 15 seconds
        show_error_dialog(
            "OptimaAI - Error de Inicialización",
            "El servidor interno de OptimaAI no pudo responder en el puerto 8765.\n"
            "Verifica que el puerto no esté bloqueado."
        )

def main():
    # 1. Kill any hung previous instances to ensure port 8765 is pristine
    kill_previous_instances()
    time.sleep(0.15)

    try:
        # 2. Launch window worker once server is responsive
        threading.Thread(target=launch_window_worker, daemon=True).start()
        
        # 3. Start web server serving both API and compiled React frontend
        # loop="asyncio" ensures WindowsSelectorEventLoopPolicy is used, preventing WinError 64
        uvicorn.run(
            app,
            host="127.0.0.1",
            port=8765,
            loop="asyncio",
            log_config=None,
            access_log=False
        )
    except KeyboardInterrupt:
        pass
    except Exception as e:
        import traceback
        err_msg = traceback.format_exc()
        if log_file_path:
            try:
                with open(log_file_path, "a", encoding="utf-8") as f:
                    f.write(f"\n[CRASH {time.ctime()}]:\n{err_msg}\n")
            except Exception:
                pass
        show_error_dialog("Error al Iniciar OptimaAI", f"Ocurrió un error al iniciar OptimaAI:\n\n{str(e)}")

if __name__ == "__main__":
    main()
