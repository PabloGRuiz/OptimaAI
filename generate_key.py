"""
OptimaAI - Pro License Key Generator
Utility script for the developer / project owner to generate valid cryptographic
keys for friends, beta testers, and Patreon supporters.

Usage:
    python generate_key.py
    python generate_key.py --name "Pablo" --tier "lifetime"
    python generate_key.py --name "Tester1" --tier "tester"
"""

import sys
import argparse
from pathlib import Path

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.core.license_manager import license_manager

def main():
    parser = argparse.ArgumentParser(description="Generador de Licencias OptimaAI Pro")
    parser.add_argument("--name", "-n", type=str, help="Nombre del titular o amigo (ej. Juan, Carlos, Tester)")
    parser.add_argument("--tier", "-t", type=str, default="lifetime", choices=["lifetime", "patreon", "tester"], help="Nivel de licencia")
    args = parser.parse_args()

    name = args.name
    if not name:
        print("=" * 60)
        print("  GENERADOR DE CLAVES DE LICENCIA - OPTIMAAI PRO")
        print("=" * 60)
        try:
            name = input("[?] Ingresa el nombre del titular o amigo: ").strip()
        except KeyboardInterrupt:
            print("\nOperación cancelada.")
            return

    if not name:
        name = "PROUSER"

    tier = args.tier
    key = license_manager.generate_license(name, tier=tier)
    valid, holder, verified_tier, _ = license_manager.verify_license(key)

    print("\n" + "=" * 60)
    print("  ¡CLAVE GENERADA CON ÉXITO!")
    print("=" * 60)
    print(f"  Titular: {holder}")
    print(f"  Nivel:   {verified_tier.upper()}")
    print(f"  Clave:   {key}")
    print("=" * 60)
    print("Pásale esta clave a tu amigo o suscriptor de Patreon.")
    print("Podrá activarla directamente en la aplicación desde el botón 'Activar Pro'.\n")

if __name__ == "__main__":
    main()
