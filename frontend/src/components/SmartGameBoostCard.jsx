import React, { useState } from 'react';
import { Gamepad2, Sparkles, CheckCircle2, Shield, Plus, Trash2, Crown, Zap, Activity } from 'lucide-react';

export default function SmartGameBoostCard({
  detectorStatus,
  onToggleDetector,
  onAddCustomGame,
  onRemoveCustomGame,
  onOpenProModal
}) {
  const [showConfig, setShowConfig] = useState(false);
  const [newGameInput, setNewGameInput] = useState('');
  const [loading, setLoading] = useState(false);

  const isPro = detectorStatus?.is_pro;
  const isEnabled = detectorStatus?.enabled;
  const activeGame = detectorStatus?.active_game;
  const customGames = detectorStatus?.custom_games || [];

  const handleAddGame = async (e) => {
    e.preventDefault();
    if (!newGameInput.trim()) return;
    setLoading(true);
    await onAddCustomGame(newGameInput.trim());
    setNewGameInput('');
    setLoading(false);
  };

  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-slate-900/90 via-[#0e1424]/90 to-slate-900/90 border border-indigo-500/30 p-5 shadow-xl shadow-indigo-500/5 overflow-hidden">
      
      {/* Decorative backdrop glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

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
              Detección automática en Steam, Epic, Riot y elevación de prioridad en tiempo real
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
        <div className="relative z-10 p-4 rounded-xl bg-gradient-to-r from-emerald-500/15 via-indigo-500/10 to-emerald-500/15 border border-emerald-500/40 shadow-inner">
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
                    ? 'Prioridad de CPU ALTA activa • Aplicaciones secundarias relegadas a IDLE'
                    : 'Juego detectado pasivamente. Activa la versión Pro para aplicar Auto-Boost automático.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Activity className="h-3.5 w-3.5" />
                <span>Modo Juego Activo</span>
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* STANDBY SCANNING STATE */
        <div className="relative z-10 p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between flex-wrap gap-2 text-xs">
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

      {/* Custom Game Management Panel (Collapsible) */}
      {showConfig && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3 relative z-10 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200">
              Juegos Personalizados Monitoreados (Añadir .exe)
            </h3>
            <span className="text-[11px] text-slate-400">
              Los juegos de Steam y Epic se detectan automáticamente. Usa esto para juegos portables o emuladores.
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
        </div>
      )}

    </div>
  );
}
