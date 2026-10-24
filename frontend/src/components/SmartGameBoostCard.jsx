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
    <div className="glass-panel p-5 relative overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-3.5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-[#141417] border border-[#2d2d34] flex items-center justify-center shadow-sm">
            <Gamepad2 className="h-5 w-5 text-[#10d05c]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#f3f4f6] tracking-tight">{t('smartGameBoost', 'title')}</h2>
              {isPro ? (
                <span className="badge-mono px-2 py-0.5 text-[10px] font-bold uppercase flex items-center gap-1 border-[#3b3b45] text-[#d1d5db]">
                  <Crown className="h-3 w-3 text-[#d1d5db]" /> {t('smartGameBoost', 'proSentinel')}
                </span>
              ) : (
                <button
                  onClick={onOpenProModal}
                  className="btn-xbox-primary px-2.5 py-0.5 text-[10px] font-bold uppercase flex items-center gap-1"
                >
                  <Crown className="h-3 w-3 text-white" /> {t('smartGameBoost', 'unlockPro')}
                </button>
              )}
            </div>
            <p className="text-xs text-[#9ca3af]">
              {t('smartGameBoost', 'subtitle')}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="btn-dark-subtle text-xs px-2.5 py-1.5 flex items-center gap-1.5"
          >
            <span>{showConfig ? '▲' : '⚙️'} {t('smartGameBoost', 'customGamesTitle').split(' ')[0]}</span>
            <span className="px-1.5 py-0.2 rounded bg-[#151518] border border-[#2d2d34] text-[10px] text-[#9ca3af]">
              {customGames.length}
            </span>
          </button>

          {/* Toggle Switch */}
          <button
            onClick={() => onToggleDetector(!isEnabled)}
            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${
              isEnabled ? 'bg-[#107C41]' : 'bg-[#26262b]'
            }`}
            title={isEnabled ? 'Pausar' : 'Activar'}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                isEnabled ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main Status Display Area */}
      {activeGame ? (
        /* GAME RUNNING STATE */
        <div className="relative z-10 p-3.5 rounded-lg bg-[#141d17] border border-[#107C41]/50 shadow-sm mb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10d05c] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10d05c]"></span>
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#10d05c]">{t('smartGameBoost', 'activeGameTitle')}</span>
                  <span className="text-sm font-bold text-[#f3f4f6]">{activeGame.name}</span>
                  <span className="badge-mono px-2 py-0.5 text-[10px] font-mono">
                    {activeGame.platform}
                  </span>
                  <span className="text-xs text-[#9ca3af] font-mono">(PID: {activeGame.pid})</span>
                </div>
                <p className="text-xs text-[#9ca3af] mt-0.5 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-[#10d05c]" />
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
                className="btn-dark-subtle px-2.5 py-1 text-xs text-[#ef4444] border-[#ef4444]/30 hover:border-[#ef4444] flex items-center gap-1"
              >
                <EyeOff className="h-3.5 w-3.5" />
                <span>{t('smartGameBoost', 'notAGameBtn')}</span>
              </button>
              <span className="badge-mono px-2.5 py-1 text-xs text-[#10d05c] border-[#107C41]/40 flex items-center gap-1">
                <Activity className="h-3.5 w-3.5" />
                <span>{t('smartGameBoost', 'gameModeActive')}</span>
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* STANDBY SCANNING STATE */
        <div className="relative z-10 p-2.5 rounded-lg bg-[#141417] border border-[#26262b] flex items-center justify-between flex-wrap gap-2 text-xs mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              {isEnabled && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10d05c] opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isEnabled ? 'bg-[#10d05c]' : 'bg-[#6b7280]'}`}></span>
            </span>
            <span className="text-[#9ca3af]">
              {isEnabled
                ? t('smartGameBoost', 'standbySentinel')
                : t('smartGameBoost', 'pausedSentinel')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="badge-mono px-2 py-0.5 text-[#9ca3af]">Steam</span>
            <span className="badge-mono px-2 py-0.5 text-[#9ca3af]">Epic</span>
            <span className="badge-mono px-2 py-0.5 text-[#9ca3af]">Riot</span>
            <span className="badge-mono px-2 py-0.5 text-[#9ca3af]">Battle.net</span>
            <span className="badge-mono px-2 py-0.5 text-[#9ca3af]">Xbox</span>
          </div>
        </div>
      )}

      {/* LIVE GAMING HARDWARE TELEMETRY PANEL */}
      <div className="relative z-10 mb-3 bg-[#141417] border border-[#26262b] rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-[#10d05c]" />
            <span className="text-xs font-bold text-[#f3f4f6]">{t('smartGameBoost', 'liveTelemetry')}</span>
            <span className="text-[10px] text-[#9ca3af]">({gpuName})</span>
          </div>
          <span className="text-[11px] font-mono text-[#10d05c] flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10d05c] animate-pulse" /> Direct3D / PDH
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Tile 1: Authentic FPS */}
          <div className="bg-[#18181c] border border-[#26262b] rounded-md p-2.5 flex flex-col justify-between hover:border-[#33333d] transition-colors">
            <div className="flex items-center justify-between text-[#9ca3af] text-[11px]">
              <span className="font-semibold flex items-center gap-1">
                <Gauge className="h-3 w-3 text-[#10d05c]" /> {t('smartGameBoost', 'fps')}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-[#10d05c] font-bold">DXGI</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-[#10d05c] font-mono">
                {activeGame ? fpsCount : 60}
              </span>
              <span className="text-[10px] text-[#9ca3af] font-mono">fps</span>
            </div>
          </div>

          {/* Tile 2: 1% Low FPS */}
          <div className="bg-[#18181c] border border-[#26262b] rounded-md p-2.5 flex flex-col justify-between hover:border-[#33333d] transition-colors">
            <div className="flex items-center justify-between text-[#9ca3af] text-[11px]">
              <span className="font-semibold flex items-center gap-1">
                <Activity className="h-3 w-3 text-[#9ca3af]" /> {t('benchmark', 'onePercentLow', '1% Low FPS')}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-[#9ca3af] font-bold">P99</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-[#f3f4f6] font-mono">
                {activeGame ? (gamingTelemetry?.one_percent_low || 60) : 60}
              </span>
              <span className="text-[10px] text-[#9ca3af] font-mono">fps</span>
            </div>
          </div>

          {/* Tile 3: GPU 3D Load & VRAM */}
          <div className="bg-[#18181c] border border-[#26262b] rounded-md p-2.5 flex flex-col justify-between hover:border-[#33333d] transition-colors">
            <div className="flex items-center justify-between text-[#9ca3af] text-[11px]">
              <span className="font-semibold flex items-center gap-1">
                <Flame className="h-3 w-3 text-[#10d05c]" /> {t('smartGameBoost', 'gpuLoad')}
              </span>
              <span className="text-[9px] font-mono text-[#d1d5db] font-bold">{vramUsedGb}G / {vramTotalGb}G</span>
            </div>
            <div className="mt-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#9ca3af] mb-1">
                <span>GPU {gpuLoad}%</span>
                <span>VRAM {vramPercent}%</span>
              </div>
              <div className="w-full bg-[#121214] border border-[#26262b] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#107C41] h-full rounded-full transition-all duration-500"
                  style={{ width: `${gpuLoad}%` }}
                />
              </div>
            </div>
          </div>

          {/* Tile 4: Benchmark Controller CTA */}
          <div className="bg-[#18181c] border border-[#26262b] rounded-md p-2.5 flex flex-col justify-between hover:border-[#33333d] transition-colors">
            <div className="flex items-center justify-between text-[#9ca3af] text-[11px]">
              <span className="font-semibold text-[#f3f4f6] flex items-center gap-1">
                <Zap className="h-3 w-3 text-[#10d05c]" /> Benchmark Pro
              </span>
              <button
                onClick={handleFetchHistory}
                className="text-[10px] text-[#9ca3af] hover:text-[#f3f4f6] flex items-center gap-0.5 cursor-pointer"
              >
                <History className="h-2.5 w-2.5" /> {t('smartGameBoost', 'benchHistoryBtn', 'Historial')}
              </button>
            </div>

            <button
              onClick={handleToggleBenchmark}
              className={`mt-1.5 w-full py-1.5 px-2.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isBenchmarking
                  ? 'bg-[#ef4444] hover:bg-red-600 text-white animate-pulse shadow-md shadow-red-900/30'
                  : 'btn-xbox-primary'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${isBenchmarking ? 'bg-white' : 'bg-[#10d05c]'}`} />
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
      <div className="relative z-10 p-3 rounded-lg bg-[#141417] border border-[#26262b] flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md bg-[#18181c] border border-[#2d2d34] flex items-center justify-center text-[#10d05c] shadow-sm">
            <Monitor className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#f3f4f6]">{t('smartGameBoost', 'hudFloatingTitle')}</span>
              {isPro ? (
                <span className="badge-mono px-1.5 py-0.2 text-[9px] font-bold uppercase text-[#10d05c] border-[#107C41]/40">
                  {t('smartGameBoost', 'proSentinel')}
                </span>
              ) : (
                <span className="badge-mono px-1.5 py-0.2 text-[9px] font-bold uppercase flex items-center gap-0.5">
                  <Crown className="h-2.5 w-2.5 text-[#d1d5db]" /> PRO
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#9ca3af]">
              {t('smartGameBoost', 'hudFloatingSubtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* 4-Position Selector */}
          <div className="flex items-center bg-[#18181c] border border-[#26262b] rounded-md p-0.5 text-[10px]">
            <button
              onClick={() => handleUpdateOverlayConfig('top-left')}
              title="Superior Izquierda"
              className={`px-1.5 py-1 rounded ${
                overlayPosition === 'top-left' ? 'bg-[#107C41] text-white font-bold' : 'text-[#9ca3af] hover:text-[#f3f4f6]'
              }`}
            >
              ↖ {t('smartGameBoost', 'topLeft')}
            </button>
            <button
              onClick={() => handleUpdateOverlayConfig('top-right')}
              title="Superior Derecha"
              className={`px-1.5 py-1 rounded ${
                overlayPosition === 'top-right' ? 'bg-[#107C41] text-white font-bold' : 'text-[#9ca3af] hover:text-[#f3f4f6]'
              }`}
            >
              ↗ {t('smartGameBoost', 'topRight')}
            </button>
            <button
              onClick={() => handleUpdateOverlayConfig('bottom-left')}
              title="Inferior Izquierda"
              className={`px-1.5 py-1 rounded ${
                overlayPosition === 'bottom-left' ? 'bg-[#107C41] text-white font-bold' : 'text-[#9ca3af] hover:text-[#f3f4f6]'
              }`}
            >
              ↙ {t('smartGameBoost', 'bottomLeft', 'Inf-Izq')}
            </button>
            <button
              onClick={() => handleUpdateOverlayConfig('bottom-right')}
              title="Inferior Derecha"
              className={`px-1.5 py-1 rounded ${
                overlayPosition === 'bottom-right' ? 'bg-[#107C41] text-white font-bold' : 'text-[#9ca3af] hover:text-[#f3f4f6]'
              }`}
            >
              ↘ {t('smartGameBoost', 'bottomRight', 'Inf-Der')}
            </button>
          </div>

          {/* Theme Selector */}
          <div className="flex items-center bg-[#18181c] border border-[#26262b] rounded-md p-0.5 text-[10px]">
            <button
              onClick={() => handleUpdateOverlayConfig(null, 'cyberpunk')}
              className={`px-2 py-1 rounded flex items-center gap-1 ${
                overlayTheme === 'cyberpunk' ? 'bg-[#202026] text-[#10d05c] font-bold border border-[#2d2d34]' : 'text-[#9ca3af] hover:text-[#f3f4f6]'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#10d05c]" />
              <span>Cyber</span>
            </button>
            <button
              onClick={() => handleUpdateOverlayConfig(null, 'cyan')}
              className={`px-2 py-1 rounded flex items-center gap-1 ${
                overlayTheme === 'cyan' ? 'bg-[#202026] text-cyan-400 font-bold border border-[#2d2d34]' : 'text-[#9ca3af] hover:text-[#f3f4f6]'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              <span>Cyan</span>
            </button>
            <button
              onClick={() => handleUpdateOverlayConfig(null, 'violet')}
              className={`px-2 py-1 rounded flex items-center gap-1 ${
                overlayTheme === 'violet' ? 'bg-[#202026] text-purple-400 font-bold border border-[#2d2d34]' : 'text-[#9ca3af] hover:text-[#f3f4f6]'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
              <span>Violet</span>
            </button>
          </div>

          {/* Compact / Full Layout Mode */}
          <div className="flex items-center bg-[#18181c] border border-[#26262b] rounded-md p-0.5 text-[10px]">
            <button
              onClick={() => handleUpdateOverlayConfig(null, null, 'full')}
              className={`px-2 py-1 rounded flex items-center gap-1 ${
                overlayLayout === 'full' ? 'bg-[#202026] text-[#f3f4f6] font-bold border border-[#2d2d34]' : 'text-[#9ca3af] hover:text-[#f3f4f6]'
              }`}
            >
              <Maximize2 className="h-2.5 w-2.5" />
              <span>Full</span>
            </button>
            <button
              onClick={() => handleUpdateOverlayConfig(null, null, 'compact')}
              className={`px-2 py-1 rounded flex items-center gap-1 ${
                overlayLayout === 'compact' ? 'bg-[#202026] text-[#f3f4f6] font-bold border border-[#2d2d34]' : 'text-[#9ca3af] hover:text-[#f3f4f6]'
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
              className="btn-dark-subtle px-2.5 py-1.5 text-xs flex items-center gap-1.5"
              title="Personalizar posición en pantalla interactiva y atajos de teclado"
            >
              <Sliders className="h-3.5 w-3.5 text-[#10d05c]" />
              <span>Personalizar (F10/F11)</span>
            </button>
          )}

          {/* Toggle Switch */}
          {isPro ? (
            <button
              onClick={() => handleToggleOverlay(!overlayActive)}
              disabled={overlayLoading}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                overlayActive
                  ? 'btn-xbox-primary shadow-sm'
                  : 'btn-dark-subtle text-[#9ca3af]'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>{overlayActive ? t('smartGameBoost', 'hudActive') : t('smartGameBoost', 'hudActivate')}</span>
            </button>
          ) : (
            <button
              onClick={onOpenProModal}
              className="btn-xbox-primary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
            >
              <Crown className="h-3.5 w-3.5 text-white" />
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
