# ⚡ Optima AI - Next-Gen Desktop System Optimizer

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white" alt="Python 3.10+" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/Vite-Fast-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Ollama-Local%20LLM-black?logo=ollama&logoColor=white" alt="Ollama Local LLM" />
  <img src="https://img.shields.io/badge/Windows-Portable%20x64-0078D6?logo=windows&logoColor=white" alt="Windows x64" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License" />
</p>

**Optima** es un optimizador de sistema y analizador de rendimiento moderno de alto rendimiento para Windows. Combina la potencia del análisis de telemetría a bajo nivel con la inteligencia contextual de **modelos LLM locales en Ollama** (`llama3.2`, `llama3.1`, `mistral`, `qwen2.5`) acelerados por GPU/VRAM, junto a un **Motor Heurístico Autónomo** para garantizar funcionamiento instantáneo en cualquier PC.

---

## 🚀 Descarga Rápida (Ejecutable Portable)

¿No quieres instalar Python ni compilar código? Puedes descargar el ejecutable listo para usar:

<p align="center">
  <a href="https://github.com/PabloGRuiz/OptimaAI/releases/latest">
    <img src="https://img.shields.io/badge/⬇️_DESCARGAR_OPTIMA.EXE-Última_Versión-brightgreen?style=for-the-badge&logo=windows" alt="Descargar Optima.exe" height="42" />
  </a>
</p>

* **Zero-Setup:** No requiere instalar Python, Node.js ni configurar terminales.
* **100% Autónomo:** Doble clic en `Optima.exe` y la interfaz se abre en tu navegador predeterminado en `http://127.0.0.1:8765`.
* **Modo Dual Inteligente:**
  * **Si tienes Ollama:** Obtienes diagnósticos profundos con IA acelerados por tu tarjeta gráfica (AMD ROCm / NVIDIA CUDA).
  * **Si NO tienes Ollama:** Funciona de inmediato en **Modo Heurístico Ultrarrápido** con reglas de optimización seguras.

---

## ✨ Características Principales

### 🧠 1. Modo Híbrido: IA Local + Motor Heurístico Determinista
- **Inferencia Neuronal con GPU:** Conexión asíncrona a Ollama con JSON estructurado (`llama3.2:latest`), manteniendo el modelo precargado en VRAM (`keep_alive: 30m`) para respuestas en ~4-5 segundos.
- **Respaldo Heurístico Instantáneo:** Si Ollama está cerrado o ausente, Optima evalúa el uso de CPU diferencial y memoria de trabajo en <20 ms mediante algoritmos matemáticos deterministas.
- **Gestor Transparente de Ollama:** Notifica al usuario de que Ollama no consume recursos en reposo (0% CPU, 0 MB VRAM) y permite iniciarlo con 1 solo clic.

### 🎮 2. Game Boost (Modo Máximo Rendimiento)
- **Vaciado Profundo de Memoria (`EmptyWorkingSet`):** Libera páginas de memoria RAM inactivas en procesos de fondo sin cerrarlos, devolviendo cientos de megabytes al sistema operativo al instante.
- **Throttling Inteligente de CPU:** Asigna prioridad `IDLE_PRIORITY_CLASS` a aplicaciones secundarias (launchers, navegadores de fondo, Discord, etc.) para que tu juego o aplicación en foco disponga del 100% de los ciclos de tu procesador.

### 🛡️ 3. Safe List Estricta & Detección de Suplantación (Camouflage Shield)
- **Blindaje del Sistema Operativo:** Imposibilidad técnica de terminar componentes críticos del kernel (`smss.exe`, `csrss.exe`, `services.exe`, `lsass.exe`, `dwm.exe`, `explorer.exe`).
- **Anti-Camuflaje:** Detecta procesos maliciosos o anómalos que intentan disfrazarse de binarios del sistema (ej. un `svchost.exe` o `taskhostw.exe` corriendo desde carpetas temporales o de usuario).

### 📋 4. Registro de Auditoría & Transparencia Total
- **Panel de Actividad en Vivo:** Explica exactamente qué proceso se optimizó, cuántos MB de RAM se recuperaron y el mecanismo técnico utilizado (`psapi.dll::EmptyWorkingSet` vs `TerminateProcess`).

### 🎨 5. Interfaz Gráfica Moderna y Fluida
- Construida en **React 18 + Vite + Tailwind CSS**.
- Renderizado de alto rendimiento acelerado por GPU (60/144 FPS estables sin sobrecarga en el compositor).
- Indicadores de hardware en tiempo real (CPU, RAM, Disco y Procesos activos).

---

## 🛠️ Arquitectura Técnica

```text
┌────────────────────────────────────────────────────────┐
│               GUI (React 18 + Vite)                    │
│   Dashboard • Gauges • AI Diagnostic • Action List     │
└──────────────────────────▲─────────────────────────────┘
                           │ HTTP REST / JSON
┌──────────────────────────▼─────────────────────────────┐
│             FastAPI Core Bridge (Python)               │
├────────────────────────────┬───────────────────────────┤
│    Telemetry Collector     │     Security Shield       │
│  (psutil Differential Δ)   │ (Strict SafeList + UAC)   │
├────────────────────────────┼───────────────────────────┤
│     Ollama AI Engine       │   Action & Memory Exec    │
│ (GPU VRAM / llama3.2 JSON) │ (EmptyWorkingSet Trimmer) │
└────────────────────────────┴───────────────────────────┘
```

---

## 💻 Desarrollo Local (Ejecución desde Código Fuente)

Si deseas clonar el repositorio, modificar el código o contribuir:

### 1. Requisitos Previos
* **Python 3.10+**
* **Node.js 18+** y `npm`
* *(Opcional)* [Ollama](https://ollama.com/) con el modelo:
  ```bash
  ollama run llama3.2:latest
  ```

### 2. Instalación de Dependencias

```bash
# Clonar repositorio
git clone https://github.com/PabloGRuiz/OptimaAI.git
cd OptimaAI

# Instalar dependencias del backend
pip install -r backend/requirements.txt

# Instalar dependencias del frontend
cd frontend
npm install
cd ..
```

### 3. Iniciar en Modo Desarrollo
Ejecuta el script unificado que levanta tanto el backend de FastAPI como el servidor de desarrollo de Vite:
```bash
python run_app.py
```

### 4. Compilar tu propio Ejecutable (.exe)
Para generar un binario único autocontenido con PyInstaller:
```bash
python build_exe.py
```
El archivo resultante se creará en `dist/Optima.exe`.

---

## 🧪 Pruebas Unitarias Automatizadas

El proyecto incluye suites de pruebas aisladas para validar cada capa del sistema:

```bash
# Probar telemetría, muestreo diferencial y Safe List:
python backend/test_telemetry.py

# Probar inferencia estructurada con Ollama:
python backend/test_ollama.py

# Probar vaciado de memoria Win32 y ejecutor de acciones:
python backend/test_executor.py
```

---

## 📄 Licencia

Distribuido bajo la Licencia **MIT**. Consulta el archivo `LICENSE` para más información.
