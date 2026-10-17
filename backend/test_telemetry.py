"""
Test script for Step 2: Telemetry, Safe List & Ollama Payload Sanitization
"""
import sys
import json
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.core.telemetry import telemetry_collector
from backend.core.security import security_manager

def main():
    print("=" * 60)
    print("OPTIMA - VERIFICACIÓN DE TELEMETRÍA Y SEGURIDAD (PASO 2)")
    print("=" * 60)
    
    print(f"[*] Administrador / Elevado: {security_manager.is_elevated()}")
    print("[*] Iniciando escaneo profundo del sistema (muestreo delta de CPU)...")
    
    snapshot = telemetry_collector.collect_deep_scan(sample_interval=0.2)
    
    print(f"[+] Total procesos inspeccionados: {snapshot.total_processes}")
    print(f"[+] CPU Global: {snapshot.cpu_total_percent}% | RAM: {snapshot.memory_used_gb} GB / {snapshot.memory_total_gb} GB ({snapshot.memory_percent}%)")
    print(f"[+] Candidatos seleccionados para LLM: {len(snapshot.top_candidates)}")
    print("-" * 60)
    
    print("TOP CANDIDATOS (TOP CONSUMIDORES / SOSPECHOSOS):")
    for idx, p in enumerate(snapshot.top_candidates, 1):
        prot_tag = "[PROTEGIDO]" if p.is_protected else "[MODIFICABLE]"
        susp_tag = f"[ALERTA: {p.anomaly_flags}]" if p.is_suspicious else ""
        print(f" {idx:2d}. PID {p.pid:6d} | {p.name:<25} | CPU: {p.cpu_percent:4.1f}% | RAM: {p.memory_rss_mb:6.1f} MB | {prot_tag} {susp_tag}")
    
    print("-" * 60)
    print("[*] Generando payload sanitizado para Ollama:")
    sanitized = telemetry_collector.sanitize_for_ollama(snapshot)
    print(json.dumps(sanitized, indent=2))
    print("=" * 60)
    print("[✓] PASO 2 COMPLETADO CON ÉXITO.")

if __name__ == "__main__":
    main()
