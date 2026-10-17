# ⚡ OptimaAI - Next-Gen Desktop System Optimizer & Gaming HUD

<p align="center">
  <img src="https://img.shields.io/badge/Version-v1.1.0-6366F1?style=for-the-badge" alt="Version 1.1.0" />
  <img src="https://img.shields.io/badge/Windows-Portable%20x64-0078D6?style=for-the-badge&logo=windows&logoColor=white" alt="Windows x64" />
  <a href="https://patreon.com/Reselec" target="_blank"><img src="https://img.shields.io/badge/Patreon-Support_Reselec-FF424D?style=for-the-badge&logo=patreon&logoColor=white" alt="Patreon Support" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white" alt="Python 3.10+" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/Vite-Fast-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Ollama-Local%20LLM-black?logo=ollama&logoColor=white" alt="Ollama Local LLM" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License" />
</p>

<p align="center">
  <b>Language / Idioma:</b> <a href="#-english">🇬🇧 English</a> | <a href="#-español">🇪🇸 Español</a> | <a href="https://patreon.com/Reselec">❤️ Support on Patreon</a>
</p>

---

<a name="-english"></a>
## 🇬🇧 English

**OptimaAI** is a cutting-edge desktop performance analyzer, gaming booster, and in-game HUD overlay for Windows 10/11. It combines low-level OS telemetry with the contextual intelligence of **local LLMs via Ollama** (`llama3.2`, `llama3.1`, `mistral`, `qwen2.5`) accelerated by GPU/VRAM, backed by an **Autonomous Heuristic Engine** for instant, zero-latency optimization on any system.

---

### 🚀 Quick Download (Zero-Setup Portable Executable)

No need to install Python, Node.js, or configure command line tools. Download the standalone executable:

<p align="center">
  <a href="https://github.com/PabloGRuiz/OptimaAI/releases/latest">
    <img src="https://img.shields.io/badge/⬇️_DOWNLOAD_OPTIMAAI.EXE-Latest_Release_(v1.1.0)-brightgreen?style=for-the-badge&logo=windows" alt="Download OptimaAI.exe" height="42" />
  </a>
</p>

* **Zero-Setup:** Single portable `.exe` file (~39 MB). Self-contained web server, frontend, and telemetry engine.
* **100% Autonomous:** Double-click `OptimaAI.exe` and your default browser opens automatically to `http://127.0.0.1:8765`.
* **Smart Dual Engine:**
  * **With Ollama:** In-depth AI system diagnosis powered by local LLMs with GPU VRAM acceleration (NVIDIA CUDA / AMD ROCm).
  * **Without Ollama:** Instant fallback to the **Ultra-Fast Heuristic Engine** with deterministic rules in <20 ms.

---

### ✨ Key Features in v1.1.0

#### 🎮 1. Smart Game Detection & Auto-Boost
- **Autonomous Detection:** Real-time polling identifies full-screen 3D games and graphics workloads automatically (Steam, Epic Games, Riot, standalone binaries).
- **Deep Working Set Trimming (`EmptyWorkingSet`):** Safely flushes idle RAM pages from background browsers, Discord, and launchers back to the operating system without killing them.
- **Smart CPU Throttling:** Relegates background tasks to `IDLE_PRIORITY_CLASS`, granting 100% of CPU time slices to your active game.
- **Auto-Boost Sentinel:** Automatically engages optimization when a game launches and safely restores default states upon exit.

#### 📊 2. Universal GPU & Gaming Telemetry (AMD / NVIDIA / Intel)
- **Zero-Overhead PDH Sampling:** Native Windows Performance Data Helper counters query `\GPU Engine(*_engtype_3D)\Utilization Percentage` and `\GPU Adapter Memory(*)\Total Committed`.
- **Instant Live Metrics:**
  - Real-Time Game FPS (DirectX / Vulkan polling).
  - Dedicated GPU 3D load percentage and VRAM consumption.
  - Per-game isolated CPU utilization and memory footprint.

#### 🖥️ 3. Click-Through In-Game HUD Overlay (⭐ Pro Exclusive)
- **Native Non-Intrusive HUD:** Transparent, hardware-accelerated Tkinter overlay rendered directly over borderless and windowed games.
- **Total Click-Through:** Built with Win32 API styles `WS_EX_TRANSPARENT | WS_EX_LAYERED | WS_EX_TOOLWINDOW | WS_EX_NOACTIVATE` — zero input lag, clicks pass directly to your crosshair and game controls.
- **Customizable Layout:** Real-time position switcher between **Top-Right** and **Top-Left** corners with live visual meters.
- **Persistent Daemon Stability:** Survives game launches, alt-tabs, and closures without UI freezing or crashes.

