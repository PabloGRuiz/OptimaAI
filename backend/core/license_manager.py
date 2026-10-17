"""
OptimaAI - Offline Cryptographic License Subsystem
Enables offline, tamper-resistant validation of Pro licenses using HMAC-SHA256.
Stores activation state securely in the user's OS application data directory.
"""

from __future__ import annotations
import os
import sys
import json
import hmac
import hashlib
import re
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

# Secret salt used for deterministic signature verification
# Keep private; ensures keys cannot be forged without knowing this internal seed
_LICENSE_SECRET_SEED = b"OptimaAI_Neural_Opt_Pro_Seed_2026_SecureKey#99!"

def get_appdata_dir() -> Path:
    """Returns persistent application data directory across Windows and Linux."""
    if sys.platform.startswith("win"):
        base = os.environ.get("APPDATA")
        if base:
            path = Path(base) / "OptimaAI"
        else:
            path = Path.home() / ".optima_ai"
    else:
        path = Path.home() / ".config" / "optima_ai"
    
    path.mkdir(parents=True, exist_ok=True)
    return path

class LicenseStatus(BaseModel):
    is_pro: bool = False
    holder: str = "Free Community User"
    tier: str = "free"
    key: Optional[str] = None
    activated_at: Optional[str] = None
    message: str = "OptimaAI Community Edition"

class LicenseManager:
    """
    Manages generation, offline verification, and persistent storage of Pro licenses.
    Format: OPRO-{HOLDER_PREFIX}-{SIG1}-{SIG2}-{SIG3}
    Example: OPRO-PABLO-8F2B-9C14-A7E3
    """

    def __init__(self):
        self.storage_file = get_appdata_dir() / "license.json"
        self._cached_status: Optional[LicenseStatus] = None

    def _sanitize_holder(self, name: str) -> str:
        """Sanitizes name to 3-8 uppercase alphanumeric characters."""
        clean = re.sub(r"[^A-Za-z0-9]", "", name).upper()
        if len(clean) < 3:
            clean = (clean + "USER")[:4]
        return clean[:8]

    def _compute_signature(self, holder: str, tier: str) -> str:
        """Computes a 12-char hex HMAC signature for the holder + tier."""
        message = f"OPTIMAAI:{holder}:{tier.lower()}".encode("utf-8")
        h = hmac.new(_LICENSE_SECRET_SEED, message, hashlib.sha256).hexdigest().upper()
        return h[:12]  # 12 hex chars: 3 blocks of 4

    def generate_license(self, holder_name: str, tier: str = "lifetime") -> str:
        """
        Generates a valid license string for a user or Patreon supporter.
        """
        holder = self._sanitize_holder(holder_name)
        sig = self._compute_signature(holder, tier)
        # Format into 4-char groups: OPRO-HOLDER-XXXX-XXXX-XXXX
        part1 = sig[0:4]
        part2 = sig[4:8]
        part3 = sig[8:12]
        return f"OPRO-{holder}-{part1}-{part2}-{part3}"

    def verify_license(self, key_string: str) -> tuple[bool, str, str, str]:
        """
        Verifies if a key is cryptographically valid.
        Returns: (is_valid, holder_name, tier, message)
        """
        if not key_string:
            return False, "", "free", "La clave no puede estar vacía."

        cleaned = key_string.strip().upper()
        pattern = r"^OPRO-([A-Z0-9]{3,8})-([A-F0-9]{4})-([A-F0-9]{4})-([A-F0-9]{4})$"
        match = re.match(pattern, cleaned)
        if not match:
            return False, "", "free", "Formato de clave inválido. Debe ser: OPRO-NOMBRE-XXXX-XXXX-XXXX"

        holder = match.group(1)
        provided_sig = f"{match.group(2)}{match.group(3)}{match.group(4)}"

        # Check against standard tiers (lifetime or patreon)
        for tier in ["lifetime", "patreon", "tester"]:
            expected_sig = self._compute_signature(holder, tier)
            if hmac.compare_digest(provided_sig, expected_sig):
                return True, holder, tier, "Clave válida de OptimaAI Pro."

        return False, "", "free", "Clave no válida o firma criptográfica incorrecta."

    def get_status(self) -> LicenseStatus:
        """
        Reads local persistent license file and checks cryptographic validity.
        """
        if self._cached_status is not None:
            return self._cached_status

        if not self.storage_file.exists():
            self._cached_status = LicenseStatus()
            return self._cached_status

        try:
            with open(self.storage_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            key = data.get("key", "")
            valid, holder, tier, msg = self.verify_license(key)
            if valid:
                self._cached_status = LicenseStatus(
                    is_pro=True,
                    holder=holder,
                    tier=tier,
                    key=key,
                    activated_at=data.get("activated_at"),
                    message=f"OptimaAI Pro activo para {holder}"
                )
            else:
                self._cached_status = LicenseStatus()
        except Exception:
            self._cached_status = LicenseStatus()

        return self._cached_status

    def activate(self, key_string: str) -> tuple[bool, LicenseStatus]:
        """
        Attempts to activate a license key and persist it locally.
        """
        valid, holder, tier, msg = self.verify_license(key_string)
        if not valid:
            return False, LicenseStatus(is_pro=False, message=msg)

        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        status = LicenseStatus(
            is_pro=True,
            holder=holder,
            tier=tier,
            key=key_string.strip().upper(),
            activated_at=now_str,
            message=f"¡Bienvenido a OptimaAI Pro, {holder}!"
        )

        try:
            with open(self.storage_file, "w", encoding="utf-8") as f:
                json.dump({
                    "key": status.key,
                    "holder": status.holder,
                    "tier": status.tier,
                    "activated_at": status.activated_at
                }, f, indent=2)
            self._cached_status = status
            return True, status
        except Exception as e:
            return False, LicenseStatus(is_pro=False, message=f"No se pudo guardar la licencia: {str(e)}")

    def deactivate(self) -> bool:
        """
        Deactivates active Pro license.
        """
        try:
            if self.storage_file.exists():
                self.storage_file.unlink()
            self._cached_status = LicenseStatus()
            return True
        except Exception:
            return False

# Global instance
license_manager = LicenseManager()
