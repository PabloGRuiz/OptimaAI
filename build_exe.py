"""
Optima - Standalone Executable Builder (PyInstaller)
Compiles Optima into a single, zero-dependency portable .exe for Windows.
Usage:
    python build_exe.py
"""

import os
import sys
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
DIST_DIR = ROOT_DIR / "frontend" / "dist"

def ensure_dependencies():
    print("[*] Verificando PyInstaller...")
    try:
        import PyInstaller
        print(f"[✓] PyInstaller {PyInstaller.__version__} detectado.")
    except ImportError:
        print("[!] PyInstaller no encontrado. Instalando vía pip...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])
        print("[✓] PyInstaller instalado.")

def ensure_frontend_build():
    print("[*] Compilando frontend React para empaquetado...")
    npm_cmd = "npm.cmd" if sys.platform.startswith("win") else "npm"
    subprocess.check_call([npm_cmd, "run", "build"], cwd=str(ROOT_DIR / "frontend"), shell=True)
def kill_running_instances():
    if sys.platform.startswith("win"):
        try:
            import psutil
            for p in psutil.process_iter(['name']):
                if p.info['name'] and p.info['name'].lower() in ["optimaai.exe", "optima.exe"]:
                    try:
                        p.kill()
                    except Exception:
                        pass
        except Exception:
            pass

def build_executable():
    kill_running_instances()
    print("\n" + "=" * 60)
    print("  COMPILANDO OPTIMA A EJECUTABLE PORTABLE (.EXE)")
    print("=" * 60)

    # PyInstaller arguments
    # On Windows: separator is ';'
    sep = ";" if sys.platform.startswith("win") else ":"
    frontend_data = f"{DIST_DIR}{sep}frontend/dist"
    backend_data = f"{ROOT_DIR / 'backend'}{sep}backend"

    cmd = [
        sys.executable,
        "-m", "PyInstaller",
        "--name=OptimaAI",
        "--onefile",
        "--clean",
        "--noconfirm",
        "--noconsole",
        f"--add-data={frontend_data}",
        f"--add-data={backend_data}",
        "--collect-submodules=backend",
        "--hidden-import=backend",
        "--hidden-import=backend.main",
        "--hidden-import=backend.config",
        "--hidden-import=backend.core",
        "--hidden-import=backend.core.license_manager",
        "--hidden-import=backend.core.game_detector",
        "--hidden-import=backend.core.audit_logger",
        "--hidden-import=backend.core.executor",
        "--hidden-import=backend.core.security",
        "--hidden-import=backend.core.telemetry",
        "--hidden-import=backend.core.gpu_telemetry",
        "--hidden-import=backend.core.game_overlay",
        "--hidden-import=backend.core.benchmark_manager",
        "--hidden-import=backend.core.updater",
        "--hidden-import=backend.core.ollama_client",
        "--hidden-import=backend.core.ollama_manager",
        "--hidden-import=uvicorn",
        "--hidden-import=uvicorn.logging",
        "--hidden-import=uvicorn.loops",
        "--hidden-import=uvicorn.loops.auto",
        "--hidden-import=uvicorn.protocols",
        "--hidden-import=uvicorn.protocols.http",
        "--hidden-import=uvicorn.protocols.http.auto",
        "--hidden-import=uvicorn.lifespan",
        "--hidden-import=uvicorn.lifespan.on",
        "--hidden-import=fastapi",
        "--hidden-import=fastapi.staticfiles",
        "--hidden-import=psutil",
        "--hidden-import=httpx",
        "--hidden-import=pydantic",
        str(ROOT_DIR / "portable_app.py")
    ]

    icon_file = ROOT_DIR / "OptimaAI.ico"
    if icon_file.exists():
        print(f"[*] Icono detectado: {icon_file.name}")
        cmd.insert(6, f"--icon={icon_file}")

    print("[*] Ejecutando comando de compilación:")
    print("    " + " ".join(cmd[:8]) + " ...")
    subprocess.check_call(cmd, cwd=str(ROOT_DIR))

    output_exe = ROOT_DIR / "dist" / ("OptimaAI.exe" if sys.platform.startswith("win") else "OptimaAI")
    if output_exe.exists():
        size_mb = round(output_exe.stat().st_size / (1024 * 1024), 2)
        print("\n" + "=" * 60)
        print(f"[✓] ¡EJECUTABLE GENERADO CON ÉXITO!")
        print(f"    Ruta: {output_exe}")
        print(f"    Tamaño: {size_mb} MB")
        print("=" * 60)
        print("Tus amigos pueden ejecutar este archivo directamente sin instalar Python ni Node.\n")
    else:
        print("[!] No se encontró el archivo de salida esperado.")

def main():
    ensure_dependencies()
    ensure_frontend_build()
    build_executable()

if __name__ == "__main__":
    main()
