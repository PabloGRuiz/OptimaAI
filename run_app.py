"""
Optima - Application Launcher
Starts the Python backend service and the modern desktop/web frontend.
Usage:
    python run_app.py
"""

import os
import sys
import time
import subprocess
import webbrowser
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent

def check_ollama():
    import urllib.request
    try:
        req = urllib.request.Request("http://localhost:11434/api/tags", headers={"User-Agent": "Optima-Launcher"})
        with urllib.request.urlopen(req, timeout=2.0) as resp:
            if resp.status == 200:
                print("[✓] Servicio local de Ollama detectado en http://localhost:11434")
                return True
    except Exception:
        print("[!] Advertencia: No se detectó Ollama en http://localhost:11434.")
        print("    Asegúrate de ejecutar 'ollama serve' para habilitar el análisis con IA.")
        return False

def main():
    print("=" * 65)
    print("  OPTIMA - AI SYSTEM OPTIMIZER & PERFORMANCE ANALYZER")
    print("=" * 65)

    check_ollama()

    backend_cmd = [
        sys.executable,
        "-m", "uvicorn",
        "backend.main:app",
        "--host", "127.0.0.1",
        "--port", "8765"
    ]

    print("\n[*] Iniciando Backend Core en http://127.0.0.1:8765...")
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=str(ROOT_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT
    )

    # Wait for backend to be ready
    time.sleep(1.5)

    frontend_dir = ROOT_DIR / "frontend"
    print("[*] Iniciando Frontend React + Vite...")
    
    # Check if npm is available
    npm_cmd = "npm.cmd" if sys.platform.startswith("win") else "npm"
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=str(frontend_dir),
        shell=True
    )

    time.sleep(2.0)
    webbrowser.open("http://localhost:5173")
    print("\n[✓] Optima iniciado exitosamente en: http://localhost:5173")
    print("    Presiona Ctrl+C en esta terminal para detener la aplicación.\n")

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\n[*] Deteniendo Optima...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("[✓] Optima finalizado.")

if __name__ == "__main__":
    main()
