"""
OptimaAI - Smart Game Detection & Auto-Boost Subsystem
Monitors active processes in real time to detect games from Steam, Epic Games,
Riot Games, Battle.net, Xbox, and custom directories.
Automatically triggers Game Boost when a game starts, elevates game CPU priority,
and restores normal system priorities when the game closes.
"""

from __future__ import annotations
import os
import sys
import time
import threading
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Set, Any
import psutil
from pydantic import BaseModel, Field

from backend.core.security import security_manager
from backend.core.license_manager import license_manager

# Common game directory markers (case-insensitive substring in exe path)
GAME_DIRECTORY_MARKERS = [
    r"steamapps\common",
    r"epic games",
    r"riot games",
    r"battle.net",
    r"ubisoft game launcher\games",
    r"ea games",
    r"origin games",
    r"xboxgames",
    r"\games",
    r"\juegos",
]

# Excluded launchers & helper web renderers (they are NOT the actual game)
LAUNCHER_EXCLUSIONS: Set[str] = {
    "steam.exe",
    "steamwebhelper.exe",
    "steamservice.exe",
    "steamerrorreporter.exe",
    "epicgameslauncher.exe",
    "epicwebhelper.exe",
    "riotclientservices.exe",
    "riotclientux.exe",
    "battlenet.exe",
    "eadesktop.exe",
    "upc.exe",
    "ubisoftconnect.exe",
    "gog galaxy.exe",
    "galaxyclient.exe",
    "galaxyclienthelper.exe",
    "wallpaper32.exe",
    "wallpaper64.exe",
}

# Known popular game executable names
KNOWN_GAME_BINARIES: Set[str] = {
    "cs2.exe",
    "csgo.exe",
    "dota2.exe",
    "fortniteclient-win64-shipping.exe",
    "valorant-win64-shipping.exe",
    "league of legends.exe",
    "r5apex.exe",
    "gta5.exe",
    "gtaiv.exe",
    "cyberpunk2077.exe",
    "witcher3.exe",
    "eldenring.exe",
    "rocketleague.exe",
    "overwatch.exe",
    "cod.exe",
    "genshinimpact.exe",
    "starfield.exe",
    "robloxplayerbeta.exe",
    "fallguys_client.exe",
    "baldursgate3.exe",
    "bg3.exe",
    "bg3_dx11.exe",
    "helldivers2.exe",
    "ffxiv_dx11.exe",
    "pubg.exe",
    "tslgame.exe",
    "deadbydaylight.exe",
    "rainbowsix.exe",
    "rainbowsix_vulkan.exe",
    "rustclient.exe",
    "palworld-win64-shipping.exe",
    "blackmythwukong.exe",
    "b1-win64-shipping.exe",
}

class DetectedGame(BaseModel):
    pid: int
    name: str
    path: str = ""
    platform: str = "Local PC"
    detected_at: str = ""
    priority_elevated: bool = False

class GameDetectorStatus(BaseModel):
    enabled: bool = True
    is_pro: bool = False
    active_game: Optional[DetectedGame] = None
    custom_games: List[str] = Field(default_factory=list)
    monitored_platforms: List[str] = Field(default_factory=lambda: [
        "Steam", "Epic Games", "Riot Games", "Battle.net", "Xbox App", "Custom Exes"
    ])
    last_event: Optional[str] = "Centinela activo: esperando inicio de juego"

