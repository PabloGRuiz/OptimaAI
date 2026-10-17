"""
Optima - Standalone Desktop Launcher
Serves the bundled React UI and Python engine natively on http://127.0.0.1:8765
without requiring Node.js, npm, or local build environments.
"""

import sys
import time
import threading
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

def open_browser():
    time.sleep(1.2)
    webbrowser.open("http://127.0.0.1:8765")

def main():
    try:
        print("=" * 65)
        print("  OPTIMAAI - AI & HEURISTIC SYSTEM OPTIMIZER")
        print("  Iniciando servidor local y abriendo interfaz gráfica...")
        print("=" * 65)
        print("  Acceso web local: http://127.0.0.1:8765")
        print("  (Presiona Ctrl + C en esta ventana para detener la aplicación)")
        print("=" * 65)
        
        # Open browser automatically on separate thread
        threading.Thread(target=open_browser, daemon=True).start()
        
        # Start web server serving both API and compiled React frontend
        uvicorn.run(app, host="127.0.0.1", port=8765, log_level="warning")
    except KeyboardInterrupt:
        print("\n[*] Optima se cerró correctamente.")
    except Exception as e:
        import traceback
        print("\n" + "!" * 65)
        print("  ERROR AL INICIAR OPTIMA")
        print("!" * 65)
        traceback.print_exc()
        print("\n" + "=" * 65)
        input("Presiona [Enter] para cerrar esta ventana...")

if __name__ == "__main__":
    main()
