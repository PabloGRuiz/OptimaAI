"""
Test script for Step 4: Action Executor & Memory Trimming
"""
import sys
import os
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.core.executor import action_executor
from backend.core.security import security_manager

def main():
    print("=" * 60)
    print("OPTIMA - TEST DEL EJECUTOR DE ACCIONES (PASO 4)")
    print(f"[*] Administrador: {security_manager.is_elevated()}")
    print("=" * 60)

    # 1. Test Safe List Block (attempt to terminate PID 4 - System)
    print("\n[1/3] Prueba de Bloqueo de Seguridad (Intento de matar PID 4 - Kernel):")
    res_blocked = action_executor.terminate_process(4)
    print(f"    Resultado: Success={res_blocked.success} | Tipo={res_blocked.action_type}")
    print(f"    Mensaje: {res_blocked.message}")
    assert not res_blocked.success, "FALLO: PID 4 no debió ser permitido!"
    print("    [✓] Bloqueo de seguridad verificado correctamente.")

    # 2. Test Safe List Block on Internal Process (Current PID)
    print(f"\n[2/3] Prueba de Inmunidad del Proceso Interno (PID {os.getpid()}):")
    res_self = action_executor.terminate_process(os.getpid())
    print(f"    Resultado: Success={res_self.success} | Tipo={res_self.action_type}")
    print(f"    Mensaje: {res_self.message}")
    assert not res_self.success, "FALLO: El propio proceso de Optima debió estar protegido!"
    print("    [✓] Inmunidad de Optima verificada.")

    # 3. Test Memory Working Set Trimming (EmptyWorkingSet)
    print("\n[3/3] Prueba de Optimización de Memoria (EmptyWorkingSet):")
    current_pid = os.getpid()
    success, freed_mb, msg = action_executor.trim_process_working_set(current_pid)
    print(f"    Vaciado de memoria en PID {current_pid}: Success={success} | {msg}")
    
    # Global sweep test
    success_count, total_freed = action_executor.trim_all_user_processes()
    print(f"    Barrido global de memoria en procesos de usuario:")
    print(f"    [+] {success_count} procesos optimizados")
    print(f"    [+] {total_freed} MB de memoria física reclamados sin cerrar ninguna aplicación")

    print("\n" + "=" * 60)
    print("[✓] PASO 4 VALIDADO CON ÉXITO.")

if __name__ == "__main__":
    main()