class SmartGameDetector:
    def __init__(self):
        self.enabled: bool = True
        self.auto_overlay: bool = True
        self.active_game: Optional[DetectedGame] = None
        self.custom_games: Set[str] = set()
        self._throttled_pids: List[int] = []
        self._last_event: str = "Centinela activo: esperando inicio de juego"
        self._lock = threading.Lock()
        self._stop_event = threading.Event()
        self._worker_thread: Optional[threading.Thread] = None

    def start_background_monitor(self):
        """Starts the lightweight background detection thread."""
        with self._lock:
            if self._worker_thread is not None and self._worker_thread.is_alive():
                return
            self._stop_event.clear()
            self._worker_thread = threading.Thread(target=self._monitor_loop, daemon=True, name="SmartGameDetectorThread")
            self._worker_thread.start()

    def stop_background_monitor(self):
        """Stops the background detection thread."""
        self._stop_event.set()

    def add_custom_game(self, exe_name: str) -> bool:
        clean = exe_name.strip().lower()
        if not clean.endswith(".exe"):
            clean += ".exe"
        self.custom_games.add(clean)
        return True

    def remove_custom_game(self, exe_name: str) -> bool:
        clean = exe_name.strip().lower()
        if clean in self.custom_games:
            self.custom_games.remove(clean)
            return True
        return False

    def _identify_platform(self, path_str: str) -> str:
        p = path_str.lower()
        if "steamapps" in p:
            return "Steam"
        if "epic games" in p:
            return "Epic Games"
        if "riot games" in p or "valorant" in p or "league" in p:
            return "Riot Games"
        if "battle.net" in p or "blizzard" in p:
            return "Battle.net"
        if "xboxgames" in p or "windowsapps" in p:
            return "Xbox App"
        if "ubisoft" in p:
            return "Ubisoft Connect"
        if "ea games" in p or "origin games" in p:
            return "EA App"
        return "Juego Local"

    def _is_game_process(self, proc: psutil.Process) -> tuple[bool, str]:
        """
        Determines if a process is an active gaming binary.
        """
        try:
            name = proc.name().lower()
            if name in LAUNCHER_EXCLUSIONS:
                return False, ""

            # 1. Check custom user games
            if name in self.custom_games:
                return True, "Juego Personalizado"

            # 2. Check known game executable list
            if name in KNOWN_GAME_BINARIES:
                return True, "Juego Reconocido"

            # 3. Check Unreal Engine / Unity shipping binary patterns
            if "shipping.exe" in name or "-win64-shipping" in name or "game_win64" in name:
                return True, "Motor de Juego (UE/Unity)"

            # 4. Check executable folder path
            try:
                exe_path = proc.exe().lower()
                for marker in GAME_DIRECTORY_MARKERS:
                    if marker in exe_path:
                        # Exclude uninstaller / updater binaries
                        if not any(k in name for k in ["crash", "report", "update", "patch", "unins", "redist"]):
                            platform = self._identify_platform(exe_path)
                            return True, platform
            except Exception:
                pass

        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass

        return False, ""

    def _elevate_game_priority(self, pid: int) -> bool:
        """Sets game process CPU priority to HIGH_PRIORITY_CLASS."""
        if not sys.platform.startswith("win"):
            return False
        try:
            p = psutil.Process(pid)
            p.nice(psutil.HIGH_PRIORITY_CLASS)
            return True
        except Exception:
            try:
                p = psutil.Process(pid)
                p.nice(psutil.ABOVE_NORMAL_PRIORITY_CLASS)
                return True
            except Exception:
                return False

    def _restore_system_priorities(self):
        """Restores background apps to normal priority when game exits."""
        if not sys.platform.startswith("win"):
            return
        restored = 0
        for pid in list(self._throttled_pids):
            try:
                p = psutil.Process(pid)
                if p.is_running():
                    p.nice(psutil.NORMAL_PRIORITY_CLASS)
                    restored += 1
            except Exception:
                pass
        self._throttled_pids = []
        return restored

    def _on_game_started(self, game: DetectedGame):
        """Lifecycle handler when a game launch is detected."""
        now_str = datetime.now().strftime("%H:%M:%S")
        self.active_game = game
        self._last_event = f"🎮 Jugando a {game.name} ({game.platform}). Auto-Boost aplicado a las {now_str}."

        from backend.core.executor import action_executor
        from backend.core.audit_logger import audit_logger

        # Only apply full Pro Auto-Boost actions if user is Pro
        is_pro = license_manager.get_status().is_pro

        elevated = False
        if is_pro:
            # 1. Elevate Game CPU priority
            elevated = self._elevate_game_priority(game.pid)
            game.priority_elevated = elevated

            # 2. Run Game Boost (RAM sweep + background throttling)
            boost_res = action_executor.apply_game_boost()
            self._throttled_pids = boost_res.get("throttled_pids", [])

            # 3. Auto-launch In-Game HUD overlay if enabled
            try:
                from backend.core.game_overlay import game_overlay
                if getattr(self, "auto_overlay", True):
                    game_overlay.start_overlay()
            except Exception:
                pass

            audit_logger.add_entry({
                "timestamp": now_str,
                "type": "smart_game_boost_started",
                "action_title": f"🎮 Smart Game Boost: {game.name}",
                "summary": (
                    f"Detectado juego '{game.name}' ({game.platform}). Se elevó su prioridad de CPU a ALTA "
                    f"y se liberaron {boost_res.get('total_freed_ram_mb', 0)} MB de memoria física."
                ),
                "freed_mb": boost_res.get("total_freed_ram_mb", 0),
                "technical_explanation": (
                    f"Prioridad del juego fijada en HIGH_PRIORITY_CLASS. Vaciado masivo Win32 (EmptyWorkingSet) "
                    f"y throttling a IDLE en {len(self._throttled_pids)} aplicaciones secundarias de fondo."
                )
            })
        else:
            audit_logger.add_entry({
                "timestamp": now_str,
                "type": "game_detected_free",
                "action_title": f"🎮 Juego detectado: {game.name}",
                "summary": (
                    f"Se detectó el juego '{game.name}' en ejecución ({game.platform}). "
                    f"Para activar el Auto-Boost y prioridad ALTA automática, desbloquea la versión Pro."
                ),
                "freed_mb": 0.0,
                "technical_explanation": "Detección pasiva en OptimaAI Community Edition."
            })

    def _on_game_closed(self, game_name: str):
        """Lifecycle handler when game terminates."""
        now_str = datetime.now().strftime("%H:%M:%S")
        self._restore_system_priorities()
        self.active_game = None
        self._last_event = f"Juego cerrado ({game_name}). Prioridades de Windows restauradas a la normalidad a las {now_str}."

        try:
            from backend.core.game_overlay import game_overlay
            game_overlay.stop_overlay()
        except Exception:
            pass

        from backend.core.audit_logger import audit_logger
        audit_logger.add_entry({
            "timestamp": now_str,
            "type": "smart_game_boost_ended",
            "action_title": f"🎮 Juego finalizado: {game_name}",
            "summary": "Sesión de juego concluida. Todas las prioridades de aplicaciones en segundo plano fueron restauradas.",
            "freed_mb": 0.0,
            "technical_explanation": "Restauración de procesos throttled a NORMAL_PRIORITY_CLASS."
        })

    def _monitor_loop(self):
        """Continuous background monitor loop (runs every 3.5 seconds)."""
        while not self._stop_event.is_set():
            if not self.enabled:
                self._stop_event.wait(3.5)
                continue

            try:
                # 1. If we currently have an active game, check if it's still alive
                if self.active_game:
                    still_running = False
                    try:
                        p = psutil.Process(self.active_game.pid)
                        if p.is_running() and p.name().lower() == self.active_game.name.lower():
                            still_running = True
                    except Exception:
                        still_running = False

                    if not still_running:
                        closed_name = self.active_game.name
                        self._on_game_closed(closed_name)

                # 2. If no game is active, scan processes for new game launches
                if not self.active_game:
                    for proc in psutil.process_iter(['pid', 'name']):
                        is_game, platform = self._is_game_process(proc)
                        if is_game:
                            exe_path = ""
                            try:
                                exe_path = proc.exe()
                            except Exception:
                                pass
                            
                            new_game = DetectedGame(
                                pid=proc.pid,
                                name=proc.name(),
                                path=exe_path,
                                platform=platform or self._identify_platform(exe_path),
                                detected_at=datetime.now().strftime("%H:%M:%S")
                            )
                            self._on_game_started(new_game)
                            break

            except Exception as e:
                pass

            self._stop_event.wait(3.5)

    def get_status(self) -> GameDetectorStatus:
        is_pro = license_manager.get_status().is_pro
        return GameDetectorStatus(
            enabled=self.enabled,
            is_pro=is_pro,
            active_game=self.active_game,
            custom_games=sorted(list(self.custom_games)),
            last_event=self._last_event
        )

# Global singleton
game_detector = SmartGameDetector()