#### 🔑 4. Offline Cryptographic Pro Licensing (HMAC-SHA256)
- **Zero Cloud Dependence:** Licenses are verified completely offline using SHA-256 digital signatures with payload validation (`OPTIMA-HOLDER-TIER-EXPIRY-SIGNATURE`).
- **Patreon Community Support:** Get your personalized Pro key directly through [Patreon](https://patreon.com/Reselec).

#### 🛡️ 5. SafeList Shield & Anti-Camouflage Detection
- **Kernel Guardrails:** Hardcoded protection guarantees critical system components (`smss.exe`, `csrss.exe`, `services.exe`, `lsass.exe`, `dwm.exe`, `explorer.exe`) can never be terminated.
- **Anti-Camouflage Defense:** Detects rogue processes attempting to impersonate legitimate system binaries from `%TEMP%` or user profiles.

#### 🎨 6. Fluid Dark Glassmorphism UI
- Built with **React 18 + Vite + Tailwind CSS**. Hardware-accelerated CSS compositor, live radial system gauges, AI diagnosis cards, and an interactive audit log.

---

### 👑 Community vs. Pro Edition Comparison

| Feature | Community (Free) | Pro Edition ⭐ |
| :--- | :---: | :---: |
| **Hybrid AI + Heuristic Optimizer** | ✅ | ✅ |
| **1-Click Game Boost & RAM Trimming** | ✅ | ✅ |
| **SafeList & Anti-Camouflage Shield** | ✅ | ✅ |
| **In-App Gaming Telemetry (FPS, GPU, VRAM)** | ✅ | ✅ |
| **Smart Game Auto-Detection Sentinel** | ✅ | ✅ |
| **Click-Through In-Game HUD Overlay** | ❌ | **✅** |
| **HUD Custom Corner Alignment** | ❌ | **✅** |
| **Supporter Discord & Priority Updates** | ❌ | **✅** |

> 💡 *To activate Pro, visit [patreon.com/Reselec](https://patreon.com/Reselec), get your key, click **Activar PRO** in the dashboard, and paste your key.*

---

### 🛠️ Architecture Overview

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
│  (psutil + Win32 PDH GPU)  │ (Strict SafeList + UAC)   │
├────────────────────────────┼───────────────────────────┤
│   In-Game HUD Overlay      │   Offline HMAC Key Engine │
│ (Transparent Click-Through)│ (Deterministic Pro Auth)  │
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
# 1. Clone repository
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

**OptimaAI** es un optimizador de sistema de alto rendimiento, acelerador para gaming y visualizador HUD in-game para Windows 10/11. Combina telemetría a bajo nivel del sistema operativo con la inteligencia contextual de **modelos LLM locales vía Ollama** (`llama3.2`, `llama3.1`, `mistral`, `qwen2.5`) acelerados por GPU/VRAM, respaldado por un **Motor Heurístico Autónomo** para optimización instantánea y sin latencia en cualquier PC.

---

### 🚀 Descarga Rápida (Ejecutable Portable sin Instalación)

No necesitas instalar Python, Node.js ni configurar terminales. Descarga el ejecutable listo para usar:

<p align="center">
  <a href="https://github.com/PabloGRuiz/OptimaAI/releases/latest">
    <img src="https://img.shields.io/badge/⬇️_DESCARGAR_OPTIMAAI.EXE-Última_Versión_(v1.1.0)-brightgreen?style=for-the-badge&logo=windows" alt="Descargar OptimaAI.exe" height="42" />
  </a>
</p>

* **Cero Instalación:** Archivo `.exe` único (~39 MB). Incluye servidor web integrado, interfaz React compilada y motor de telemetría nativo.
* **100% Autónomo:** Doble clic en `OptimaAI.exe` y se abre automáticamente en tu navegador en `http://127.0.0.1:8765`.
* **Modo Dual Inteligente:**
  * **Con Ollama:** Diagnósticos profundos mediante IA local acelerada por GPU (NVIDIA CUDA / AMD ROCm).
  * **Sin Ollama:** Respaldo automático al **Motor Heurístico Ultrarrápido** con reglas deterministas en <20 ms.

---

### ✨ Nuevas Características en v1.1.0

#### 🎮 1. Detección Inteligente de Juegos & Auto-Boost
- **Detección en Tiempo Real:** Identifica automáticamente cuando un juego o carga gráfica 3D se inicia (Steam, Epic Games, Riot o ejecutables independientes).
- **Vaciado Profundo de Memoria (`EmptyWorkingSet`):** Libera páginas de memoria RAM inactivas en procesos secundarios (navegadores, Discord, launchers) devolviendo cientos de megabytes al sistema operativo sin cerrarlos.
- **Throttling Inteligente de CPU:** Asigna prioridad `IDLE_PRIORITY_CLASS` a tareas secundarias para garantizar que tu juego reciba el 100% de los ciclos de la CPU.
- **Centinela Auto-Boost:** Activa la optimización automáticamente al detectar un juego y restaura las prioridades normales al salir.

#### 📊 2. Telemetría Universal de GPU y Juegos (AMD / NVIDIA / Intel)
- **Muestreo Nativo Windows PDH:** Consulta contadores nativos de rendimiento `\GPU Engine(*_engtype_3D)\Utilization Percentage` y `\GPU Adapter Memory(*)\Total Committed` con 0% de sobrecarga.
- **Métricas Clave en Vivo:**
  - FPS del juego en tiempo real (polling DirectX / Vulkan).
  - Carga 3D de la GPU y consumo de memoria VRAM dedicada.
  - Consumo exacto de CPU y memoria RAM del juego en ejecución.

#### 🖥️ 3. Overlay HUD In-Game Transparente (⭐ Exclusivo Pro)
- **HUD Integrado No Intrusivo:** Ventana flotante transparente sobre juegos en modo ventana o ventana sin bordes.
- **Click-Through Total:** Implementado mediante estilos Win32 `WS_EX_TRANSPARENT | WS_EX_LAYERED | WS_EX_TOOLWINDOW | WS_EX_NOACTIVATE` — cero input lag, los clics pasan directamente a la mira y los controles de tu juego.
- **Posición Configurable:** Cambia en vivo la ubicación del HUD entre la **esquina superior derecha** y la **esquina superior izquierda**.
- **Estabilidad con Demonio Persistente:** Sobrevive a alt-tabs, inicios y cierres de juegos sin congelarse ni cerrarse abruptamente.

#### 🔑 4. Licenciamiento Criptográfico Offline (HMAC-SHA256)
- **Sin Dependencia de Internet:** Validación matemática fuera de línea mediante firmas digitales HMAC (`OPTIMA-TITULAR-NIVEL-EXPIRACION-FIRMA`).
- **Apoyo Comunitario:** Consigue tu clave personalizada apoyando el proyecto en [Patreon](https://patreon.com/Reselec).

#### 🛡️ 5. SafeList Estricta & Detección Anti-Camuflaje
- **Blindaje del Kernel:** Bloqueo hardcoded que previene terminar procesos críticos (`smss.exe`, `csrss.exe`, `services.exe`, `lsass.exe`, `dwm.exe`, `explorer.exe`).
- **Defensa Anti-Camuflaje:** Detecta procesos sospechosos simulando ser del sistema corriendo desde `%TEMP%` o carpetas de usuario.

#### 🎨 6. Interfaz Glassmorphism Oscura Fluida
- Construida en **React 18 + Vite + Tailwind CSS** con aceleración por hardware, medidores radiales y panel de auditoría detallado.

---

### 👑 Comparativa Community vs. Edición Pro

| Característica | Community (Gratis) | Edición Pro ⭐ |
| :--- | :---: | :---: |
| **Optimizador Híbrido IA + Heurística** | ✅ | ✅ |
| **1-Click Game Boost & Limpieza de RAM** | ✅ | ✅ |
| **Blindaje SafeList & Anti-Camuflaje** | ✅ | ✅ |
| **Telemetría en App (FPS, GPU, VRAM)** | ✅ | ✅ |
| **Centinela Auto-Boost para Juegos** | ✅ | ✅ |
| **Overlay HUD In-Game Click-Through** | ❌ | **✅** |
| **Configuración de Esquina para el HUD** | ❌ | **✅** |
| **Rol en Discord & Actualizaciones Prioritarias** | ❌ | **✅** |

> 💡 *Para activar Pro, visita [patreon.com/Reselec](https://patreon.com/Reselec), obtén tu clave, haz clic en **Activar PRO** en el dashboard y pégala.*

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
