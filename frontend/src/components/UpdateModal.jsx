import React, { useState, useEffect } from 'react';
import { Sparkles, Download, ExternalLink, X, CheckCircle2, AlertCircle, RefreshCw, ArrowUpCircle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function UpdateModal({ isOpen, onClose, updateInfo, onShowToast }) {
  const { t } = useLanguage();
  const [updating, setUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [errorText, setErrorText] = useState(null);

  useEffect(() => {
    let pollInterval = null;
    if (updating) {
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch('/api/system/update/progress');
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'downloading') {
              setProgress(data.percent || 10);
              setStatusText(`${t('updater', 'updatingStatus')} (${data.percent}%)`);
            } else if (data.status === 'ready_to_swap') {
              setProgress(100);
              setStatusText(t('updater', 'restartingNotice'));
              clearInterval(pollInterval);
            } else if (data.status === 'error') {
              setErrorText(data.error || 'Error al descargar la actualización.');
              setUpdating(false);
              clearInterval(pollInterval);
            }
          }
        } catch (e) {
          // silent
        }
      }, 1000);
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [updating, t]);

  if (!isOpen || !updateInfo) return null;

  const handleApplyUpdate = async () => {
    setUpdating(true);
    setErrorText(null);
    setProgress(5);
    setStatusText(t('updater', 'updatingStatus'));

    try {
      const res = await fetch('/api/system/update/apply', { method: 'POST' });
      const data = await res.json();
      if (!data.success) {
        setErrorText(data.message || 'No se pudo iniciar la actualización.');
        setUpdating(false);
      }
    } catch (e) {
      setErrorText('Error de conexión al iniciar la actualización.');
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-card bg-surface-card border border-line-divider p-6 shadow-2xl text-ink-primary max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-line-subtle relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-surface-raised border border-line-subtle flex items-center justify-center shadow-sm text-xbox-light">
              <ArrowUpCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink-primary flex items-center gap-2">
                <span>{t('updater', 'modalTitle')}</span>
                <span className="badge-mono text-[10px]">
                  v{updateInfo.latest_version}
                </span>
              </h2>
              <p className="text-xs text-ink-secondary mt-0.5">{t('updater', 'modalSubtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={updating}
            className="p-1.5 rounded-btn text-ink-secondary hover:text-ink-primary hover:bg-surface-raised transition-colors disabled:opacity-30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Version Compare Banner */}
        <div className="my-3.5 p-3 rounded-card bg-surface-ground border border-line-subtle flex items-center justify-between flex-wrap gap-3 text-xs relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-ink-secondary">{t('updater', 'currentVersionLabel')}</span>
            <span className="font-mono font-bold text-ink-primary bg-surface-raised px-2 py-0.5 rounded-sm border border-line-subtle">
              v{updateInfo.current_version}
            </span>
            <span className="text-line-divider">➔</span>
            <span className="text-ink-secondary">{t('updater', 'latestVersionLabel')}</span>
            <span className="font-mono font-bold text-xbox-light bg-[#141f17] border border-[#107C41]/30 px-2 py-0.5 rounded-sm">
              v{updateInfo.latest_version}
            </span>
          </div>
          {updateInfo.download_size_mb > 0 && (
            <div className="text-[11px] text-ink-secondary font-mono">
              {t('updater', 'sizeLabel')} <span className="text-ink-primary">{updateInfo.download_size_mb} MB</span>
            </div>
          )}
        </div>

        {/* Release Notes */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-2 text-xs text-ink-secondary relative z-10 my-2">
          <div className="font-semibold text-ink-primary flex items-center gap-1.5 mb-1.5">
            <Sparkles className="h-3.5 w-3.5 text-xbox-light" />
            <span>{t('updater', 'whatsNew')}</span>
          </div>
          <div className="p-3.5 rounded-card bg-surface-ground border border-line-subtle font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto text-ink-secondary">
            {updateInfo.release_notes}
          </div>
        </div>

        {/* Error message if any */}
        {errorText && (
          <div className="my-2 p-2.5 rounded-card bg-[#261416] border border-[#ef4444]/30 text-[#ef4444] text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorText}</span>
          </div>
        )}

        {/* Progress bar during auto update */}
        {updating && (
          <div className="my-3 space-y-2">
            <div className="flex justify-between text-xs font-mono text-xbox-light">
              <span>{statusText}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-surface-ground overflow-hidden border border-line-subtle">
              <div
                className="h-full bg-gradient-to-r from-xbox-dark via-xbox-core to-xbox-light transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-3.5 border-t border-line-subtle flex items-center justify-between gap-3 relative z-10">
          <a
            href={updateInfo.release_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-ink-secondary hover:text-ink-primary flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>{t('updater', 'openReleasePage')}</span>
          </a>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              disabled={updating}
              className="btn-dark-subtle px-3.5 py-1.5 text-xs font-semibold disabled:opacity-30"
            >
              {t('updater', 'remindLater')}
            </button>
            <button
              onClick={handleApplyUpdate}
              disabled={updating}
              className="btn-xbox-primary px-4 py-1.5 text-xs font-bold flex items-center gap-2 disabled:opacity-60"
            >
              {updating ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>{t('updater', 'updatingBtn')}</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>{t('updater', 'updateNowBtn')}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
