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
    <div className="glass-panel p-5 relative overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-line-subtle">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md bg-surface-raised border border-line-subtle flex items-center justify-center text-xbox-light shadow-sm">
            <Terminal className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-ink-primary">{t('logs', 'title')}</h3>
              <span className="badge-mono text-[11px]">
                {logs?.length || 0} {t('logs', 'eventsCount', 'eventos')}
              </span>
            </div>
            <p className="text-xs text-ink-secondary mt-0.5">
              {t('logs', 'subtitle')}
            </p>
          </div>
        </div>

        {/* Filter Tabs & Clear */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-surface-ground p-1 rounded-md border border-line-subtle text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-sm transition ${filter === 'all' ? 'bg-xbox-core text-white font-bold' : 'text-ink-secondary hover:text-ink-primary'}`}
            >
              {t('logs', 'tabAll')}
            </button>
            <button
              onClick={() => setFilter('ram')}
              className={`px-2.5 py-1 rounded-sm transition ${filter === 'ram' ? 'bg-xbox-core text-white font-bold' : 'text-ink-secondary hover:text-ink-primary'}`}
            >
              {t('logs', 'tabRam')}
            </button>
            <button
              onClick={() => setFilter('terminate')}
              className={`px-2.5 py-1 rounded-sm transition ${filter === 'terminate' ? 'bg-xbox-core text-white font-bold' : 'text-ink-secondary hover:text-ink-primary'}`}
            >
              {t('logs', 'tabTerminate')}
            </button>
            <button
              onClick={() => setFilter('blocked')}
              className={`px-2.5 py-1 rounded-sm transition ${filter === 'blocked' ? 'bg-xbox-core text-white font-bold' : 'text-ink-secondary hover:text-ink-primary'}`}
            >
              {t('logs', 'tabBlocked')}
            </button>
          </div>

          {logs && logs.length > 0 && (
            <button
              onClick={onClearLogs}
              title={t('logs', 'clearBtn')}
              className="p-1.5 rounded-md bg-surface-raised text-ink-secondary hover:text-[#ef4444] hover:bg-surface-hover transition border border-line-subtle"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Educational Banner: How Win32 EmptyWorkingSet frees RAM */}
      <div className="my-3.5 rounded-card border border-line-subtle bg-surface-ground/70 p-3.5">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowExplanation(!showExplanation)}
        >
          <div className="flex items-center gap-2 text-ink-primary font-bold text-xs">
            <Info className="h-4 w-4 text-xbox-light flex-shrink-0" />
            <span>{t('logs', 'faqTitle')}</span>
          </div>
          <button className="text-ink-secondary hover:text-ink-primary">
            {showExplanation ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {showExplanation && (
          <div className="mt-3 text-xs text-ink-secondary space-y-2 border-t border-line-subtle pt-3 leading-relaxed">
            <p>
              <strong className="text-ink-primary">1. El problema de la memoria residual (Working Set bloat):</strong> Aplicaciones como navegadores (Brave, Chrome), programas de Electron (Discord, Spotify, IDEs) y juegos van reservando memoria física (RAM) durante su uso. Cuando dejas de interactuar con ciertas pestañas o ventanas, esas páginas de memoria quedan marcadas como "ocupadas" aunque el programa no las necesite en ese instante.
            </p>
            <p>
              <strong className="text-ink-primary">2. La API nativa Win32 EmptyWorkingSet:</strong> Al pulsar <em>"Optimizar Memoria RAM"</em>, Optima abre el handle de cada proceso de usuario con privilegios <code className="text-xbox-light font-mono bg-surface-ground px-1.5 py-0.5 rounded border border-line-subtle">PROCESS_SET_QUOTA</code> e invoca <code className="text-xbox-light font-mono bg-surface-ground px-1.5 py-0.5 rounded border border-line-subtle">psapi.dll::EmptyWorkingSet()</code>. Esta función del kernel de Windows <strong>desaloja las páginas no referenciadas</strong> del working set del proceso y las transfiere a la <em>Standby List</em> (memoria en espera / libre).
            </p>
            <p>
              <strong className="text-ink-primary">3. El resultado:</strong> Las aplicaciones <strong>NO se cierran, NO pierden tu trabajo ni pestañas</strong>, pero el sistema recupera al instante gigabytes de memoria física lista para ser asignada a tareas de alto rendimiento.
            </p>
          </div>
        )}
      </div>

      {/* Latest Sweep Breakdown Card if available */}
      {latestTrimSummary && latestTrimSummary.top_reclaimed && latestTrimSummary.top_reclaimed.length > 0 && (
        <div className="mb-3.5 p-3.5 rounded-card bg-surface-ground border border-line-subtle">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-xbox-light" />
              <span className="text-xs font-bold text-ink-primary">Desglose del Último Vaciado de RAM</span>
            </div>
            <span className="text-[11px] font-semibold text-xbox-light bg-[#141f17] px-2.5 py-0.5 rounded-md border border-[#107C41]/30">
              Total: +{latestTrimSummary.total_freed_ram_mb} MB recuperados
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            {latestTrimSummary.top_reclaimed.slice(0, 8).map((p) => (
              <div key={p.pid} className="bg-surface-card border border-line-subtle rounded-card p-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-ink-primary truncate">{p.process_name}</span>
                  <span className="text-xbox-light font-bold font-mono">+{p.freed_mb} MB</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-ink-secondary mt-1 font-mono">
                  <span>{p.before_mb} MB</span>
                  <ArrowRight className="h-3 w-3 text-line-divider" />
                  <span className="text-ink-primary font-semibold">{p.after_mb} MB</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Stream Log */}
      <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-ink-secondary">
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
                className={`p-2.5 rounded-card border text-xs transition-all ${
                  isBlocked
                    ? 'bg-[#261c14] border-[#f59e0b]/30'
                    : isTerminated
                    ? 'bg-[#261416] border-[#ef4444]/30'
                    : isSweep
                    ? 'bg-[#121f17] border-xbox-core/40'
                    : 'bg-surface-card border-line-subtle hover:bg-surface-raised'
                }`}
              >
                {/* Event Summary Bar */}
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedLogIdx(isExpanded ? null : idx)}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <span className="font-mono text-[10px] text-ink-secondary">{log.timestamp}</span>

                    {/* Badge */}
                    {isSweep ? (
                      <span className="px-1.5 py-0.5 rounded font-bold text-[10px] uppercase bg-[#141f17] text-xbox-light border border-xbox-core/40">
                        Vaciado Global
                      </span>
                    ) : isBlocked ? (
                      <span className="px-1.5 py-0.5 rounded font-bold text-[10px] uppercase bg-[#261c14] text-[#f59e0b] border border-[#f59e0b]/30 flex items-center gap-1">
                        <Shield className="h-3 w-3" /> Bloqueado
                      </span>
                    ) : isTerminated ? (
                      <span className="px-1.5 py-0.5 rounded font-bold text-[10px] uppercase bg-[#261416] text-[#ef4444] border border-[#ef4444]/30">
                        Proceso Cerrado
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded font-bold text-[10px] uppercase bg-surface-raised text-ink-secondary border border-line-divider">
                        Memoria Recortada
                      </span>
                    )}

                    <span className="font-mono font-bold text-ink-primary truncate">
                      {isSweep ? log.action_title : `${log.process_name} (PID: ${log.pid})`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    {log.freed_ram_mb > 0 && (
                      <span className="font-mono font-bold text-xbox-light">
                        +{log.freed_ram_mb} MB
                      </span>
                    )}
                    {log.freed_mb > 0 && (
                      <span className="font-mono font-bold text-xbox-light">
                        +{log.freed_mb} MB
                      </span>
                    )}
                    <button className="text-ink-secondary hover:text-ink-primary">
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-line-subtle space-y-1 text-[11px] text-ink-secondary leading-relaxed">
                    {log.summary && (
                      <p><strong className="text-ink-primary">Resumen:</strong> {log.summary}</p>
                    )}
                    {log.decision_reason && (
                      <p>
                        <strong className="text-ink-primary">Criterio de Decisión:</strong> {log.decision_reason}
                      </p>
                    )}
                    {log.technical_mechanism && (
                      <p>
                        <strong className="text-xbox-light">Mecanismo Técnico:</strong> {log.technical_mechanism}
                      </p>
                    )}
                    {log.before_ram_mb !== undefined && log.after_ram_mb !== undefined && (
                      <div className="flex items-center gap-2 font-mono text-[11px] text-ink-secondary">
                        <span>Memoria antes: {log.before_ram_mb} MB</span>
                        <ArrowRight className="h-3 w-3 text-line-divider" />
                        <span className="text-ink-primary font-semibold">Memoria después: {log.after_ram_mb} MB</span>
                      </div>
                    )}
                    {log.message && (
                      <p className="text-ink-secondary italic font-mono">{log.message}</p>
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
