import React from 'react';
import { Shield, ShieldAlert, Cpu, Sparkles, RefreshCw } from 'lucide-react';

export default function Header({
  systemStatus,
  models,
  activeModel,
  onSelectModel,
  onRelaunchAdmin,
  refreshing,
  onRefresh,
  ollamaStatus
}) {
  return (
    <header className="glass-panel-header px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Cpu className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                Optima<span className="text-indigo-400">AI</span>
              </h1>
              {ollamaStatus?.is_running ? (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> IA Local Activa
                </span>
              ) : (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  ⚡ Modo Heurístico
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">Analizador & Optimizador de Rendimiento de SO</p>
          </div>
        </div>

        {/* Status Indicators & Controls */}
        <div className="flex items-center gap-4">
          
          {/* Model Selector */}
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-slate-400">Modelo Ollama:</span>
            <select
              value={activeModel}
              onChange={(e) => onSelectModel(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              {models && models.length > 0 ? (
                models.map((m) => (
                  <option key={m} value={m} className="bg-slate-900 text-slate-200">
                    {m}
                  </option>
                ))
              ) : (
                <option value="llama3.2:latest">llama3.2:latest</option>
              )}
            </select>
          </div>

          {/* Privilege Badge */}
          {systemStatus?.is_elevated ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Shield className="h-3.5 w-3.5" />
              <span>Administrador (UAC)</span>
            </div>
          ) : (
            <button
              onClick={onRelaunchAdmin}
              title="Haz clic para reiniciar con privilegios elevados"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Usuario Estándar (Elevar)</span>
            </button>
          )}

          {/* Manual Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/50"
            title="Actualizar métricas en tiempo real"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

      </div>
    </header>
  );
}
