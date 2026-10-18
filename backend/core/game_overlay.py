"""
OptimaAI - In-Game HUD Overlay 2.0 (Gamer & Benchmark Edition)
Displays authentic real-time FPS, 1% Low FPS, live Frame-Time Sparkline,
GPU/VRAM/CPU telemetry, and Benchmark recording status over active games.
Features 4-corner screen positioning, 4 customizable color themes,
compact/full layouts, and Win32 WS_EX_TRANSPARENT zero-lag click-through.
"""

from __future__ import annotations
import os
import sys
import time
import threading
import tkinter as tk
from typing import Optional, Dict, Any, List

GWL_EXSTYLE = -20
WS_EX_TOPMOST = 0x00000008
WS_EX_TRANSPARENT = 0x00000020
WS_EX_LAYERED = 0x00080000
WS_EX_TOOLWINDOW = 0x00000080
WS_EX_NOACTIVATE = 0x08000000

# Color Themes definition
THEMES = {
    "cyan": {
        "bg_root": "#080C14",
        "bg_panel": "#0B132B",
        "border": "#0284C7",
        "title": "#38BDF8",
        "fps": "#38BDF8",
        "low_fps": "#22D3EE",
        "accent": "#F59E0B",
        "gpu": "#38BDF8",
        "cpu": "#F43F5E",
        "vram": "#A855F7",
        "sparkline_good": "#06B6D4",
        "sparkline_mid": "#F59E0B",
        "sparkline_bad": "#EF4444",
    },
    "cyberpunk": {
        "bg_root": "#050F0A",
        "bg_panel": "#061A12",
        "border": "#10B981",
        "title": "#34D399",
        "fps": "#10B981",
        "low_fps": "#6EE7B7",
        "accent": "#FBBF24",
        "gpu": "#10B981",
        "cpu": "#F87171",
        "vram": "#A78BFA",
        "sparkline_good": "#10B981",
        "sparkline_mid": "#F59E0B",
        "sparkline_bad": "#EF4444",
    },
    "violet": {
        "bg_root": "#0D0818",
        "bg_panel": "#170F2E",
        "border": "#8B5CF6",
        "title": "#C084FC",
        "fps": "#A855F7",
        "low_fps": "#D8B4FE",
        "accent": "#38BDF8",
        "gpu": "#818CF8",
        "cpu": "#FB7185",
        "vram": "#C084FC",
        "sparkline_good": "#A855F7",
        "sparkline_mid": "#F59E0B",
        "sparkline_bad": "#EF4444",
    },
    "stealth": {
        "bg_root": "#0B0F17",
        "bg_panel": "#111827",
        "border": "#475569",
        "title": "#E2E8F0",
        "fps": "#F8FAFC",
        "low_fps": "#CBD5E1",
        "accent": "#94A3B8",
        "gpu": "#94A3B8",
        "cpu": "#CBD5E1",
        "vram": "#94A3B8",
        "sparkline_good": "#94A3B8",
        "sparkline_mid": "#F59E0B",
        "sparkline_bad": "#EF4444",
    }
}

