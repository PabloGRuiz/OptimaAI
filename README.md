# ⚡ OptimaAI - Next-Gen Desktop System Optimizer

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white" alt="Python 3.10+" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/Vite-Fast-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Ollama-Local%20LLM-black?logo=ollama&logoColor=white" alt="Ollama Local LLM" />
  <img src="https://img.shields.io/badge/Windows-Portable%20x64-0078D6?logo=windows&logoColor=white" alt="Windows x64" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License" />
</p>

<p align="center">
  <b>Language / Idioma:</b> <a href="#-english">🇬🇧 English</a> | <a href="#-español">🇪🇸 Español</a>
</p>

---

<a name="-english"></a>
## 🇬🇧 English

**OptimaAI** is a modern, high-performance desktop system optimizer and performance analyzer for Windows. It combines low-level OS telemetry with the contextual intelligence of **local LLMs via Ollama** (`llama3.2`, `llama3.1`, `mistral`, `qwen2.5`) with GPU/VRAM acceleration, along with an **Autonomous Heuristic Engine** for instant optimization on any PC.

---

### 🚀 Quick Download (Zero-Setup Portable Executable)

No need to install Python, Node.js, or configure terminal environments. Download the standalone executable:

<p align="center">
  <a href="https://github.com/PabloGRuiz/OptimaAI/releases/latest">
    <img src="https://img.shields.io/badge/⬇️_DOWNLOAD_OPTIMAAI.EXE-Latest_Release-brightgreen?style=for-the-badge&logo=windows" alt="Download OptimaAI.exe" height="42" />
  </a>
</p>

* **Zero-Setup:** Single portable `.exe` file (~36 MB). No external runtime needed.
* **100% Autonomous:** Double-click `OptimaAI.exe` and the interface opens automatically in your browser at `http://127.0.0.1:8765`.
* **Smart Dual Mode:**
  * **With Ollama:** In-depth AI system diagnosis accelerated by your GPU (NVIDIA CUDA / AMD ROCm).
  * **Without Ollama:** Instant fallback to the **Ultra-Fast Heuristic Engine** with deterministic rules.

---

### ✨ Key Features

#### 🧠 1. Hybrid Architecture: Local AI + Deterministic Heuristics
- **GPU VRAM Accelerated Inference:** Asynchronous streaming connection to Ollama with structured JSON (`llama3.2:latest`), pre-warmed in VRAM (`keep_alive: 30m`) for answers in ~4–5 seconds.
- **Sub-20ms Heuristic Fallback:** If Ollama is offline or not installed, OptimaAI evaluates differential CPU and memory working sets using deterministic algorithms in under 20 ms.
- **Resource-Aware Ollama Manager:** Informs the user that Ollama consumes 0% CPU and 0 MB VRAM when idle, with 1-click startup directly from the dashboard.

#### 🎮 2. 1-Click Game Boost (Extreme Performance)
- **Deep Working Set Trimming (`EmptyWorkingSet`):** Reclaims inactive RAM pages from background processes without killing them, returning hundreds of megabytes directly to the OS.
- **Smart CPU Throttling:** Relegates background apps (game launchers, secondary browsers, Discord) to `IDLE_PRIORITY_CLASS`, granting 100% of CPU cycles to your active game or workload.

#### 🛡️ 3. Strict Safe List & Camouflage Shield
- **Kernel Protection:** Hardcoded guardrails prevent killing core system processes (`smss.exe`, `csrss.exe`, `services.exe`, `lsass.exe`, `dwm.exe`, `explorer.exe`).
- **Anti-Camouflage Detection:** Flags suspicious processes attempting to mimic system names (e.g., `svchost.exe` running from `%TEMP%` or user folders).

#### 📋 4. Transparent Audit & Live Activity Logs
- Comprehensive log panel documenting why each process was trimmed or closed, the exact Win32 API mechanism used, and reclaimed RAM numbers.

#### 🎨 5. Fluid 60/144 FPS Dark Glassmorphism UI
- Built with **React 18 + Vite + Tailwind CSS**. Hardware-accelerated CSS compositor, live hardware gauges (CPU, RAM, Disk, Process count), and dark glass aesthetics.

---

### 🛠️ Architecture

```text
┌────────────────────────────────────────────────────────┐
│             GUI (React 18 + Vite + Tailwind)           │
│   Dashboard • Hardware Gauges • AI Diagnostic • Logs   │
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

### 💻 Local Development (Run from Source)

#### Prerequisites
* **Python 3.10+**
* **Node.js 18+** & `npm`
* *(Optional)* [Ollama](https://ollama.com/) with: `ollama run llama3.2:latest`

```bash
# 1. Clone the repository
git clone https://github.com/PabloGRuiz/OptimaAI.git
cd OptimaAI

# 2. Install backend dependencies
pip install -r backend/requirements.txt

