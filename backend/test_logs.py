"""
Verification script for Activity Logs & Memory Working Set breakdown
"""
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.core.executor import action_executor

def main():
    print("=" * 60)
    print("TEST: DESGLOSE DE AUDITORÍA Y VACIADO DE RAM")
    print("=" * 60)

    count, freed_total, top_reclaimed, explanation = action_executor.trim_all_user_processes()

    print(f"\n[+] Total procesos optimizados: {count}")
    print(f"[+] Total memoria física recuperada: {freed_total} MB")
    print(f"\n[*] Explicación Técnica:")
    print(f"    {explanation}\n")
    print("-" * 60)
    print("TOP PROCESOS QUE MÁS MEMORIA LIBERARON:")
    for idx, p in enumerate(top_reclaimed[:10], 1):
        print(f" {idx:2d}. PID {p.pid:6d} | {p.process_name:<25} | {p.before_mb:7.1f} MB -> {p.after_mb:7.1f} MB (+{p.freed_mb:6.1f} MB liberados)")
        print(f"     Criterio: {p.decision_reason}")
    print("=" * 60)
    print("[✓] TEST COMPLETADO EXITOSAMENTE.")

if __name__ == "__main__":
    main()
