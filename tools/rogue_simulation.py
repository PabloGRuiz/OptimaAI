"""
Rogue Process Simulator for OptimaAI Testing & Video Demonstration
Safely simulates an anomalous high-consumption process (CPU & RAM hog).
Self-terminates after 5 minutes if not killed earlier by OptimaAI.
"""

from __future__ import annotations
import os
import sys
import time
import threading

def burn_cpu():
    """Generates moderate CPU load without locking the operating system."""
    while True:
        x = 0
        for i in range(400000):
            x += (i ^ 0x55) * i
        time.sleep(0.008)

def main():
    pid = os.getpid()
    print("\n" + "=" * 65)
    print("   OPTIMAAI - SIMULADOR DE PROCESO ANÓMALO / MALICIOSO")
    print("=" * 65)
    print(f"[!] Proceso simulado iniciado:")
    print(f"    - Nombre: crypto_miner_sim.exe")
    print(f"    - PID en Windows: {pid}")
    print(f"    - Asignando memoria: 450 MB de RAM física...")
    
    # Allocate 450 MB of RAM
    memory_hog = [bytearray(1024 * 1024) for _ in range(450)]
    print(f"[✓] 450 MB de RAM asignados correctamente.")

    # Spin 2 worker threads to generate ~25-35% CPU load
    print("[*] Iniciando hilos de cómputo intensivo (simulando minería/fuga)...")
    for _ in range(2):
        t = threading.Thread(target=burn_cpu, daemon=True)
        t.start()

    print("\n" + "-" * 65)
    print(" INSTRUCCIONES PARA LA PRUEBA:")
    print(" 1. Deja esta ventana abierta.")
    print(" 2. Abre OptimaAI.")
    print(" 3. Haz clic en 'Iniciar Examen Extenso'.")
    print(" 4. Verás cómo OptimaAI y la IA detectan este proceso (crypto_miner_sim.exe)")
    print("    como ANOMALÍA con alerta roja y proponen su terminación.")
    print(" 5. Haz clic en 'Ejecutar Acciones' para ver cómo OptimaAI lo neutraliza.")
    print("-" * 65 + "\n")
    print("[*] Proceso corriendo. Esperando detección... (Auto-cierre en 5 min)")

    # Run for at most 5 minutes then exit cleanly
    start = time.time()
    while time.time() - start < 300:
        time.sleep(1)

    print("[*] Tiempo máximo de prueba alcanzado. Cerrando simulador.")

if __name__ == "__main__":
    main()
