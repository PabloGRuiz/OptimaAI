import React, { useState } from 'react';
import { Sparkles, Zap, Download, Play, Info, CheckCircle2, ChevronRight, X } from 'lucide-react';

export default function OllamaStatusBanner({
  ollamaStatus,
  onLaunchOllama,
  launching
}) {
  const [showConfirmLaunch, setShowConfirmLaunch] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  if (!ollamaStatus) return null;

  const isConnected = ollamaStatus.is_running;
  const isInstalled = ollamaStatus.is_installed;

  return (
    <>
      {/* Banner Display */}
      {!isConnected ? (
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-slate-900 to-indigo-950/20 p-4 shadow-lg transition-all">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">Modo Heurístico Nativo Activo</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 uppercase">
                    Sin IA Local
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Optima está funcionando con el motor determinista local. Puedes potenciar el análisis con razonamiento contextual activando un modelo local en Ollama.
                </p>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-cyan-300">
                  <Info className="h-3.5 w-3.5 flex-shrink-0 text-cyan-400" />
                  <span>
                    <strong>¿Consume recursos Ollama en reposo?</strong> No. El icono de la llama en segundo plano consume <strong>0% CPU y 0 MB VRAM</strong> hasta que se solicita un análisis.
                  </span>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div className="flex items-center gap-2.5 flex-shrink-0 w-full sm:w-auto">
              {isInstalled ? (
                <button
                  onClick={() => setShowConfirmLaunch(true)}
                  disabled={launching}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
                >
                  <Play className={`h-3.5 w-3.5 fill-current ${launching ? 'animate-spin' : ''}`} />
                  <span>{launching ? "Iniciando Ollama..." : "Iniciar Ollama ahora"}</span>
                </button>
              ) : (
                <a
                  href={ollamaStatus.download_url || "https://ollama.com/download"}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-md transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Descargar Ollama (Gratis)</span>
                </a>
              )}
            </div>

          </div>
        </div>
      ) : (
        /* Connected Information Pill */
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/15 px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-300">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>Motor IA Conectado: <strong>{ollamaStatus.active_model}</strong> en ejecución local</span>
          </div>
          <button
            onClick={() => setShowDetails(true)}
            className="text-slate-400 hover:text-white flex items-center gap-1 transition"
          >
            <span>Ver consumo en reposo</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Confirmation Modal to Launch Ollama */}
      {showConfirmLaunch && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" /> Iniciar Servicio de IA Local
              </h4>
              <button onClick={() => setShowConfirmLaunch(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Optima detectó Ollama instalado en:
              <br />
              <code className="text-[11px] font-mono text-cyan-300 block bg-slate-950 p-2 rounded mt-1 overflow-x-auto">
                {ollamaStatus.executable_path}
              </code>
            </p>

            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 space-y-1.5 mb-4">
              <p className="font-semibold text-white flex items-center gap-1">
                <Info className="h-3.5 w-3.5 text-cyan-400" /> Tranquilidad sobre el consumo:
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                El proceso de Ollama que verás en la bandeja del sistema (ícono de llama) permanece en reposo total 
                <strong> consumiendo 0% de CPU y 0 MB de VRAM</strong>. Solo activa la memoria puntualmente cuando solicitas un examen y luego se descarga automáticamente.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfirmLaunch(false)}
                className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowConfirmLaunch(false);
                  onLaunchOllama();
                }}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition"
              >
                Sí, iniciar en segundo plano
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Info className="h-4 w-4 text-cyan-400" /> Acerca de Ollama & Consumo de Recursos
              </h4>
              <button onClick={() => setShowDetails(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                <strong className="text-white">1. El icono en la barra de tareas:</strong> Es un demonio ligero que solo escucha peticiones en <code className="text-cyan-300 font-mono">127.0.0.1:11434</code>. En reposo no realiza cálculos ni degrada los FPS de tus juegos.
              </p>
              <p>
                <strong className="text-white">2. Uso de VRAM bajo demanda:</strong> Gracias al parámetro <code className="text-cyan-300 font-mono">keep_alive</code>, el modelo solo reside en la memoria de video de tu tarjeta gráfica mientras realizas optimizaciones, garantizando diagnósticos en segundos.
              </p>
              <p>
                <strong className="text-white">3. Compatibilidad con tus amigos:</strong> Quienes no tengan Ollama pueden usar Optima en <em>Modo Heurístico</em> con exactamente la misma eficacia de optimización y vaciado de RAM.
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
