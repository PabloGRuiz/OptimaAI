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
import urllib.request
from pathlib import Path

# Fix for PyInstaller --noconsole mode where sys.stdout/stderr are None
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
                    if profile_str in cmd or 'optimaai' in cmd:
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

def is_server_running(url: str = "http://127.0.0.1:8765") -> bool:
    """Checks if OptimaAI backend is already listening and responsive."""
    try:
        with urllib.request.urlopen(f"{url}/api/health", timeout=0.6) as resp:
            return resp.status == 200
    except Exception:
        return False

def wait_for_server(url: str = "http://127.0.0.1:8765", timeout_seconds: float = 12.0) -> bool:
    """Waits until FastAPI server is fully ready and returning 200 OK."""
    start = time.time()
    while time.time() - start < timeout_seconds:
        if is_server_running(url):
            return True
        time.sleep(0.15)
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

    # Attempt to open as dedicated App window
    for browser_path in candidates:
        if Path(browser_path).exists():
            try:
                cmd = [
                    str(browser_path),
                    f"--user-data-dir={profile_dir}",
                    f"--app={url}",
                    "--window-size=1280,840",
                    "--no-first-run",
                    "--no-default-browser-check",
                    "--disable-extensions",
                    "--no-sandbox"  # Allows running when launched as Administrator
                ]
                proc = subprocess.Popen(cmd)
                time.sleep(1.0)
                
                # Check if it survived launch or exited immediately (e.g. error code 21)
                if proc.poll() is None:
                    # Successfully running! Monitor window closing in a thread
                    def _watch_window():
                        proc.wait()
                        # When user closes the native app window, exit cleanly
                        time.sleep(0.3)
                        clean_stale_browser_locks(profile_dir)
                        os._exit(0)
                        
                    threading.Thread(target=_watch_window, daemon=True).start()
                    return True
            except Exception:
                continue

    # Fallback guaranteed: open in user's default browser
    webbrowser.open(url)
    return True

def launch_window_worker():
    url = "http://127.0.0.1:8765"
    if wait_for_server(url, timeout_seconds=12.0):
        spawn_app_window(url)
    else:
        # Fallback if server took unexpectedly long
        spawn_app_window(url)

def main():
    url = "http://127.0.0.1:8765"
    
    # 1. If an instance is ALREADY running on port 8765, just bring up window and exit!
    if is_server_running(url):
        spawn_app_window(url)
        return

    try:
        # 2. Launch window in parallel once server answers health check
        threading.Thread(target=launch_window_worker, daemon=True).start()
        
        # 3. Start web server serving both API and compiled React frontend
        # log_config=None is essential for GUI --noconsole mode
        uvicorn.run(
            app,
            host="127.0.0.1",
            port=8765,
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
