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
        <div className="rounded-card border border-line-subtle bg-surface-card p-3.5 shadow-sm transition-all">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-md bg-surface-raised border border-line-subtle text-ink-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap className="h-4 w-4 text-xbox-light" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-ink-primary">{t('ollamaBanner', 'titleStopped')}</span>
                  <span className="badge-mono text-[10px]">
                    Heuristic
                  </span>
                </div>
                <p className="text-xs text-ink-secondary mt-0.5 leading-relaxed">
                  {t('ollamaBanner', 'infoText')}
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-ink-secondary">
                  <Info className="h-3 w-3 flex-shrink-0 text-xbox-light" />
                  <span>
                    <strong className="text-ink-primary">Ollama idle:</strong> {t('ollamaBanner', 'zeroConsumption')}
                  </span>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
              {isInstalled ? (
                <button
                  onClick={() => setShowConfirmLaunch(true)}
                  disabled={launching}
                  className="btn-xbox-primary w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold disabled:opacity-50"
                >
                  <Play className={`h-3 w-3 fill-current ${launching ? 'animate-spin' : ''}`} />
                  <span>{launching ? t('ollamaBanner', 'starting') : t('ollamaBanner', 'startBtn')}</span>
                </button>
              ) : (
                <a
                  href={ollamaStatus.download_url || "https://ollama.com/download"}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-dark-subtle w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold"
                >
                  <Download className="h-3 w-3" />
                  <span>Ollama.com</span>
                </a>
              )}
            </div>

          </div>
        </div>
      ) : (
        /* Connected Information Pill */
        <div className="rounded-card border border-[#107C41]/30 bg-[#121f17] px-3.5 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-xbox-light font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t('ollamaBanner', 'titleRunning')}: <strong className="text-white font-mono">{ollamaStatus.active_model}</strong></span>
          </div>
          <button
            onClick={() => setShowDetails(true)}
            className="text-ink-secondary hover:text-ink-primary flex items-center gap-1 transition text-xs"
          >
            <span>{t('ollamaBanner', 'zeroConsumption')}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Confirmation Modal to Launch Ollama */}
      {showConfirmLaunch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel bg-surface-card border border-line-divider rounded-card max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-sm font-bold text-ink-primary flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-xbox-light" /> {t('ollamaBanner', 'startBtn')}
              </h4>
              <button onClick={() => setShowConfirmLaunch(false)} className="text-ink-secondary hover:text-ink-primary">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed mb-4">
              {t('ollamaBanner', 'zeroConsumption')}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowConfirmLaunch(false)}
                className="btn-dark-subtle px-3 py-1.5 text-xs font-medium"
              >
                {t('common', 'cancel')}
              </button>
              <button
                onClick={() => {
                  setShowConfirmLaunch(false);
                  onLaunchOllama();
                }}
                className="btn-xbox-primary px-3.5 py-1.5 text-xs font-bold"
              >
                {t('common', 'ok')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Consumption Details Dialog */}
      {showDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel bg-surface-card border border-line-divider rounded-card max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-sm font-bold text-ink-primary flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-xbox-light" /> {t('ollamaBanner', 'titleRunning')}
              </h4>
              <button onClick={() => setShowDetails(false)} className="text-ink-secondary hover:text-ink-primary">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed mb-4">
              {t('ollamaBanner', 'zeroConsumption')}
            </p>
            <button
              onClick={() => setShowDetails(false)}
              className="btn-dark-subtle w-full py-2 text-xs font-bold"
            >
              {t('common', 'close')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
