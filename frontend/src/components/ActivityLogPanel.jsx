import React, { useState } from 'react';
import { Terminal, Shield, ShieldAlert, Cpu, Zap, Info, ChevronDown, ChevronUp, Trash2, CheckCircle2, ArrowRight } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function ActivityLogPanel({ logs, onClearLogs, latestTrimSummary }) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState('all'); // all, ram, terminate, blocked
  const [expandedLogIdx, setExpandedLogIdx] = useState(null);
  const [showExplanation, setShowExplanation] = useState(true);

  const filteredLogs = (logs || []).filter((log) => {
    if (filter === 'all') return true;
    if (filter === 'ram') return log.type === 'ram_sweep' || log.type === 'process_trimmed' || log.action_type === 'trim_memory';
    if (filter === 'terminate') return log.action_type === 'terminate';
    if (filter === 'blocked') return log.action_type === 'blocked';
    return true;
  });

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-md">
            <Terminal className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">{t('logs', 'title')}</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {logs?.length || 0} {t('logs', 'eventsCount', 'eventos')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('logs', 'subtitle')}
            </p>
          </div>
        </div>

        {/* Filter Tabs & Clear */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md transition ${filter === 'all' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {t('logs', 'tabAll')}
            </button>
            <button
              onClick={() => setFilter('ram')}
              className={`px-2.5 py-1 rounded-md transition ${filter === 'ram' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {t('logs', 'tabRam')}
            </button>
            <button
              onClick={() => setFilter('terminate')}
              className={`px-2.5 py-1 rounded-md transition ${filter === 'terminate' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {t('logs', 'tabTerminate')}
            </button>
            <button
              onClick={() => setFilter('blocked')}
              className={`px-2.5 py-1 rounded-md transition ${filter === 'blocked' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {t('logs', 'tabBlocked')}
            </button>
          </div>

          {logs && logs.length > 0 && (
            <button
              onClick={onClearLogs}
              title={t('logs', 'clearBtn')}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Educational Banner: How Win32 EmptyWorkingSet frees RAM */}
      <div className="my-4 rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 via-indigo-950/20 to-slate-900/40 p-4">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowExplanation(!showExplanation)}
        >
          <div className="flex items-center gap-2.5 text-cyan-300 font-bold text-sm">
            <Info className="h-4 w-4 text-cyan-400 flex-shrink-0" />
            <span>{t('logs', 'faqTitle')}</span>
          </div>
          <button className="text-slate-400 hover:text-white">
            {showExplanation ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>


        {showExplanation && (
          <div className="mt-3 text-xs text-slate-300 space-y-2.5 border-t border-cyan-500/20 pt-3 leading-relaxed">
            <p>
              <strong className="text-white">1. El problema de la memoria residual (Working Set bloat):</strong> Aplicaciones como navegadores (Brave, Chrome), programas de Electron (Discord, Spotify, IDEs) y juegos van reservando memoria física (RAM) durante su uso. Cuando dejas de interactuar con ciertas pestañas o ventanas, esas páginas de memoria quedan marcadas como "ocupadas" aunque el programa no las necesite en ese instante.
            </p>
            <p>
              <strong className="text-white">2. La API nativa Win32 EmptyWorkingSet:</strong> Al pulsar <em>"Optimizar Memoria RAM"</em>, Optima abre el handle de cada proceso de usuario con privilegios <code className="text-cyan-400 font-mono">PROCESS_SET_QUOTA</code> e invoca <code className="text-cyan-400 font-mono">psapi.dll::EmptyWorkingSet()</code>. Esta función del kernel de Windows <strong>desaloja las páginas no referenciadas</strong> del working set del proceso y las transfiere a la <em>Standby List</em> (memoria en espera / libre).
            </p>
            <p>
              <strong className="text-white">3. El resultado:</strong> Las aplicaciones <strong>NO se cierran, NO pierden tu trabajo ni pestañas</strong>, pero el sistema recupera al instante gigabytes de memoria física lista para ser asignada a tareas de alto rendimiento.
            </p>
          </div>
        )}
      </div>

      {/* Latest Sweep Breakdown Card if available */}
      {latestTrimSummary && latestTrimSummary.top_reclaimed && latestTrimSummary.top_reclaimed.length > 0 && (
        <div className="mb-4 p-4 rounded-xl bg-slate-900/90 border border-indigo-500/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-bold text-white">Desglose del Último Vaciado de RAM</span>
            </div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Total: +{latestTrimSummary.total_freed_ram_mb} MB recuperados
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {latestTrimSummary.top_reclaimed.slice(0, 8).map((p) => (
              <div key={p.pid} className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-200 truncate">{p.process_name}</span>
                  <span className="text-emerald-400 font-bold font-mono">+{p.freed_mb} MB</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1 font-mono">
                  <span>{p.before_mb} MB</span>
                  <ArrowRight className="h-3 w-3 text-slate-500" />
                  <span className="text-cyan-300 font-semibold">{p.after_mb} MB</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Stream Log */}
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Aún no se han ejecutado optimizaciones en esta sesión. Inicia un examen o pulsa "Optimizar Memoria RAM" para registrar actividad.
          </div>
        ) : (
          filteredLogs.map((log, idx) => {
            const isExpanded = expandedLogIdx === idx;
            const isSweep = log.type === 'ram_sweep';
            const isBlocked = log.action_type === 'blocked';
            const isTerminated = log.action_type === 'terminate';
            const isTrimmed = log.type === 'process_trimmed' || log.action_type === 'trim_memory';

            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-xs transition-all ${
                  isBlocked
                    ? 'bg-amber-950/20 border-amber-500/30'
                    : isTerminated
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : isSweep
                    ? 'bg-indigo-950/30 border-indigo-500/40'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Event Summary Bar */}
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedLogIdx(isExpanded ? null : idx)}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-[11px] text-slate-500">{log.timestamp}</span>

                    {/* Badge */}
                    {isSweep ? (
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        Vaciado Global
                      </span>
                    ) : isBlocked ? (
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Shield className="h-3 w-3" /> Bloqueado
                      </span>
                    ) : isTerminated ? (
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Proceso Cerrado
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Memoria Recortada
                      </span>
                    )}

                    <span className="font-mono font-bold text-white truncate">
                      {isSweep ? log.action_title : `${log.process_name} (PID: ${log.pid})`}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {log.freed_ram_mb > 0 && (
                      <span className="font-mono font-bold text-emerald-400">
                        +{log.freed_ram_mb} MB
                      </span>
                    )}
                    {log.freed_mb > 0 && (
                      <span className="font-mono font-bold text-emerald-400">
                        +{log.freed_mb} MB
                      </span>
                    )}
                    <button className="text-slate-400 hover:text-white">
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-300 leading-relaxed">
                    {log.summary && (
                      <p><strong className="text-white">Resumen:</strong> {log.summary}</p>
                    )}
                    {log.decision_reason && (
                      <p>
                        <strong className="text-white">Criterio de Decisión:</strong> {log.decision_reason}
                      </p>
                    )}
                    {log.technical_mechanism && (
                      <p>
                        <strong className="text-cyan-300">Mecanismo Técnico:</strong> {log.technical_mechanism}
                      </p>
                    )}
                    {log.before_ram_mb !== undefined && log.after_ram_mb !== undefined && (
                      <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                        <span>Memoria antes: {log.before_ram_mb} MB</span>
                        <ArrowRight className="h-3 w-3 text-slate-600" />
                        <span className="text-white font-semibold">Memoria después: {log.after_ram_mb} MB</span>
                      </div>
                    )}
                    {log.message && (
                      <p className="text-slate-400 italic font-mono">{log.message}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
