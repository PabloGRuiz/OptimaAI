import React, { useState } from 'react';
import { Crown, Sparkles, CheckCircle2, AlertCircle, X, ExternalLink, Key, ShieldCheck, Heart } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function ProActivationModal({ isOpen, onClose, licenseStatus, onActivateSuccess, onDeactivateSuccess }) {
  if (!isOpen) return null;

  const { t } = useLanguage();
  const [inputKey, setInputKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isPro = licenseStatus?.is_pro;

  const handleActivate = async (e) => {
    e.preventDefault();
    if (!inputKey.trim()) {
      setErrorMsg(t('proModal', 'keyInvalidToast'));
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const resp = await fetch('http://127.0.0.1:8765/api/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: inputKey.trim().toUpperCase() }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.detail || t('proModal', 'keyInvalidToast'));
      }

      setSuccessMsg(t('proModal', 'keySuccessToast'));
      if (onActivateSuccess) onActivateSuccess(data);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      setErrorMsg(err.message || t('proModal', 'keyInvalidToast'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm(t('proModal', 'deactivatePrompt'))) return;
    setLoading(true);
    try {
      const resp = await fetch('http://127.0.0.1:8765/api/license/deactivate', { method: 'POST' });
      const data = await resp.json();
      if (onDeactivateSuccess) onDeactivateSuccess(data);
      onClose();
    } catch (err) {
      setErrorMsg('Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-surface-card border border-line-divider rounded-card p-6 shadow-2xl overflow-hidden text-ink-primary">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-btn text-ink-secondary hover:text-ink-primary hover:bg-surface-raised transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-md bg-surface-raised border border-line-subtle flex items-center justify-center shadow-sm">
            <Crown className="h-5 w-5 text-ink-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-ink-primary">{t('proModal', 'title')}</h2>
              <span className="badge-mono text-[10px]">
                Patreon Edition
              </span>
            </div>
            <p className="text-xs text-ink-secondary">{t('proModal', 'subtitle')}</p>
          </div>
        </div>

        {/* IF ALREADY PRO */}
        {isPro ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-card bg-[#141f17] border border-[#107C41]/30 text-xbox-light text-xs flex items-start gap-3">
              <ShieldCheck className="h-4 w-4 text-xbox-light shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">OptimaAI PRO Active</p>
                <p className="text-xs text-ink-secondary mt-0.5">
                  {t('proModal', 'activeHolder')} <span className="font-bold text-ink-primary">{licenseStatus.holder}</span> ({licenseStatus.tier?.toUpperCase()})
                </p>
                {licenseStatus.activated_at && (
                  <p className="text-[10px] text-ink-secondary mt-0.5">{licenseStatus.activated_at}</p>
                )}
              </div>
            </div>

            <div className="p-3 rounded-card bg-surface-ground border border-line-subtle text-xs text-ink-secondary space-y-1.5">
              <p className="font-semibold text-ink-primary">{t('proModal', 'lifetimeTitle')}:</p>
              <div className="flex items-center gap-2 text-ink-secondary">
                <CheckCircle2 className="h-3.5 w-3.5 text-xbox-light" />
                <span>{t('proModal', 'perk1Title')}</span>
              </div>
              <div className="flex items-center gap-2 text-ink-secondary">
                <CheckCircle2 className="h-3.5 w-3.5 text-xbox-light" />
                <span>{t('proModal', 'perk2Title')}</span>
              </div>
              <div className="flex items-center gap-2 text-ink-secondary">
                <CheckCircle2 className="h-3.5 w-3.5 text-xbox-light" />
                <span>{t('proModal', 'perk3Title')}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                onClick={handleDeactivate}
                disabled={loading}
                className="px-3 py-1.5 text-xs font-medium rounded-btn text-[#ef4444] hover:bg-[#261416] border border-[#ef4444]/30 transition-colors"
              >
                {t('proModal', 'deactivateBtn')}
              </button>
              <button
                onClick={onClose}
                className="btn-xbox-primary px-4 py-1.5 text-xs font-bold"
              >
                {t('common', 'close')}
              </button>
            </div>
          </div>
        ) : (
          /* IF FREE USER (ACTIVATION FORM) */
          <div className="space-y-4">
            
            {/* Features Highlight */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-card bg-surface-ground border border-line-subtle flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-xbox-light shrink-0" />
                <span className="text-ink-secondary">{t('proModal', 'perk1Title')}</span>
              </div>
              <div className="p-2.5 rounded-card bg-surface-ground border border-line-subtle flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-ink-primary shrink-0" />
                <span className="text-ink-secondary">{t('proModal', 'perk2Title')}</span>
              </div>
              <div className="p-2.5 rounded-card bg-surface-ground border border-line-subtle flex items-center gap-2">
                <Key className="h-3.5 w-3.5 text-ink-primary shrink-0" />
                <span className="text-ink-secondary">{t('proModal', 'perk3Title')}</span>
              </div>
              <div className="p-2.5 rounded-card bg-surface-ground border border-line-subtle flex items-center gap-2">
                <Crown className="h-3.5 w-3.5 text-xbox-light shrink-0" />
                <span className="text-ink-secondary">{t('proModal', 'perk4Title')}</span>
              </div>
            </div>

            {/* Patreon Callout */}
            <div className="p-3 rounded-card bg-surface-ground border border-line-subtle flex items-center justify-between gap-3">
              <div className="text-xs">
                <p className="font-semibold text-ink-primary flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 text-[#ef4444] fill-[#ef4444]" /> {t('proModal', 'patreonLink')}
                </p>
                <p className="text-ink-secondary text-[11px] mt-0.5">
                  {t('proModal', 'perk4Desc')}
                </p>
              </div>
              <a
                href="https://patreon.com/Reselec"
                target="_blank"
                rel="noreferrer"
                className="btn-dark-subtle shrink-0 px-3 py-1.5 rounded-btn text-xs font-semibold flex items-center gap-1.5"
              >
                <span>Patreon</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Key Input Form */}
            <form onSubmit={handleActivate} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1.5 flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-xbox-light" /> {t('proModal', 'enterKeyPrompt')}
                </label>
                <input
                  type="text"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value.toUpperCase())}
                  placeholder={t('proModal', 'keyPlaceholder')}
                  className="w-full px-3.5 py-2 rounded-card bg-surface-ground border border-line-divider focus:border-xbox-core focus:outline-none focus:ring-1 focus:ring-xbox-core text-xs font-mono tracking-wider text-ink-primary placeholder:text-ink-secondary/60 transition-colors"
                />
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-2.5 rounded-card bg-[#261416] border border-[#ef4444]/30 text-[#ef4444] text-xs flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Success Alert */}
              {successMsg && (
                <div className="p-2.5 rounded-card bg-[#141f17] border border-[#107C41]/30 text-xbox-light text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-dark-subtle px-3.5 py-1.5 text-xs font-medium"
                >
                  {t('common', 'cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-xbox-primary px-4 py-1.5 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  <span>{loading ? t('proModal', 'activating') : t('proModal', 'activateBtn')}</span>
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
