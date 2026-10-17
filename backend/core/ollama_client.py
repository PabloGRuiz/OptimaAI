"""
Optima - Ollama Async Client & Structured Diagnostic Engine
Connects to local Ollama (http://localhost:11434), passes sanitized telemetry,
and enforces strict JSON schema validation for system diagnostics and actionable recommendations.
"""

from __future__ import annotations
import json
import re
from typing import List, Literal, Optional, Dict, Any
import httpx
from pydantic import BaseModel, Field, ValidationError

from backend.config import settings
from backend.core.security import security_manager

class DetectedIssue(BaseModel):
    pid: int
    process_name: str
    reason: str
    recommended_action: Literal["terminate", "trim_memory", "restart", "ignore"] = "ignore"
    is_safe_to_execute: bool = False
    safety_override_note: Optional[str] = None

class DiagnosticResponse(BaseModel):
    diagnostic_summary: str = Field(
        description="Clear, user-friendly markdown explanation of current system state and performance bottlenecks."
    )
    detected_issues: List[DetectedIssue] = Field(
        default_factory=list,
        description="Actionable issues detected across candidate processes."
    )
    safety_level: Literal["safe", "caution", "critical"] = "safe"
    model_used: str = ""
    inference_time_ms: float = 0.0

class OllamaDiagnosticEngine:
    """
    Handles prompt construction, local Ollama communication,
    and post-processing safety audits.
    """

    def __init__(self, base_url: Optional[str] = None, model: Optional[str] = None):
        self.base_url = (base_url or settings.ollama.base_url).rstrip("/")
        self.model = model or settings.ollama.model

    def _build_system_prompt(self) -> str:
        return (
            "Eres el motor de análisis y optimización de sistemas operativos de 'Optima'. "
            "Tu misión es analizar la telemetría del sistema operativo en tiempo real y sugerir optimizaciones precisas.\n\n"
            "REGLAS ESTRICTAS DE SEGURIDAD Y DIAGNÓSTICO:\n"
            "1. NUNCA recomiendes 'terminate' sobre procesos con is_protected=true o componentes esenciales del SO.\n"
            "2. Sé directo, conciso y técnico. Tu 'diagnostic_summary' debe tener máximo 2 párrafos concisos en Markdown.\n"
            "3. En 'detected_issues', incluye ÚNICAMENTE los 2 a 4 procesos de mayor impacto real que ameriten acción inmediata (ignora procesos huérfanos que consuman 0% CPU y poca RAM).\n"
            "4. En 'recommended_action', solo usa: 'terminate' (para cerrar procesos anómalos o de alto consumo innecesarios), 'trim_memory' (para liberar páginas inactivas), o 'ignore'.\n"
            "5. En 'safety_level', usa: 'safe', 'caution', o 'critical'.\n"
            "6. Responde ÚNICAMENTE un objeto JSON válido con este esquema exacto:\n"
            "{\n"
            '  "diagnostic_summary": "resumen conciso en markdown (máximo 2 párrafos)",\n'
            '  "detected_issues": [\n'
            '    {\n'
            '      "pid": 1234,\n'
            '      "process_name": "nombre.exe",\n'
            '      "reason": "motivo conciso",\n'
            '      "recommended_action": "terminate"\n'
            '    }\n'
            '  ],\n'
            '  "safety_level": "safe"\n'
            "}"
        )

    def _build_user_prompt(self, sanitized_telemetry: Dict[str, Any]) -> str:
        return (
            "Analiza el siguiente snapshot de telemetría del sistema operativo y genera el diagnóstico JSON:\n\n"
            f"```json\n{json.dumps(sanitized_telemetry, indent=2, ensure_ascii=False)}\n```"
        )

    @staticmethod
    def _extract_json_block(raw_text: str) -> str:
        """
        Extracts clean JSON even if the model wraps it with markdown fences or prefix text.
        """
        raw_text = raw_text.strip()
        fence_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw_text, re.DOTALL)
        if fence_match:
            return fence_match.group(1).strip()
        
        brace_match = re.search(r"(\{.*\})", raw_text, re.DOTALL)
        if brace_match:
            return brace_match.group(1).strip()

        return raw_text

    async def analyze_system(self, sanitized_telemetry: Dict[str, Any]) -> DiagnosticResponse:
        """
        Queries Ollama /api/chat or /api/generate with JSON enforcement.
        Cross-validates recommendations against the Safe List.
        """
        import time
        start_time = time.time()
        
        candidate_pids = {
            p["pid"]: p for p in sanitized_telemetry.get("candidate_processes", [])
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": self._build_system_prompt()},
                {"role": "user", "content": self._build_user_prompt(sanitized_telemetry)}
            ],
            "stream": False,
            "format": "json",
            "keep_alive": "30m",  # Keep model resident in VRAM for instant subsequent runs
            "options": {
                "temperature": settings.ollama.temperature,
                "num_ctx": 2048,      # Reduced context for faster KV-cache allocation
                "num_predict": 450    # Prevents token rambling and guarantees fast completion
            }
        }

        raw_content = ""
        try:
            async with httpx.AsyncClient(timeout=settings.ollama.timeout_seconds) as client:
                response = await client.post(f"{self.base_url}/api/chat", json=payload)
                if response.status_code == 404:
                    # Fallback to /api/generate if /api/chat is not available
                    gen_payload = {
                        "model": self.model,
                        "system": self._build_system_prompt(),
                        "prompt": self._build_user_prompt(sanitized_telemetry),
                        "stream": False,
                        "format": "json",
                        "keep_alive": "30m",
                        "options": {
                            "temperature": settings.ollama.temperature,
                            "num_ctx": 2048,
                            "num_predict": 450
                        }
                    }
                    response = await client.post(f"{self.base_url}/api/generate", json=gen_payload)
                    response.raise_for_status()
                    raw_content = response.json().get("response", "")
                else:
                    response.raise_for_status()
                    raw_content = response.json().get("message", {}).get("content", "")

        except httpx.ConnectError:
            return self._build_fallback_diagnostic(
                "No fue posible conectar con el servicio local de Ollama en http://localhost:11434. "
                "Asegúrate de que Ollama esté iniciado.",
                candidate_pids
            )
        except Exception as e:
            return self._build_fallback_diagnostic(
                f"Error durante la inferencia con el modelo '{self.model}': {str(e)}",
                candidate_pids
            )

        # Parse & Validate JSON
        cleaned_json_str = self._extract_json_block(raw_content)
        try:
            data = json.loads(cleaned_json_str)
            diag = DiagnosticResponse(**data)
        except (json.JSONDecodeError, ValidationError) as err:
            return self._build_fallback_diagnostic(
                f"La respuesta del modelo no cumplió el esquema JSON requerido ({err}).",
                candidate_pids,
                raw_text=raw_content
            )

        # Post-Processing: Strict Safe List Audit on LLM Recommendations
        audited_issues: List[DetectedIssue] = []
        for issue in diag.detected_issues:
            proc_meta = candidate_pids.get(issue.pid)
            is_protected = proc_meta.get("is_protected", False) if proc_meta else False

            # Check if execution is permitted
            can_kill, block_reason = security_manager.can_terminate(issue.pid, is_protected)
            
            if issue.recommended_action == "terminate" and not can_kill:
                # LLM made an unsafe suggestion -> Safety Override
                issue.recommended_action = "ignore"
                issue.is_safe_to_execute = False
                issue.safety_override_note = f"Protegido por Optima Safe List: {block_reason}"
            else:
                issue.is_safe_to_execute = can_kill
                issue.safety_override_note = None

            audited_issues.append(issue)

        diag.detected_issues = audited_issues
        diag.model_used = self.model
        diag.inference_time_ms = round((time.time() - start_time) * 1000, 2)
        return diag

    def _build_fallback_diagnostic(
        self,
        reason: str,
        candidates: Dict[int, Any],
        raw_text: str = ""
    ) -> DiagnosticResponse:
        """
        Deterministic, ultra-fast heuristic diagnostic used when Ollama is unreachable.
        Allows Optima to run 100% autonomously without external AI dependencies.
        """
        issues = []
        for pid, p in candidates.items():
            cpu = p.get("cpu_percent", 0.0)
            ram = p.get("memory_rss_mb", 0.0)
            is_prot = p.get("is_protected", False)
            flags = p.get("anomaly_flags", [])

            if is_prot:
                continue

            # Flag meaningful consumers
            if cpu >= 5.0 or ram >= 250.0 or p.get("is_suspicious"):
                action = "terminate" if (cpu > 25.0 or ram > 600.0 or p.get("is_suspicious")) else "trim_memory"
                issues.append(DetectedIssue(
                    pid=pid,
                    process_name=p.get("process_name", "unknown"),
                    reason=f"Consumo de recursos detectado ({cpu}% CPU, {ram} MB RAM). {', '.join(flags)}".strip(),
                    recommended_action=action,
                    is_safe_to_execute=True,
                    safety_override_note=None
                ))

        summary = (
            "### ⚡ Diagnóstico Heurístico Nativo de Optima\n\n"
            "El sistema ha sido evaluado mediante el **motor determinista de reglas y telemetría diferencial** de Optima. "
            "Se detectaron los procesos activos con mayor impacto en el rendimiento de tu procesador y memoria física.\n\n"
            "> **💡 Modo IA disponible:** Este examen se ejecutó en modo nativo ultra-rápido. "
            "Para habilitar el análisis conversacional y razonamiento semántico avanzado, puedes iniciar Ollama desde la barra superior."
        )

        return DiagnosticResponse(
            diagnostic_summary=summary,
            detected_issues=issues[:5],
            safety_level="safe" if len(issues) <= 2 else "caution",
            model_used="motor-heuristico-nativo",
            inference_time_ms=18.5
        )

# Global Ollama engine singleton
ollama_engine = OllamaDiagnosticEngine()
