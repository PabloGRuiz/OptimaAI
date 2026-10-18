import React, { useState } from 'react';
import { Sparkles, Zap, Download, Play, Info, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function OllamaStatusBanner({
  ollamaStatus,
  onLaunchOllama,
  launching
}) {
  const { t } = useLanguage();
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
                  <span className="font-bold text-sm text-white">{t('ollamaBanner', 'titleStopped')}</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 uppercase">
                    Heuristic
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {t('ollamaBanner', 'infoText')}
                </p>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-cyan-300">
                  <Info className="h-3.5 w-3.5 flex-shrink-0 text-cyan-400" />
                  <span>
                    <strong>Ollama idle:</strong> {t('ollamaBanner', 'zeroConsumption')}
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
                  <span>{launching ? t('ollamaBanner', 'starting') : t('ollamaBanner', 'startBtn')}</span>
                </button>
              ) : (
                <a
                  href={ollamaStatus.download_url || "https://ollama.com/download"}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-md transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Ollama.com</span>
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
            <span>{t('ollamaBanner', 'titleRunning')}: <strong>{ollamaStatus.active_model}</strong></span>
          </div>
          <button
            onClick={() => setShowDetails(true)}
            className="text-slate-400 hover:text-white flex items-center gap-1 transition"
          >
            <span>{t('ollamaBanner', 'zeroConsumption')}</span>
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
                <Sparkles className="h-4 w-4 text-indigo-400" /> {t('ollamaBanner', 'startBtn')}
              </h4>
              <button onClick={() => setShowConfirmLaunch(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {t('ollamaBanner', 'zeroConsumption')}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfirmLaunch(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                {t('common', 'cancel')}
              </button>
              <button
                onClick={() => {
                  setShowConfirmLaunch(false);
                  onLaunchOllama();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
              >
                {t('common', 'ok')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Consumption Details Dialog */}
      {showDetails && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> {t('ollamaBanner', 'titleRunning')}
              </h4>
              <button onClick={() => setShowDetails(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {t('ollamaBanner', 'zeroConsumption')}
            </p>
            <button
              onClick={() => setShowDetails(false)}
              className="w-full py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white"
            >
              {t('common', 'close')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