# 3. Install frontend dependencies
cd frontend
npm install
cd ..

# 4. Start full development environment (FastAPI + Vite)
python run_app.py

# 5. Build standalone OptimaAI.exe binary
python build_exe.py
```

---

<a name="-español"></a>
## 🇪🇸 Español

**OptimaAI** es un optimizador de sistema y analizador de rendimiento moderno de alto rendimiento para Windows. Combina la potencia del análisis de telemetría a bajo nivel con la inteligencia contextual de **modelos LLM locales en Ollama** (`llama3.2`, `llama3.1`, `mistral`, `qwen2.5`) acelerados por GPU/VRAM, junto a un **Motor Heurístico Autónomo** para garantizar funcionamiento instantáneo en cualquier PC.

---

### 🚀 Descarga Rápida (Ejecutable Portable sin Dependencias)

¿No quieres instalar Python ni compilar código? Puedes descargar el ejecutable listo para usar:

<p align="center">
  <a href="https://github.com/PabloGRuiz/OptimaAI/releases/latest">
    <img src="https://img.shields.io/badge/⬇️_DESCARGAR_OPTIMAAI.EXE-Última_Versión-brightgreen?style=for-the-badge&logo=windows" alt="Descargar OptimaAI.exe" height="42" />
  </a>
</p>

* **Zero-Setup:** No requiere instalar Python, Node.js ni configurar terminales. Archivo `.exe` de ~36 MB.
* **100% Autónomo:** Doble clic en `OptimaAI.exe` y la interfaz se abre en tu navegador predeterminado en `http://127.0.0.1:8765`.
* **Modo Dual Inteligente:**
  * **Si tienes Ollama:** Obtienes diagnósticos profundos con IA acelerados por tu tarjeta gráfica (AMD ROCm / NVIDIA CUDA).
  * **Si NO tienes Ollama:** Funciona de inmediato en **Modo Heurístico Ultrarrápido** con reglas de optimización seguras.

---

### ✨ Características Principales

#### 🧠 1. Modo Híbrido: IA Local + Motor Heurístico Determinista
- **Inferencia Neuronal con GPU:** Conexión asíncrona a Ollama con JSON estructurado (`llama3.2:latest`), manteniendo el modelo precargado en VRAM (`keep_alive: 30m`) para respuestas en ~4-5 segundos.
- **Respaldo Heurístico Instantáneo:** Si Ollama está cerrado o ausente, OptimaAI evalúa el uso de CPU diferencial y memoria de trabajo en <20 ms mediante algoritmos matemáticos deterministas.
- **Gestor Transparente de Ollama:** Notifica al usuario de que Ollama no consume recursos en reposo (0% CPU, 0 MB VRAM) y permite iniciarlo con 1 solo clic.

#### 🎮 2. Game Boost (Modo Máximo Rendimiento)
- **Vaciado Profundo de Memoria (`EmptyWorkingSet`):** Libera páginas de memoria RAM inactivas en procesos de fondo sin cerrarlos, devolviendo cientos de megabytes al sistema operativo al instante.
- **Throttling Inteligente de CPU:** Asigna prioridad `IDLE_PRIORITY_CLASS` a aplicaciones secundarias (launchers, navegadores de fondo, Discord, etc.) para que tu juego disponga del 100% de los ciclos de procesador.

#### 🛡️ 3. Safe List Estricta & Detección de Suplantación (Camouflage Shield)
- **Blindaje del Kernel:** Imposibilidad técnica de terminar componentes críticos del sistema (`smss.exe`, `csrss.exe`, `services.exe`, `lsass.exe`, `dwm.exe`, `explorer.exe`).
- **Anti-Camuflaje:** Detecta procesos anómalos que intentan disfrazarse de binarios del sistema (ej. `svchost.exe` corriendo desde `%TEMP%` o carpetas temporales).

#### 📋 4. Registro de Auditoría & Transparencia Total
- Panel en tiempo real que explica exactamente qué proceso se optimizó, cuántos MB de RAM se recuperaron y el mecanismo técnico Win32 utilizado.

#### 🎨 5. Interfaz Gráfica Fluida a 60/144 FPS
- Construida en **React 18 + Vite + Tailwind CSS** con renderizado acelerado por hardware e indicadores en vivo.

---

### 💻 Desarrollo Local (Ejecución desde Código Fuente)

```bash
# 1. Clonar repositorio
git clone https://github.com/PabloGRuiz/OptimaAI.git
cd OptimaAI

# 2. Instalar backend
pip install -r backend/requirements.txt

# 3. Instalar frontend
cd frontend
npm install
cd ..

# 4. Iniciar en desarrollo
python run_app.py

# 5. Generar ejecutable .exe
python build_exe.py
```

---

## 📄 License / Licencia

Distributed under the **MIT License**. Check the `LICENSE` file for details.
