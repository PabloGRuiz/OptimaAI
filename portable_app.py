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
from pathlib import Path

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

def show_error_dialog(title: str, message: str):
    """Displays native Windows dialog box if console is hidden."""
    if sys.platform.startswith("win"):
        try:
            ctypes.windll.user32.MessageBoxW(0, message, title, 0x10)  # MB_ICONERROR
        except Exception:
            pass

def launch_native_window():
    """
    Launches OptimaAI in a dedicated, isolated native desktop window
    with no browser tabs, no address bar, and custom window dimensions.
    """
    time.sleep(1.2)
    url = "http://127.0.0.1:8765"
    
    candidates = list(CANDIDATE_BROWSERS)
    for name in ["msedge", "chrome", "brave"]:
        found = shutil.which(name)
        if found and found not in candidates:
            candidates.append(found)

    if sys.platform.startswith("win"):
        appdata_base = os.environ.get("LOCALAPPDATA") or os.environ.get("APPDATA") or "."
        profile_dir = Path(appdata_base) / "OptimaAI" / "app_window_profile"
    else:
        profile_dir = Path.home() / ".config" / "OptimaAI" / "app_window_profile"
    
    try:
        profile_dir.mkdir(parents=True, exist_ok=True)
    except Exception:
        pass

    for browser_path in candidates:
        if Path(browser_path).exists():
            try:
                cmd = [
                    str(browser_path),
                    f"--app={url}",
                    f"--user-data-dir={profile_dir}",
                    "--window-size=1280,840",
                    "--disable-extensions",
                    "--no-first-run",
                    "--no-default-browser-check"
                ]
                proc = subprocess.Popen(cmd)
                
                # Wait until the user closes the desktop window, then exit backend cleanly
                proc.wait()
                os._exit(0)
                return
            except Exception:
                continue

    # Fallback to system default browser if no Chromium engine was detected
    webbrowser.open(url)

def main():
    try:
        print("=" * 65)
        print("  OPTIMAAI - AI & HEURISTIC SYSTEM OPTIMIZER")
        print("  Iniciando ventana de escritorio nativa...")
        print("=" * 65)
        print("  Acceso web local: http://127.0.0.1:8765")
        print("=" * 65)
        
        # Launch dedicated desktop window on separate thread
        threading.Thread(target=launch_native_window, daemon=True).start()
        
        # Start web server serving both API and compiled React frontend
        uvicorn.run(app, host="127.0.0.1", port=8765, log_level="warning")
    except KeyboardInterrupt:
        print("\n[*] OptimaAI se cerró correctamente.")
    except Exception as e:
        import traceback
        err_msg = traceback.format_exc()
        print("\n" + "!" * 65)
        print("  ERROR AL INICIAR OPTIMA")
        print("!" * 65)
        print(err_msg)
        show_error_dialog("Error al Iniciar OptimaAI", f"Ocurrió un error al iniciar la aplicación:\n\n{str(e)}")

if __name__ == "__main__":
    main()
