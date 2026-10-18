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
  EyeOff
} from 'lucide-react';

export default function SmartGameBoostCard({
  detectorStatus,
  onToggleDetector,
  onAddCustomGame,
  onRemoveCustomGame,
  onIgnoreProcess,
  onUnignoreProcess,
  onOpenProModal
}) {
  const [showConfig, setShowConfig] = useState(false);
  const [newGameInput, setNewGameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [gamingTelemetry, setGamingTelemetry] = useState(null);
  const [overlayActive, setOverlayActive] = useState(false);
  const [overlayPosition, setOverlayPosition] = useState('top-right');
  const [overlayLoading, setOverlayLoading] = useState(false);

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
          if (data.overlay_position) {
            setOverlayPosition(data.overlay_position);
          }
        }
      } catch (e) {
        // silent
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 1500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

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

  const handlePositionChange = async (newPos) => {
    setOverlayPosition(newPos);
    if (overlayActive && isPro) {
      try {
        await fetch('/api/gaming/overlay/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: true, position: newPos })
        });
      } catch (e) {
        // silent
      }
    }
  };

  const vramUsedGb = gamingTelemetry?.vram_used_gb || 0;
  const vramTotalGb = gamingTelemetry?.vram_total_gb || 8;
  const vramPercent = Math.min(Math.round((vramUsedGb / (vramTotalGb || 1)) * 100), 100);
  const gpuLoad = gamingTelemetry?.gpu_usage_pct || 0;
  const fpsCount = gamingTelemetry?.fps || 60;
  const gpuName = gamingTelemetry?.gpu_name || 'GPU del Sistema';

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
              <h2 className="text-base font-bold text-white tracking-tight">Smart Game Detection & Auto-Boost</h2>
              {isPro ? (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <Crown className="h-3 w-3 text-yellow-400" /> Centinela PRO
                </span>
              ) : (
                <button
                  onClick={onOpenProModal}
                  className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 flex items-center gap-1 transition-all"
                >
                  <Crown className="h-3 w-3" /> Desbloquear con Pro
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Detección automática en Steam, Epic, Riot, telemetría de hardware en tiempo real y acelerador de FPS
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors flex items-center gap-1"
          >
            <span>{showConfig ? 'Ocultar Juegos' : '⚙️ Gestionar Juegos'}</span>
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
            title={isEnabled ? 'Pausar Centinela' : 'Activar Centinela'}
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
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Juego Activo:</span>
                  <span className="text-sm font-extrabold text-white">{activeGame.name}</span>
                  <span className="px-2 py-0.5 text-[10px] rounded bg-slate-800/80 text-cyan-300 border border-cyan-500/30">
                    {activeGame.platform}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">(PID: {activeGame.pid})</span>
                </div>
                <p className="text-xs text-emerald-300/90 mt-0.5 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-yellow-400" />
                  {isPro
                    ? 'Prioridad de CPU ALTA activa • Aplicaciones secundarias en IDLE • Overlay In-Game listo'
                    : 'Juego detectado pasivamente. Activa la versión Pro para aplicar Auto-Boost automático y HUD en pantalla.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onIgnoreProcess && onIgnoreProcess(activeGame.name)}
                title="Si este proceso no es un juego, haz clic para ignorarlo y permitir que el centinela busque tu juego real"
                className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 transition-all shadow-sm"
              >
                <EyeOff className="h-3.5 w-3.5" />
                <span>No es un juego (Ignorar)</span>
              </button>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Activity className="h-3.5 w-3.5" />
                <span>Modo Juego Activo</span>
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
                ? 'Centinela en espera: monitoreando Steam, Epic Games, Riot, Battle.net y juegos locales...'
                : 'Centinela pausado por el usuario.'}
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

      {/* LIVE GAMING HARDWARE TELEMETRY PANEL (Community + Pro) */}
      <div className="relative z-10 mb-4 bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200">Telemetría Gamer en Vivo</span>
            <span className="text-[10px] text-slate-400">({gpuName})</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Direct3D / PDH
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Tile 1: FPS */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="font-semibold flex items-center gap-1">
                <Gauge className="h-3 w-3 text-emerald-400" /> Cuadros / Seg.
              </span>
              <span className="text-[9px] uppercase tracking-wider text-emerald-400/80 font-bold">FPS</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-emerald-400 font-mono">
                {activeGame ? fpsCount : 60}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">fps</span>
            </div>
          </div>

          {/* Tile 2: GPU 3D Load */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="font-semibold flex items-center gap-1">
                <Flame className="h-3 w-3 text-cyan-400" /> Carga GPU
              </span>
              <span className="text-[9px] font-mono text-cyan-400 font-bold">{gpuLoad}%</span>
            </div>
            <div className="mt-1.5">
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${gpuLoad}%` }}
                />
              </div>
            </div>
          </div>

          {/* Tile 3: VRAM */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="font-semibold flex items-center gap-1">
                <Layers className="h-3 w-3 text-purple-400" /> Memoria VRAM
              </span>
              <span className="text-[9px] font-mono text-purple-400 font-bold">{vramPercent}%</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1 text-[11px] font-mono text-slate-200">
              <span className="font-bold text-purple-300">{vramUsedGb} GB</span>
              <span className="text-slate-500">/ {vramTotalGb} GB</span>
            </div>
          </div>

          {/* Tile 4: Game CPU / RAM */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="font-semibold flex items-center gap-1">
                <Cpu className="h-3 w-3 text-rose-400" /> RAM Juego
              </span>
              <span className="text-[9px] font-mono text-rose-400 font-bold">
                {activeGame ? `${gamingTelemetry?.game_cpu_pct || 0}% CPU` : 'Inactivo'}
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1 text-[11px] font-mono text-slate-200">
              <span className="font-bold text-rose-300">
                {activeGame ? `${gamingTelemetry?.game_ram_mb || 0} MB` : '0 MB'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* PRO EXCLUSIVE: IN-GAME OVERLAY CONTROL BAR */}
      <div className="relative z-10 p-3.5 rounded-xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-purple-950/40 border border-purple-500/30 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
            <Monitor className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">HUD Flotante In-Game (Click-Through)</span>
              {isPro ? (
                <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  PRO ACTIVO
                </span>
              ) : (
                <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-0.5">
                  <Crown className="h-2.5 w-2.5" /> EXCLUSIVO PRO
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Muestra FPS, GPU, VRAM y CPU sobre el juego sin pausar ni interferir con tus disparos o puntero.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Position Selector */}
          <div className="flex items-center bg-slate-900/80 border border-slate-700/60 rounded-lg p-0.5 text-[11px]">
            <button
              onClick={() => handlePositionChange('top-left')}
              className={`px-2 py-0.5 rounded ${
                overlayPosition === 'top-left' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Arriba Izq
            </button>
            <button
              onClick={() => handlePositionChange('top-right')}
              className={`px-2 py-0.5 rounded ${
                overlayPosition === 'top-right' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Arriba Der
            </button>
          </div>

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
              <span>{overlayActive ? 'HUD Activo en Pantalla' : 'Activar HUD Flotante'}</span>
            </button>
          ) : (
            <button
              onClick={onOpenProModal}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
            >
              <Crown className="h-3.5 w-3.5" />
              <span>Desbloquear HUD con PRO</span>
            </button>
          )}
        </div>
      </div>

      {/* Custom Game Management Panel (Collapsible) */}
      {showConfig && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3 relative z-10 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200">
              Juegos Personalizados Monitoreados (Añadir .exe)
            </h3>
            <span className="text-[11px] text-slate-400">
              Steam y Epic se detectan automáticamente. Añade ejecutables manuales aquí.
            </span>
          </div>

          {/* Input to add custom game */}
          <form onSubmit={handleAddGame} className="flex gap-2">
            <input
              type="text"
              value={newGameInput}
              onChange={(e) => setNewGameInput(e.target.value)}
              placeholder="Ejemplo: emulator.exe, gta_sa.exe, wow.exe"
              className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-700 text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !newGameInput.trim()}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1 shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Añadir</span>
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
                    title={`Dejar de monitorear ${game}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 italic">
              No tienes ejecutables manuales añadidos aún. Cualquier juego de Steam, Epic o Riot se detectará de forma nativa.
            </p>
          )}

          {/* Ignored Processes Section */}
          <div className="pt-3 border-t border-slate-800/60">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <EyeOff className="h-3.5 w-3.5 text-rose-400" />
                <span>Procesos Ignorados (Excluidos de Detección)</span>
              </h4>
              <span className="text-[10px] text-slate-500">
                Procesos en segundo plano que nunca serán considerados juegos
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
                      title={`Remover de ignorados`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic">
                No hay procesos ignorados actualmente. Si algún programa secundario es detectado erróneamente, puedes descartarlo.
              </p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
