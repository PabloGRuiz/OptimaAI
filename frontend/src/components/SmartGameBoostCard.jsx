import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  Sparkles,
  CheckCircle2,
  Shield,
  Plus,
  Trash2,
  Crown,
  Zap,
  Activity,
  Monitor,
  Eye,
  Layers,
  Cpu,
  Flame,
  Gauge,
  EyeOff,
  History,
  Palette,
  Maximize2,
  Minimize2,
  X,
  Clock,
  ChevronRight,
  Sliders
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import BenchmarkReportModal from './BenchmarkReportModal';
import OverlaySettingsModal from './OverlaySettingsModal';

export default function SmartGameBoostCard({
  detectorStatus,
  onToggleDetector,
  onAddCustomGame,
  onRemoveCustomGame,
  onIgnoreProcess,
  onUnignoreProcess,
  onOpenProModal
}) {
  const { t } = useLanguage();
  const [showConfig, setShowConfig] = useState(false);
  const [newGameInput, setNewGameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [gamingTelemetry, setGamingTelemetry] = useState(null);
  
  // HUD 2.0 State
  const [overlayActive, setOverlayActive] = useState(false);
  const [overlayPosition, setOverlayPosition] = useState('top-right');
  const [overlayTheme, setOverlayTheme] = useState('cyan');
  const [overlayLayout, setOverlayLayout] = useState('full');
  const [overlayLoading, setOverlayLoading] = useState(false);
  const [isOverlaySettingsOpen, setIsOverlaySettingsOpen] = useState(false);

  // Benchmark Pro State
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [latestReport, setLatestReport] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [benchmarkHistory, setBenchmarkHistory] = useState([]);

  const isPro = detectorStatus?.is_pro;
  const isEnabled = detectorStatus?.enabled;
  const activeGame = detectorStatus?.active_game;
  const customGames = detectorStatus?.custom_games || [];
  const ignoredProcesses = detectorStatus?.ignored_processes || [];

  // Polling for live cross-vendor GPU, VRAM, and FPS telemetry
  useEffect(() => {
    let isMounted = true;
    const fetchTelemetry = async () => {
      try {
        const res = await fetch('/api/gaming/telemetry');
        if (res.ok && isMounted) {
          const data = await res.json();
          setGamingTelemetry(data);
          setOverlayActive(data.overlay_active);
          // Do not overwrite local states while user is customizing in the modal
          if (!isOverlaySettingsOpen) {
            if (data.overlay_position) setOverlayPosition(data.overlay_position);
            if (data.overlay_theme) setOverlayTheme(data.overlay_theme);
            if (data.overlay_layout) setOverlayLayout(data.overlay_layout);
          }
          if (data.is_benchmarking !== undefined) setIsBenchmarking(data.is_benchmarking);
        }
      } catch (e) {
        // silent
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 1200);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOverlaySettingsOpen]);


  const handleAddGame = async (e) => {
    e.preventDefault();
    if (!newGameInput.trim()) return;
    setLoading(true);
    await onAddCustomGame(newGameInput.trim());
    setNewGameInput('');
    setLoading(false);
  };

  const handleToggleOverlay = async (targetState) => {
    if (!isPro) {
      onOpenProModal();
      return;
    }

    setOverlayLoading(true);
    try {
      const res = await fetch('/api/gaming/overlay/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: targetState, position: overlayPosition })
      });
      const data = await res.json();
      if (data.success) {
        setOverlayActive(data.overlay_active);
      }
    } catch (e) {
      console.warn("Error toggling overlay:", e);
    } finally {
      setOverlayLoading(false);
    }
  };

  const handleUpdateOverlayConfig = async (newPos, newTheme, newLayout) => {
    const pos = newPos || overlayPosition;
    const theme = newTheme || overlayTheme;
    const layout = newLayout || overlayLayout;

    if (newPos) setOverlayPosition(newPos);
    if (newTheme) setOverlayTheme(newTheme);
    if (newLayout) setOverlayLayout(newLayout);

    if (isPro) {
      try {
        await fetch('/api/gaming/overlay/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ position: pos, theme: theme, layout: layout })
        });
      } catch (e) {
        // silent
      }
    }
  };

  const handleSaveOverlaySettings = async (cfg) => {
    try {
      const res = await fetch('/api/gaming/overlay/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg)
      });
      const data = await res.json();
      if (data.success && data.config) {
        if (cfg.position) setOverlayPosition(cfg.position);
        if (cfg.theme) setOverlayTheme(cfg.theme);
        if (cfg.layout) setOverlayLayout(cfg.layout);
        setGamingTelemetry(prev => prev ? {
          ...prev,
          overlay_position: data.config.position,
          overlay_pos_x: data.config.pos_x,
          overlay_pos_y: data.config.pos_y,
          overlay_theme: data.config.theme,
          overlay_layout: data.config.layout,
          overlay_hotkey: data.config.overlay_hotkey,
          benchmark_hotkey: data.config.benchmark_hotkey,
          sound_enabled: data.config.sound_enabled
        } : prev);
      }
    } catch (e) {
      console.warn("Error saving overlay settings:", e);
    }
  };

  const handleToggleBenchmark = async () => {
    try {
      const res = await fetch('/api/benchmark/toggle', { method: 'POST' });
      const data = await res.json();
      if (data.active !== undefined) {
        setIsBenchmarking(data.active);
      }
      if (data.active === false && data.report) {
        setLatestReport(data.report);
        setIsReportModalOpen(true);
      }
    } catch (e) {
      console.warn("Error toggling benchmark:", e);
    }
  };

  const handleFetchHistory = async () => {
    try {
      const res = await fetch('/api/benchmark/history');
      if (res.ok) {
        const data = await res.json();
        setBenchmarkHistory(data.history || []);
        setShowHistory(true);
      }
    } catch (e) {
      console.warn("Error fetching history:", e);
    }
  };


  const vramUsedGb = gamingTelemetry?.vram_used_gb || 0;
  const vramTotalGb = gamingTelemetry?.vram_total_gb || 8;
  const vramPercent = Math.min(Math.round((vramUsedGb / (vramTotalGb || 1)) * 100), 100);
  const gpuLoad = gamingTelemetry?.gpu_usage_pct || 0;
  const fpsCount = gamingTelemetry?.fps || 60;
  const gpuName = gamingTelemetry?.gpu_name || 'GPU';

  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-slate-900/95 via-[#0c1220]/95 to-slate-900/95 border border-indigo-500/30 p-5 shadow-2xl shadow-indigo-500/10 overflow-hidden">
      
      {/* Decorative backdrop glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-500/15 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Gamepad2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">{t('smartGameBoost', 'title')}</h2>
              {isPro ? (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <Crown className="h-3 w-3 text-yellow-400" /> {t('smartGameBoost', 'proSentinel')}
                </span>
              ) : (
                <button
                  onClick={onOpenProModal}
                  className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 flex items-center gap-1 transition-all"
                >
                  <Crown className="h-3 w-3" /> {t('smartGameBoost', 'unlockPro')}
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {t('smartGameBoost', 'subtitle')}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors flex items-center gap-1"
          >
            <span>{showConfig ? '▲' : '⚙️'} {t('smartGameBoost', 'customGamesTitle').split(' ')[0]}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-700 text-[10px] text-slate-300">
              {customGames.length}
            </span>
          </button>

          {/* Toggle Switch */}
          <button
            onClick={() => onToggleDetector(!isEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              isEnabled ? 'bg-indigo-600' : 'bg-slate-700'
            }`}
            title={isEnabled ? 'Pausar' : 'Activar'}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main Status Display Area */}
      {activeGame ? (
        /* GAME RUNNING STATE */
        <div className="relative z-10 p-4 rounded-xl bg-gradient-to-r from-emerald-500/15 via-indigo-500/10 to-emerald-500/15 border border-emerald-500/40 shadow-inner mb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">{t('smartGameBoost', 'activeGameTitle')}</span>
                  <span className="text-sm font-extrabold text-white">{activeGame.name}</span>
                  <span className="px-2 py-0.5 text-[10px] rounded bg-slate-800/80 text-cyan-300 border border-cyan-500/30">
                    {activeGame.platform}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">(PID: {activeGame.pid})</span>
                </div>
                <p className="text-xs text-emerald-300/90 mt-0.5 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-yellow-400" />
                  {isPro
                    ? t('smartGameBoost', 'highPriorityActive')
                    : t('smartGameBoost', 'freePassiveAlert')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onIgnoreProcess && onIgnoreProcess(activeGame.name)}
                title="Ignorar proceso si no es un juego"
                className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 transition-all shadow-sm"
              >
                <EyeOff className="h-3.5 w-3.5" />
                <span>{t('smartGameBoost', 'notAGameBtn')}</span>
              </button>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Activity className="h-3.5 w-3.5" />
                <span>{t('smartGameBoost', 'gameModeActive')}</span>
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* STANDBY SCANNING STATE */
        <div className="relative z-10 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between flex-wrap gap-2 text-xs mb-4">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              {isEnabled && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isEnabled ? 'bg-cyan-500' : 'bg-slate-500'}`}></span>
            </span>
            <span className="text-slate-300">
              {isEnabled
                ? t('smartGameBoost', 'standbySentinel')
                : t('smartGameBoost', 'pausedSentinel')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Steam</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Epic</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Riot</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Battle.net</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Xbox</span>
          </div>
        </div>
      )}

      {/* LIVE GAMING HARDWARE TELEMETRY PANEL */}
      <div className="relative z-10 mb-4 bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200">{t('smartGameBoost', 'liveTelemetry')}</span>
            <span className="text-[10px] text-slate-400">({gpuName})</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Direct3D / PDH
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Tile 1: Authentic FPS */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="font-semibold flex items-center gap-1">
                <Gauge className="h-3 w-3 text-emerald-400" /> {t('smartGameBoost', 'fps')}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-emerald-400/80 font-bold">DXGI/ETW</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-emerald-400 font-mono">
                {activeGame ? fpsCount : 60}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">fps</span>
            </div>
          </div>

          {/* Tile 2: 1% Low FPS (Real Stability Metric) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="font-semibold flex items-center gap-1">
                <Activity className="h-3 w-3 text-cyan-400" /> {t('benchmark', 'onePercentLow', '1% Low FPS')}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-cyan-400/80 font-bold">P99 Cadence</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-cyan-300 font-mono">
                {activeGame ? (gamingTelemetry?.one_percent_low || 60) : 60}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">fps</span>
            </div>
          </div>

          {/* Tile 3: GPU 3D Load & VRAM */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="font-semibold flex items-center gap-1">
                <Flame className="h-3 w-3 text-amber-400" /> {t('smartGameBoost', 'gpuLoad')}
              </span>
              <span className="text-[9px] font-mono text-purple-300 font-bold">{vramUsedGb}G / {vramTotalGb}G</span>
            </div>
            <div className="mt-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 mb-1">
                <span>GPU {gpuLoad}%</span>
                <span>VRAM {vramPercent}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${gpuLoad}%` }}
                />
              </div>
            </div>
          </div>

          {/* Tile 4: Benchmark Controller CTA */}
          <div className="bg-slate-900/90 border border-indigo-500/30 rounded-lg p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="font-semibold text-white flex items-center gap-1">
                <Zap className="h-3 w-3 text-yellow-400" /> Benchmark Pro
              </span>
              <button
                onClick={handleFetchHistory}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
              >
                <History className="h-2.5 w-2.5" /> {t('smartGameBoost', 'benchHistoryBtn', 'Historial')}
              </button>
            </div>

            <button
              onClick={handleToggleBenchmark}
              className={`mt-1.5 w-full py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md ${
                isBenchmarking
                  ? 'bg-gradient-to-r from-rose-600 via-red-500 to-amber-600 text-white animate-pulse shadow-rose-600/30'
                  : 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-indigo-600/20'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${isBenchmarking ? 'bg-white' : 'bg-red-400'}`} />
              <span>
                {isBenchmarking
                  ? `${t('smartGameBoost', 'stopBenchBtn', 'Detener')} (${Math.floor((gamingTelemetry?.benchmark_elapsed_sec || 0) / 60)}:${Math.floor((gamingTelemetry?.benchmark_elapsed_sec || 0) % 60).toString().padStart(2, '0')})`
                  : t('smartGameBoost', 'startBenchBtn', 'Grabar Benchmark (F11)')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* PRO EXCLUSIVE: IN-GAME OVERLAY 2.0 CONTROL BAR */}
      <div className="relative z-10 p-3.5 rounded-xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-purple-950/40 border border-purple-500/30 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-md">
            <Monitor className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">{t('smartGameBoost', 'hudFloatingTitle')}</span>
              {isPro ? (
                <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {t('smartGameBoost', 'proSentinel')}
                </span>
              ) : (
                <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-0.5">
                  <Crown className="h-2.5 w-2.5" /> PRO
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {t('smartGameBoost', 'hudFloatingSubtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* 4-Position Selector */}
          <div className="flex items-center bg-slate-900/80 border border-slate-700/60 rounded-lg p-0.5 text-[10px]">
            <button
              onClick={() => handleUpdateOverlayConfig('top-left')}
              title="Superior Izquierda"
              className={`px-1.5 py-1 rounded ${
                overlayPosition === 'top-left' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ↖ {t('smartGameBoost', 'topLeft')}
            </button>
            <button
              onClick={() => handleUpdateOverlayConfig('top-right')}
              title="Superior Derecha"
              className={`px-1.5 py-1 rounded ${
                overlayPosition === 'top-right' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ↗ {t('smartGameBoost', 'topRight')}
            </button>
            <button
              onClick={() => handleUpdateOverlayConfig('bottom-left')}
              title="Inferior Izquierda"
              className={`px-1.5 py-1 rounded ${
                overlayPosition === 'bottom-left' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ↙ {t('smartGameBoost', 'bottomLeft', 'Inf-Izq')}
            </button>
            <button
              onClick={() => handleUpdateOverlayConfig('bottom-right')}
              title="Inferior Derecha"
              className={`px-1.5 py-1 rounded ${
                overlayPosition === 'bottom-right' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ↘ {t('smartGameBoost', 'bottomRight', 'Inf-Der')}
            </button>
          </div>

          {/* Theme Selector */}
          <div className="flex items-center bg-slate-900/80 border border-slate-700/60 rounded-lg p-0.5 text-[10px]">
            <button
              onClick={() => handleUpdateOverlayConfig(null, 'cyberpunk')}
              className={`px-2 py-1 rounded flex items-center gap-1 ${
                overlayTheme === 'cyberpunk' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Cyber</span>
            </button>
            <button
              onClick={() => handleUpdateOverlayConfig(null, 'cyan')}
              className={`px-2 py-1 rounded flex items-center gap-1 ${
                overlayTheme === 'cyan' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              <span>Cyan</span>
            </button>
            <button
              onClick={() => handleUpdateOverlayConfig(null, 'violet')}
              className={`px-2 py-1 rounded flex items-center gap-1 ${
                overlayTheme === 'violet' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
              <span>Violet</span>
            </button>
          </div>

          {/* Compact / Full Layout Mode */}
          <div className="flex items-center bg-slate-900/80 border border-slate-700/60 rounded-lg p-0.5 text-[10px]">
            <button
              onClick={() => handleUpdateOverlayConfig(null, null, 'full')}
              className={`px-2 py-1 rounded flex items-center gap-1 ${
                overlayLayout === 'full' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Maximize2 className="h-2.5 w-2.5" />
              <span>Full</span>
            </button>
            <button
              onClick={() => handleUpdateOverlayConfig(null, null, 'compact')}
              className={`px-2 py-1 rounded flex items-center gap-1 ${
                overlayLayout === 'compact' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Minimize2 className="h-2.5 w-2.5" />
              <span>Mini</span>
            </button>
          </div>

          {/* Custom Screen Position & Hotkeys Button */}
          {isPro && (
            <button
              onClick={() => setIsOverlaySettingsOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Personalizar posición en pantalla interactiva y atajos de teclado"
            >
              <Sliders className="h-3.5 w-3.5 text-indigo-400" />
              <span>Personalizar (F10/F11)</span>
            </button>
          )}

          {/* Toggle Switch */}
          {isPro ? (
            <button
              onClick={() => handleToggleOverlay(!overlayActive)}
              disabled={overlayLoading}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                overlayActive
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>{overlayActive ? t('smartGameBoost', 'hudActive') : t('smartGameBoost', 'hudActivate')}</span>
            </button>
          ) : (
            <button
              onClick={onOpenProModal}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
            >
              <Crown className="h-3.5 w-3.5" />
              <span>{t('smartGameBoost', 'unlockHudWithPro')}</span>
            </button>
          )}
        </div>
      </div>


      {/* Custom Game Management Panel (Collapsible) */}
      {showConfig && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3 relative z-10 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200">
              {t('smartGameBoost', 'customGamesTitle')}
            </h3>
            <span className="text-[11px] text-slate-400">
              {t('smartGameBoost', 'customGamesHelp')}
            </span>
          </div>

          {/* Input to add custom game */}
          <form onSubmit={handleAddGame} className="flex gap-2">
            <input
              type="text"
              value={newGameInput}
              onChange={(e) => setNewGameInput(e.target.value)}
              placeholder={t('smartGameBoost', 'addPlaceholder')}
              className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-700 text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !newGameInput.trim()}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1 shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t('smartGameBoost', 'addBtn')}</span>
            </button>
          </form>

          {/* List of custom games */}
          {customGames.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {customGames.map((game) => (
                <span
                  key={game}
                  className="px-2.5 py-1 rounded-md bg-slate-800/90 border border-slate-700 text-xs font-mono text-cyan-300 flex items-center gap-1.5"
                >
                  <span>{game}</span>
                  <button
                    onClick={() => onRemoveCustomGame(game)}
                    className="text-slate-400 hover:text-rose-400 transition-colors"
                    title={`Eliminar ${game}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 italic">
              {t('smartGameBoost', 'noCustomGames')}
            </p>
          )}

          {/* Ignored Processes Section */}
          <div className="pt-3 border-t border-slate-800/60">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <EyeOff className="h-3.5 w-3.5 text-rose-400" />
                <span>{t('smartGameBoost', 'ignoredTitle')}</span>
              </h4>
              <span className="text-[10px] text-slate-500">
                {t('smartGameBoost', 'ignoredSubtitle')}
              </span>
            </div>
            {ignoredProcesses.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {ignoredProcesses.map((proc) => (
                  <span
                    key={proc}
                    className="px-2.5 py-0.5 rounded-md bg-rose-950/40 border border-rose-800/40 text-xs font-mono text-rose-300 flex items-center gap-1.5"
                  >
                    <span>{proc}</span>
                    <button
                      onClick={() => onUnignoreProcess && onUnignoreProcess(proc)}
                      className="text-rose-400/70 hover:text-rose-300 transition-colors"
                      title="Remover de ignorados"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic">
                {t('smartGameBoost', 'noIgnored')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Benchmark History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-indigo-500/40 rounded-2xl p-5 shadow-2xl text-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  {t('benchmark', 'historyTitle', 'Historial de Benchmarks')}
                </h3>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
              {benchmarkHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-400" />
                  <p className="text-xs">No hay benchmarks registrados aún.</p>
                  <p className="text-[11px] text-slate-600 mt-1">Presiona F11 o el botón Grabar mientras juegas.</p>
                </div>
              ) : (
                benchmarkHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/40 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-cyan-300 font-mono">
                          {item.game_name}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {item.created_at}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] font-mono">
                        <span className="text-emerald-400 font-bold">
                          Avg: {item.avg_fps} fps
                        </span>
                        <span className="text-cyan-400">
                          1% Low: {item.one_percent_low_fps} fps
                        </span>
                        <span className="text-slate-400">
                          Stutter: {item.stutter_rate_pct}%
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setLatestReport(item);
                        setIsReportModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1"
                    >
                      <span>Ver</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Benchmark Report Modal */}
      <BenchmarkReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        report={latestReport}
      />

      {/* Interactive Overlay & Hotkeys Customizer Modal */}
      <OverlaySettingsModal
        isOpen={isOverlaySettingsOpen}
        onClose={() => setIsOverlaySettingsOpen(false)}
        currentConfig={gamingTelemetry}
        onSave={handleSaveOverlaySettings}
      />

    </div>
  );
}