class InGameOverlay:
    def __init__(self):
        self.is_active: bool = False
        self.position: str = "top-right"  # "top-left", "top-right", "bottom-left", "bottom-right"
        self.theme: str = "cyan"          # "cyan", "cyberpunk", "violet", "stealth"
        self.layout: str = "full"         # "full" or "compact"
        
        self._visible: bool = False
        self._root: Optional[tk.Tk] = None
        self._thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()
        
        # UI Element references
        self._main_frame: Optional[tk.Frame] = None
        self._top_row: Optional[tk.Frame] = None
        self._metrics_row: Optional[tk.Frame] = None
        
        self._lbl_fps: Optional[tk.Label] = None
        self._lbl_low: Optional[tk.Label] = None
        self._lbl_bench: Optional[tk.Label] = None
        self._lbl_gpu: Optional[tk.Label] = None
        self._lbl_cpu: Optional[tk.Label] = None
        self._lbl_ram: Optional[tk.Label] = None
        self._lbl_game: Optional[tk.Label] = None
        self._lbl_pro: Optional[tk.Label] = None
        self._canvas_spark: Optional[tk.Canvas] = None

        # Start persistent daemon window thread
        self._start_daemon_thread()

    def _start_daemon_thread(self):
        """Initializes persistent Tkinter daemon thread on startup."""
        self._thread = threading.Thread(target=self._run_gui, daemon=True, name="InGameOverlayDaemon")
        self._thread.start()

    def start_overlay(self, position: Optional[str] = None, theme: Optional[str] = None, layout: Optional[str] = None) -> bool:
        """Shows the in-game overlay with specified config."""
        with self._lock:
            if position:
                self.position = position
            if theme and theme in THEMES:
                self.theme = theme
            if layout in ["full", "compact"]:
                self.layout = layout
            self.is_active = True
            return True

    def stop_overlay(self) -> bool:
        """Hides the in-game overlay without destroying Tkinter context."""
        with self._lock:
            self.is_active = False
            return True

    def toggle(self) -> bool:
        with self._lock:
            self.is_active = not self.is_active
            return self.is_active

    def update_config(self, position: Optional[str] = None, theme: Optional[str] = None, layout: Optional[str] = None) -> Dict[str, Any]:
        """Dynamically applies position, theme or layout changes."""
        with self._lock:
            if position in ["top-left", "top-right", "bottom-left", "bottom-right"]:
                self.position = position
            if theme in THEMES:
                self.theme = theme
            if layout in ["full", "compact"]:
                self.layout = layout

        # If window exists, trigger reposition and theme restyle
        if self._root:
            try:
                self._root.after(0, self._apply_styling)
                self._root.after(0, lambda: self._reposition(self._root))
            except Exception:
                pass

        return self.get_config()

    def get_config(self) -> Dict[str, Any]:
        with self._lock:
            return {
                "is_active": self.is_active,
                "position": self.position,
                "theme": self.theme,
                "layout": self.layout
            }

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

    def _reposition(self, root: tk.Tk):
        """Calculates geometry based on position, layout mode and screen resolution."""
        try:
            screen_width = root.winfo_screenwidth()
            screen_height = root.winfo_screenheight()
            
            # Dimensions based on compact vs full
            if self.layout == "compact":
                overlay_width = 280
                overlay_height = 42
            else:
                overlay_width = 460
                overlay_height = 62

            margin_x = 24
            margin_y = 20

            if self.position == "top-left":
                x = margin_x
                y = margin_y
            elif self.position == "top-right":
                x = max(screen_width - overlay_width - margin_x, 20)
                y = margin_y
            elif self.position == "bottom-left":
                x = margin_x
                y = max(screen_height - overlay_height - margin_y - 48, 20)
            else:  # bottom-right
                x = max(screen_width - overlay_width - margin_x, 20)
                y = max(screen_height - overlay_height - margin_y - 48, 20)

            root.geometry(f"{overlay_width}x{overlay_height}+{x}+{y}")
        except Exception:
            pass

    def _apply_styling(self):
        """Restyles all widgets with the current color palette."""
        t = THEMES.get(self.theme, THEMES["cyan"])
        try:
            if self._root:
                self._root.configure(bg=t["bg_root"])
            if self._main_frame:
                self._main_frame.configure(bg=t["bg_panel"], highlightbackground=t["border"])
            if self._top_row:
                self._top_row.configure(bg=t["bg_panel"])
            if self._metrics_row:
                self._metrics_row.configure(bg=t["bg_panel"])

            if self._lbl_game:
                self._lbl_game.configure(bg=t["bg_panel"], fg=t["title"])
            if self._lbl_pro:
                self._lbl_pro.configure(bg=t["bg_panel"], fg=t["accent"])
            if self._lbl_fps:
                self._lbl_fps.configure(bg=t["bg_panel"], fg=t["fps"])
            if self._lbl_low:
                self._lbl_low.configure(bg=t["bg_panel"], fg=t["low_fps"])
            if self._lbl_gpu:
                self._lbl_gpu.configure(bg=t["bg_panel"], fg=t["gpu"])
            if self._lbl_cpu:
                self._lbl_cpu.configure(bg=t["bg_panel"], fg=t["cpu"])
            if self._lbl_ram:
                self._lbl_ram.configure(bg=t["bg_panel"], fg=t["vram"])
            if self._canvas_spark:
                self._canvas_spark.configure(bg=t["bg_panel"])
        except Exception:
            pass

    def _run_gui(self):
        """Runs the persistent Tk mainloop in this dedicated thread."""
        try:
            root = tk.Tk()
            self._root = root
            root.title("OptimaAI In-Game HUD 2.0")
            root.overrideredirect(True)
            root.wm_attributes("-topmost", True)
            root.wm_attributes("-alpha", 0.92)

            t = THEMES.get(self.theme, THEMES["cyan"])
            self._reposition(root)
            root.configure(bg=t["bg_root"])

            # Container Frame with rounded appearance
            self._main_frame = tk.Frame(root, bg=t["bg_panel"], bd=1, relief="solid", highlightbackground=t["border"], highlightthickness=1)
            self._main_frame.pack(fill="both", expand=True)

            # Top row: Game Title, Benchmark REC indicator & Pro Badge
            self._top_row = tk.Frame(self._main_frame, bg=t["bg_panel"])
            self._top_row.pack(fill="x", padx=8, pady=(3, 1))

            self._lbl_game = tk.Label(
                self._top_row,
                text="🎮 OptimaAI Centinela",
                fg=t["title"],
                bg=t["bg_panel"],
                font=("Segoe UI", 9, "bold")
            )
            self._lbl_game.pack(side="left")

            self._lbl_bench = tk.Label(
                self._top_row,
                text="",
                fg="#EF4444",
                bg=t["bg_panel"],
                font=("Segoe UI", 8, "bold")
            )
            self._lbl_bench.pack(side="left", padx=(8, 0))

            self._lbl_pro = tk.Label(
                self._top_row,
                text="HUD 2.0",
                fg=t["accent"],
                bg=t["bg_panel"],
                font=("Segoe UI", 8, "bold")
            )
            self._lbl_pro.pack(side="right")

            # Metrics Row
            self._metrics_row = tk.Frame(self._main_frame, bg=t["bg_panel"])
            self._metrics_row.pack(fill="x", padx=8, pady=(0, 4))

            # Primary: Real FPS & 1% Low
            self._lbl_fps = tk.Label(self._metrics_row, text="FPS: --", fg=t["fps"], bg=t["bg_panel"], font=("Consolas", 11, "bold"))
            self._lbl_fps.pack(side="left", padx=(0, 6))

            self._lbl_low = tk.Label(self._metrics_row, text="1%: --", fg=t["low_fps"], bg=t["bg_panel"], font=("Consolas", 9, "bold"))
            self._lbl_low.pack(side="left", padx=(0, 8))

            # Secondary: GPU, CPU, VRAM (hidden in compact mode)
            self._lbl_gpu = tk.Label(self._metrics_row, text="GPU: 0%", fg=t["gpu"], bg=t["bg_panel"], font=("Consolas", 9, "bold"))
            self._lbl_gpu.pack(side="left", padx=(0, 6))

            self._lbl_cpu = tk.Label(self._metrics_row, text="CPU: 0%", fg=t["cpu"], bg=t["bg_panel"], font=("Consolas", 9, "bold"))
            self._lbl_cpu.pack(side="left", padx=(0, 6))

            self._lbl_ram = tk.Label(self._metrics_row, text="VRAM: 0G", fg=t["vram"], bg=t["bg_panel"], font=("Consolas", 9, "bold"))
            self._lbl_ram.pack(side="left", padx=(0, 8))

            # Mini Sparkline Frame-Time Graph Canvas (right-aligned)
            self._canvas_spark = tk.Canvas(self._metrics_row, width=64, height=16, bg=t["bg_panel"], bd=0, highlightthickness=0)
            self._canvas_spark.pack(side="right")

            # Apply Click-Through after window maps
            root.update_idletasks()
            self._apply_click_through(root)

            # Start hidden by default
            root.withdraw()
            self._visible = False

            # Start 150ms smooth tick loop
            self._tick_loop()
            root.mainloop()
        except Exception:
            pass

    def _tick_loop(self):
        """Unified 150ms smooth update and visibility loop."""
        if not self._root:
            return

        try:
            # 1. Manage visibility cleanly inside this thread
            if self.is_active and not self._visible:
                self._reposition(self._root)
                self._root.deiconify()
                self._apply_click_through(self._root)
                self._visible = True
            elif not self.is_active and self._visible:
                self._root.withdraw()
                self._visible = False

            # 2. If visible, update live metrics & sparkline
            if self._visible:
                self._refresh_labels()

        except Exception:
            pass
        finally:
            if self._root:
                self._root.after(150, self._tick_loop)

    def _refresh_labels(self):
        """Updates text labels and sparkline canvas with high-precision metrics."""
        try:
            from backend.core.gpu_telemetry import gpu_telemetry
            from backend.core.game_detector import game_detector
            from backend.core.benchmark_manager import benchmark_manager

            snap = gpu_telemetry.get_snapshot()
            bench = benchmark_manager.get_live_metrics()
            active = game_detector.active_game

            fps_val = bench.get("instant_fps", 60)
            one_pct = bench.get("one_percent_low", 60)
            spark_times = bench.get("sparkline_frame_times", [])

            gpu_val = snap.get("gpu_usage_pct", 0.0)
            vram_val = snap.get("vram_used_gb", 0.0)
            cpu_val = snap.get("game_cpu_pct", 0.0)
            if cpu_val == 0.0:
                import psutil
                cpu_val = round(psutil.cpu_percent(), 1)

            # Update FPS & 1% Low
            if self._lbl_fps:
                self._lbl_fps.configure(text=f"FPS: {fps_val}")
            if self._lbl_low:
                self._lbl_low.configure(text=f"1%: {one_pct}")

            # Layout adaptations: compact vs full
            if self.layout == "compact":
                if self._lbl_gpu: self._lbl_gpu.pack_forget()
                if self._lbl_cpu: self._lbl_cpu.pack_forget()
                if self._lbl_ram: self._lbl_ram.pack_forget()
                if self._top_row: self._top_row.pack_forget()
            else:
                if self._top_row and not self._top_row.winfo_ismapped():
                    self._top_row.pack(fill="x", padx=8, pady=(3, 1), before=self._metrics_row)
                if self._lbl_gpu and not self._lbl_gpu.winfo_ismapped():
                    self._lbl_gpu.pack(side="left", padx=(0, 6))
                if self._lbl_cpu and not self._lbl_cpu.winfo_ismapped():
                    self._lbl_cpu.pack(side="left", padx=(0, 6))
                if self._lbl_ram and not self._lbl_ram.winfo_ismapped():
                    self._lbl_ram.pack(side="left", padx=(0, 8))

                if self._lbl_gpu: self._lbl_gpu.configure(text=f"GPU: {gpu_val}%")
                if self._lbl_cpu: self._lbl_cpu.configure(text=f"CPU: {cpu_val}%")
                if self._lbl_ram: self._lbl_ram.configure(text=f"VRAM: {vram_val}G")

            # Benchmark REC Status Indicator
            if self._lbl_bench:
                if bench.get("is_benchmarking"):
                    elapsed = int(bench.get("benchmark_elapsed_sec", 0))
                    mins = elapsed // 60
                    secs = elapsed % 60
                    avg = bench.get("avg_fps", 60)
                    self._lbl_bench.configure(text=f"● REC {mins:02d}:{secs:02d} (Avg: {avg})")
                else:
                    self._lbl_bench.configure(text="")

            # Game Name
            if self._lbl_game and self._top_row.winfo_ismapped():
                if active:
                    self._lbl_game.configure(text=f"🎮 {active.name[:20]}")
                else:
                    self._lbl_game.configure(text="🎮 OptimaAI Centinela")

            # Draw Sparkline Frame-Time Graph
            if self._canvas_spark and spark_times:
                self._draw_sparkline(spark_times)

        except Exception:
            pass

    def _draw_sparkline(self, frame_times: List[float]):
        """Renders mini frame-time bars on canvas."""
        canvas = self._canvas_spark
        if not canvas:
            return
        
        t = THEMES.get(self.theme, THEMES["cyan"])
        canvas.delete("all")
        c_width = 64
        c_height = 16

        # Draw target 60FPS reference line (16.6ms -> 50% height)
        canvas.create_line(0, c_height // 2, c_width, c_height // 2, fill="#334155", dash=(2, 2))

        # Max 20 bars
        samples = frame_times[-20:]
        num_bars = len(samples)
        if num_bars == 0:
            return

        bar_width = max(c_width / 20.0, 2.0)

        for i, ms in enumerate(samples):
            # Scale 0ms -> bottom (16), 33.3ms -> top (0)
            norm = min(max(ms / 33.3, 0.05), 1.0)
            bar_height = norm * c_height
            y1 = c_height
            y0 = max(c_height - bar_height, 1)
            x0 = i * bar_width
            x1 = x0 + bar_width - 1

            # Color code: green = smooth (<16.6ms), yellow = 16-25ms, red = stutter (>25ms)
            if ms <= 16.7:
                color = t["sparkline_good"]
            elif ms <= 28.0:
                color = t["sparkline_mid"]
            else:
                color = t["sparkline_bad"]

            canvas.create_rectangle(x0, y0, x1, y1, fill=color, outline="")

game_overlay = InGameOverlay()
