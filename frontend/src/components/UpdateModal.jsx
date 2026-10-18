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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-gradient-to-b from-slate-900 via-[#0B0F19] to-slate-950 border border-indigo-500/30 p-6 shadow-2xl shadow-indigo-500/20 text-slate-100 max-h-[90vh] flex flex-col">
        
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-indigo-500/15 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <ArrowUpCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{t('updater', 'modalTitle')}</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  v{updateInfo.latest_version}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{t('updater', 'modalSubtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={updating}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-30"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Version Compare Banner */}
        <div className="my-4 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between flex-wrap gap-3 text-xs relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">{t('updater', 'currentVersionLabel')}</span>
            <span className="font-mono font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
              v{updateInfo.current_version}
            </span>
            <span className="text-slate-500">➔</span>
            <span className="text-slate-400">{t('updater', 'latestVersionLabel')}</span>
            <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              v{updateInfo.latest_version}
            </span>
          </div>
          {updateInfo.download_size_mb > 0 && (
            <div className="text-[11px] text-slate-400 font-mono">
              {t('updater', 'sizeLabel')} <span className="text-slate-200">{updateInfo.download_size_mb} MB</span>
            </div>
          )}
        </div>

        {/* Release Notes */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-2 text-xs text-slate-300 relative z-10 my-2">
          <div className="font-semibold text-slate-200 flex items-center gap-1.5 mb-1.5">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>{t('updater', 'whatsNew')}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/60 font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
            {updateInfo.release_notes}
          </div>
        </div>

        {/* Error message if any */}
        {errorText && (
          <div className="my-2 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorText}</span>
          </div>
        )}

        {/* Progress bar during auto update */}
        {updating && (
          <div className="my-3 space-y-2">
            <div className="flex justify-between text-xs font-mono text-cyan-300">
              <span>{statusText}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3 relative z-10">
          <a
            href={updateInfo.release_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>{t('updater', 'openReleasePage')}</span>
          </a>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={updating}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-30"
            >
              {t('updater', 'remindLater')}
            </button>
            <button
              onClick={handleApplyUpdate}
              disabled={updating}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-lg shadow-indigo-500/25 flex items-center gap-2 disabled:opacity-60 transition-all hover:scale-105"
            >
              {updating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>{t('updater', 'updatingBtn')}</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
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
