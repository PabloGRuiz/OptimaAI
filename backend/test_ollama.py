"""
Test script for Step 3: Ollama Diagnostic Engine with JSON Mode
"""
import sys
import asyncio
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.core.telemetry import telemetry_collector
from backend.core.ollama_client import ollama_engine

async def main():
    print("=" * 60)
    print("OPTIMA - TEST DEL MOTOR OLLAMA LLM (PASO 3)")
    print(f"[*] Modelo configurado: {ollama_engine.model}")
    print(f"[*] Endpoint: {ollama_engine.base_url}")
    print("=" * 60)
    
    print("[1/2] Recolectando telemetría en vivo...")
    snapshot = telemetry_collector.collect_deep_scan(sample_interval=0.2)
    sanitized = telemetry_collector.sanitize_for_ollama(snapshot)
    print(f"[+] Procesos candidatos para análisis: {len(sanitized['candidate_processes'])}")

    print("\n[2/2] Enviando snapshot a Ollama y forzando salida JSON estructurada...")
    diag = await ollama_engine.analyze_system(sanitized)

    print("\n" + "=" * 60)
    print(f"DIAGNÓSTICO RECIBIDO (Inferencia en {diag.inference_time_ms} ms - Modelo: {diag.model_used})")
    print(f"Nivel de seguridad global: [{diag.safety_level.upper()}]")
    print("=" * 60)
    print("\n" + diag.diagnostic_summary + "\n")
    print("-" * 60)
    print(f"ACCIONES SUGERIDAS ({len(diag.detected_issues)} problemas detectados):")
    for idx, issue in enumerate(diag.detected_issues, 1):
        safe_str = "SEGURO" if issue.is_safe_to_execute else "BLOQUEADO"
        note_str = f" ({issue.safety_override_note})" if issue.safety_override_note else ""
        print(f" {idx}. PID {issue.pid} | {issue.process_name} -> Acción: [{issue.recommended_action.upper()}] [{safe_str}]{note_str}")
        print(f"    Motivo: {issue.reason}")
    print("=" * 60)
    print("[✓] PASO 3 VALIDADO CON ÉXITO.")

if __name__ == "__main__":
    asyncio.run(main())
