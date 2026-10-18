import React, { useState } from 'react';
import { Check, X, ShieldAlert, ShieldCheck, AlertCircle, Play, CheckCircle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function ActionList({
  issues,
  onExecuteActions,
  executing,
  executionResult
}) {
  const { t } = useLanguage();
  const [selectedPids, setSelectedPids] = useState(() => {
    // By default, select issues where action is 'terminate' or 'trim_memory' AND safe to execute
    const initial = new Set();
    issues?.forEach((issue) => {
      if (issue.recommended_action === 'terminate' && issue.is_safe_to_execute) {
        initial.add(issue.pid);
      }
    });
    return initial;
  });

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  if (!issues || issues.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6 text-center">
        <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-white">{t('actions', 'emptyTitle')}</h4>
        <p className="text-xs text-slate-400 mt-1">
          {t('actions', 'emptyDesc')}
        </p>
      </div>
    );
  }


  const togglePid = (pid, isSafe) => {
    if (!isSafe) return;
    const next = new Set(selectedPids);
    if (next.has(pid)) {
      next.delete(pid);
    } else {
      next.add(pid);
    }
    setSelectedPids(next);
  };

  const selectAllSafe = () => {
    const next = new Set();
    issues.forEach((i) => {
      if (i.is_safe_to_execute && i.recommended_action !== 'ignore') {
        next.add(i.pid);
      }
    });
    setSelectedPids(next);
  };

  const deselectAll = () => {
    setSelectedPids(new Set());
  };

  const handleConfirmAndRun = () => {
    const actionPayload = [];
    issues.forEach((i) => {
      if (selectedPids.has(i.pid)) {
        actionPayload.push({
          pid: i.pid,
          action: i.recommended_action,
          reason: i.reason
        });
      }
    });
    setConfirmModalOpen(false);
    onExecuteActions(actionPayload);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 relative">
      
      {/* Title & Bulk Selection */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>{t('actions', 'title')}</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              {issues.length} {t('actions', 'detectedCount', 'detectadas')}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('actions', 'subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={selectAllSafe}
            className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            {t('actions', 'selectSafe')}
          </button>
          <button
            onClick={deselectAll}
            className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            {t('actions', 'deselectAll')}
          </button>
        </div>
      </div>

      {/* List of Detected Issues */}
      <div className="space-y-2.5">
        {issues.map((issue) => {
          const isSelected = selectedPids.has(issue.pid);
          const isSafe = issue.is_safe_to_execute;

          return (
            <div
              key={issue.pid}
              onClick={() => togglePid(issue.pid, isSafe)}
              className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-4 cursor-pointer ${
                !isSafe
                  ? 'bg-slate-900/40 border-slate-800/80 opacity-60 cursor-not-allowed'
                  : isSelected
                  ? 'bg-indigo-950/20 border-indigo-500/50 shadow-sm shadow-indigo-500/10'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Left: Checkbox & Process Details */}
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={!isSafe}
                  onChange={() => {}} // handled by parent div
                  className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer disabled:cursor-not-allowed"
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-white truncate">
                      {issue.process_name}
                    </span>
                    <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                      PID: {issue.pid}
                    </span>
                    {isSafe ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <ShieldCheck className="h-3 w-3" /> {t('actions', 'safe')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        <ShieldAlert className="h-3 w-3" /> {t('actions', 'protected')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-1">
                    {issue.reason}
                  </p>
                  {issue.safety_override_note && (
                    <p className="text-[11px] text-amber-400/90 mt-0.5 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {issue.safety_override_note}
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Action Badge */}
              <div className="flex-shrink-0">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                    issue.recommended_action === 'terminate'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : issue.recommended_action === 'trim_memory'
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {issue.recommended_action}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation & CTA Bar */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
        <div className="text-xs text-slate-400">
          <span className="text-white font-semibold">{selectedPids.size}</span> {t('actions', 'selectedCount')}
        </div>

        <button
          disabled={selectedPids.size === 0 || executing}
          onClick={() => setConfirmModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Play className="h-4 w-4 fill-current" />
          <span>{t('actions', 'executeBtn')}</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h4 className="text-lg font-bold text-white mb-2">{t('actions', 'confirmTitle')}</h4>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              {t('actions', 'confirmDesc')} (<strong className="text-indigo-400">{selectedPids.size}</strong>)
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                {t('actions', 'confirmCancel')}
              </button>
              <button
                onClick={handleConfirmAndRun}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 transition"
              >
                {t('actions', 'confirmExecute')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Execution Results Feedback Banner */}
      {executionResult && (
        <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-indigo-500/30">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-400" /> {t('actions', 'executionSummary')}
            </h4>
            <span className="text-xs text-emerald-400 font-semibold">
              +{executionResult.total_freed_ram_mb} {t('actions', 'freedMb')}
            </span>
          </div>
          <div className="space-y-1 text-xs text-slate-300">
            {executionResult.results?.map((res, i) => (
              <div key={i} className="flex items-center justify-between py-0.5 border-b border-slate-800/60 last:border-none">
                <span className="font-mono text-slate-200">{res.process_name} (PID {res.pid})</span>
                <span className={res.success ? 'text-emerald-400' : 'text-rose-400'}>
                  {res.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

