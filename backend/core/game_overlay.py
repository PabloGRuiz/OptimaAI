"""
OptimaAI - In-Game Topmost Click-Through Gaming Overlay (PRO)
Displays real-time FPS, CPU, GPU, VRAM, and RAM metrics over active full-screen games.
Uses Win32 WS_EX_TRANSPARENT to guarantee zero interference with gameplay or mouse clicks.
"""

from __future__ import annotations
import os
import sys
import time
import threading
import tkinter as tk
from typing import Optional, Dict, Any

GWL_EXSTYLE = -20
WS_EX_TOPMOST = 0x00000008
WS_EX_TRANSPARENT = 0x00000020
WS_EX_LAYERED = 0x00080000
WS_EX_TOOLWINDOW = 0x00000080
WS_EX_NOACTIVATE = 0x08000000

class InGameOverlay:
    def __init__(self):
        self.is_active: bool = False
        self.position: str = "top-right"  # "top-right" or "top-left"
        self._root: Optional[tk.Tk] = None
        self._thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()
        
        # Label references
        self._lbl_fps: Optional[tk.Label] = None
        self._lbl_gpu: Optional[tk.Label] = None
        self._lbl_cpu: Optional[tk.Label] = None
        self._lbl_ram: Optional[tk.Label] = None
        self._lbl_game: Optional[tk.Label] = None

    def start_overlay(self, position: str = "top-right") -> bool:
        """Launches in-game overlay in a dedicated thread."""
        with self._lock:
            if self.is_active:
                return True
            self.position = position
            self.is_active = True
            self._thread = threading.Thread(target=self._run_gui, daemon=True, name="InGameOverlayThread")
            self._thread.start()
            return True

    def stop_overlay(self) -> bool:
        """Closes and destroys in-game overlay."""
        with self._lock:
            if not self.is_active:
                return False
            self.is_active = False
            if self._root:
                try:
                    self._root.after(0, self._root.destroy)
                except Exception:
                    pass
                self._root = None
            return True

    def toggle(self) -> bool:
        if self.is_active:
            self.stop_overlay()
            return False
        else:
            self.start_overlay()
            return True

    def _apply_click_through(self, root: tk.Tk):
        """Applies Win32 Click-Through and Toolwindow styles so mouse clicks pass through."""
        if not sys.platform.startswith("win"):
            return
        import ctypes
        try:
            hwnd = ctypes.windll.user32.GetParent(root.winfo_id())
            if hwnd == 0:
                hwnd = root.winfo_id()
            old_style = ctypes.windll.user32.GetWindowLongW(hwnd, GWL_EXSTYLE)
            new_style = old_style | WS_EX_TRANSPARENT | WS_EX_LAYERED | WS_EX_TOOLWINDOW | WS_EX_NOACTIVATE
            ctypes.windll.user32.SetWindowLongW(hwnd, GWL_EXSTYLE, new_style)
        except Exception:
            pass

    def _run_gui(self):
        root = tk.Tk()
        self._root = root
        root.title("OptimaAI In-Game HUD")
        root.overrideredirect(True)
        root.wm_attributes("-topmost", True)
        root.wm_attributes("-alpha", 0.90)

        # Calculate positioning
        screen_width = root.winfo_screenwidth()
        overlay_width = 440
        overlay_height = 54
        
        if self.position == "top-left":
            x = 30
            y = 20
        else:  # top-right
            x = max(screen_width - overlay_width - 30, 20)
            y = 20

        root.geometry(f"{overlay_width}x{overlay_height}+{x}+{y}")
        root.configure(bg="#090D16")

        # Container Frame
        main_frame = tk.Frame(root, bg="#0F172A", bd=1, relief="solid", highlightbackground="#3B82F6", highlightthickness=1)
        main_frame.pack(fill="both", expand=True)

        # Top row: Game Title & Pro Badge
        top_row = tk.Frame(main_frame, bg="#0F172A")
        top_row.pack(fill="x", padx=8, pady=(4, 2))

        self._lbl_game = tk.Label(
            top_row,
            text="🎮 OptimaAI Centinela Activo",
            fg="#93C5FD",
            bg="#0F172A",
            font=("Segoe UI", 9, "bold")
        )
        self._lbl_game.pack(side="left")

        lbl_pro = tk.Label(
            top_row,
            text="PRO AUTO-BOOST",
            fg="#F59E0B",
            bg="#0F172A",
            font=("Segoe UI", 8, "bold")
        )
        lbl_pro.pack(side="right")

        # Metrics Row
        metrics_row = tk.Frame(main_frame, bg="#0F172A")
        metrics_row.pack(fill="x", padx=8, pady=(0, 4))

        self._lbl_fps = tk.Label(metrics_row, text="FPS: 165", fg="#10B981", bg="#0F172A", font=("Consolas", 11, "bold"))
        self._lbl_fps.pack(side="left", padx=(0, 10))

        self._lbl_gpu = tk.Label(metrics_row, text="GPU: 0%", fg="#38BDF8", bg="#0F172A", font=("Consolas", 10, "bold"))
        self._lbl_gpu.pack(side="left", padx=(0, 10))

        self._lbl_cpu = tk.Label(metrics_row, text="CPU: 0%", fg="#F43F5E", bg="#0F172A", font=("Consolas", 10, "bold"))
        self._lbl_cpu.pack(side="left", padx=(0, 10))

        self._lbl_ram = tk.Label(metrics_row, text="VRAM: 0GB", fg="#A855F7", bg="#0F172A", font=("Consolas", 10, "bold"))
        self._lbl_ram.pack(side="left")

        # Apply Click-Through after window maps
        root.update_idletasks()
        self._apply_click_through(root)

        # Start live updater callback
        self._update_overlay_data()

        try:
            root.mainloop()
        except Exception:
            pass
        finally:
            self.is_active = False
            self._root = None

    def _update_overlay_data(self):
        if not self.is_active or not self._root:
            return

        try:
            from backend.core.gpu_telemetry import gpu_telemetry
            from backend.core.game_detector import game_detector

            snap = gpu_telemetry.get_snapshot()
            active = game_detector.active_game

            fps_val = snap.get("fps", 60)
            gpu_val = snap.get("gpu_usage_pct", 0.0)
            vram_val = snap.get("vram_used_gb", 0.0)
            cpu_val = snap.get("game_cpu_pct", 0.0)
            if cpu_val == 0.0:
                import psutil
                cpu_val = round(psutil.cpu_percent(), 1)

            if self._lbl_fps:
                self._lbl_fps.configure(text=f"FPS: {fps_val}")
            if self._lbl_gpu:
                self._lbl_gpu.configure(text=f"GPU: {gpu_val}%")
            if self._lbl_cpu:
                self._lbl_cpu.configure(text=f"CPU: {cpu_val}%")
            if self._lbl_ram:
                self._lbl_ram.configure(text=f"VRAM: {vram_val}G")

            if self._lbl_game:
                if active:
                    self._lbl_game.configure(text=f"🎮 {active.name[:22]}")
                else:
                    self._lbl_game.configure(text="🎮 OptimaAI Centinela")

            # Schedule next update in 500ms
            if self._root:
                self._root.after(500, self._update_overlay_data)
        except Exception:
            pass

game_overlay = InGameOverlay()
