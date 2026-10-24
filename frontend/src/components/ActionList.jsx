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
      <div className="glass-panel p-6 text-center">
        <CheckCircle className="h-7 w-7 text-xbox-light mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-ink-primary">{t('actions', 'emptyTitle')}</h4>
        <p className="text-xs text-ink-secondary mt-1">
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
    <div className="glass-panel p-5 relative">
      
      {/* Title & Bulk Selection */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-line-subtle">
        <div>
          <h3 className="text-sm font-bold text-ink-primary flex items-center gap-2">
            <span>{t('actions', 'title')}</span>
            <span className="badge-mono text-[11px]">
              {issues.length} {t('actions', 'detectedCount', 'detectadas')}
            </span>
          </h3>
          <p className="text-xs text-ink-secondary mt-0.5">
            {t('actions', 'subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={selectAllSafe}
            className="btn-dark-subtle text-xs px-2.5 py-1"
          >
            {t('actions', 'selectSafe')}
          </button>
          <button
            onClick={deselectAll}
            className="btn-dark-subtle text-xs px-2.5 py-1"
          >
            {t('actions', 'deselectAll')}
          </button>
        </div>
      </div>

      {/* List of Detected Issues */}
      <div className="space-y-2">
        {issues.map((issue) => {
          const isSelected = selectedPids.has(issue.pid);
          const isSafe = issue.is_safe_to_execute;

          return (
            <div
              key={issue.pid}
              onClick={() => togglePid(issue.pid, isSafe)}
              className={`p-3 rounded-card border transition-all flex items-center justify-between gap-4 cursor-pointer ${
                !isSafe
                  ? 'bg-surface-ground/50 border-line-subtle opacity-60 cursor-not-allowed'
                  : isSelected
                  ? 'bg-[#121f17] border-xbox-core shadow-sm shadow-xbox-core/15'
                  : 'bg-surface-card border-line-subtle hover:bg-surface-raised hover:border-line-divider'
              }`}
            >
              {/* Left: Checkbox & Process Details */}
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={!isSafe}
                  onChange={() => {}} // handled by parent div
                  className="h-4 w-4 rounded-sm border-line-divider bg-surface-ground text-xbox-core focus:ring-0 focus:ring-offset-0 cursor-pointer disabled:cursor-not-allowed accent-[#107C41]"
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-ink-primary truncate">
                      {issue.process_name}
                    </span>
                    <span className="text-[11px] font-mono text-ink-secondary bg-surface-ground px-1.5 py-0.5 rounded-sm border border-line-subtle">
                      PID: {issue.pid}
                    </span>
                    {isSafe ? (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-xbox-light bg-[#141f17] px-2 py-0.5 rounded-md border border-[#107C41]/30">
                        <ShieldCheck className="h-3 w-3" /> {t('actions', 'safe')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-ink-secondary bg-surface-raised px-2 py-0.5 rounded-md border border-line-divider">
                        <ShieldAlert className="h-3 w-3" /> {t('actions', 'protected')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-secondary truncate mt-0.5">
                    {issue.reason}
                  </p>
                  {issue.safety_override_note && (
                    <p className="text-[11px] text-[#f59e0b] mt-0.5 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {issue.safety_override_note}
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Action Badge */}
              <div className="flex-shrink-0">
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    issue.recommended_action === 'terminate'
                      ? 'bg-[#261416] text-[#ef4444] border border-[#ef4444]/30'
                      : issue.recommended_action === 'trim_memory'
                      ? 'bg-[#141f17] text-xbox-light border border-xbox-core/40'
                      : 'bg-surface-raised text-ink-secondary border border-line-divider'
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
      <div className="mt-5 pt-3.5 border-t border-line-subtle flex items-center justify-between">
        <div className="text-xs text-ink-secondary">
          <span className="text-ink-primary font-bold">{selectedPids.size}</span> {t('actions', 'selectedCount')}
        </div>

        <button
          disabled={selectedPids.size === 0 || executing}
          onClick={() => setConfirmModalOpen(true)}
          className="btn-xbox-primary flex items-center gap-2 px-5 py-2 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-xbox-glow"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>{t('actions', 'executeBtn')}</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel bg-surface-card border border-line-divider rounded-card max-w-md w-full p-5 shadow-2xl">
            <h4 className="text-base font-bold text-ink-primary mb-2">{t('actions', 'confirmTitle')}</h4>
            <p className="text-xs text-ink-secondary leading-relaxed mb-4">
              {t('actions', 'confirmDesc')} (<strong className="text-ink-primary">{selectedPids.size}</strong>)
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="btn-dark-subtle px-3.5 py-1.5 text-xs font-medium"
              >
                {t('actions', 'confirmCancel')}
              </button>
              <button
                onClick={handleConfirmAndRun}
                className="px-3.5 py-1.5 rounded-btn text-xs font-bold bg-[#ef4444] hover:bg-[#dc2626] text-white shadow-md shadow-rose-950/50 transition"
              >
                {t('actions', 'confirmExecute')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Execution Results Feedback Banner */}
      {executionResult && (
        <div className="mt-4 p-3.5 rounded-card bg-surface-ground border border-line-subtle">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-ink-primary flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-xbox-light" /> {t('actions', 'executionSummary')}
            </h4>
            <span className="text-xs text-xbox-light font-bold font-mono">
              +{executionResult.total_freed_ram_mb} {t('actions', 'freedMb')}
            </span>
          </div>
          <div className="space-y-1 text-xs text-ink-secondary">
            {executionResult.results?.map((res, i) => (
              <div key={i} className="flex items-center justify-between py-0.5 border-b border-line-subtle/50 last:border-none">
                <span className="font-mono text-ink-primary text-[11px]">{res.process_name} (PID {res.pid})</span>
                <span className={`text-[11px] font-medium ${res.success ? 'text-xbox-light' : 'text-[#ef4444]'}`}>
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

