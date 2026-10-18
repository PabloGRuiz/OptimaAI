import React from 'react';
import { Shield, ShieldAlert, Cpu, Sparkles, RefreshCw, Crown, Globe, ArrowUpCircle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function Header({
  systemStatus,
  models,
  activeModel,
  onSelectModel,
  onRelaunchAdmin,
  refreshing,
  onRefresh,
  ollamaStatus,
  licenseStatus,
  onOpenProModal,
  updateInfo,
  onOpenUpdateModal
}) {
  const { lang, toggleLanguage, t } = useLanguage();

  return (
    <header className="glass-panel-header px-6 py-4 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Cpu className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                {t('header', 'title')}<span className="text-indigo-400">{t('header', 'aiSuffix')}</span>
              </h1>
              {ollamaStatus?.is_running ? (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> {t('header', 'localAIActive')}
                </span>
              ) : (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  ⚡ {t('header', 'heuristicMode')}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">{t('header', 'subtitle')}</p>
          </div>
        </div>

        {/* Status Indicators & Controls */}
        <div className="flex items-center gap-3">
          
          {/* New Version Badge (if available) */}
          {updateInfo?.has_update && (
            <button
              onClick={onOpenUpdateModal}
              title={`Nueva versión v${updateInfo.latest_version} disponible. Haz clic para actualizar.`}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-lg shadow-indigo-500/25 animate-pulse transition-all hover:scale-105"
            >
              <ArrowUpCircle className="h-3.5 w-3.5 text-cyan-200" />
              <span>{t('header', 'updateAvailable')} v{updateInfo.latest_version}</span>
            </button>
          )}

          {/* Language Switcher Button (ES / EN) */}
          <button
            onClick={toggleLanguage}
            title={t('header', 'langSwitch')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 text-xs font-bold transition-all hover:border-slate-500"
          >
            <Globe className="h-3.5 w-3.5 text-indigo-400" />
            <span>{lang === 'es' ? '🇪🇸 ES' : '🇬🇧 EN'}</span>
          </button>

          {/* Model Selector */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-900/80 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-slate-400">{t('header', 'ollamaModel')}</span>
            <select
              value={activeModel}
              onChange={(e) => onSelectModel(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              {models && models.length > 0 ? (
                models.map((m) => (
                  <option key={m} value={m} className="bg-slate-900 text-slate-200">
                    {m}
                  </option>
                ))
              ) : (
                <option value="llama3.2:latest">llama3.2:latest</option>
              )}
            </select>
          </div>

          {/* Privilege Badge */}
          {systemStatus?.is_elevated ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Shield className="h-3.5 w-3.5" />
              <span>{t('header', 'adminElevated')}</span>
            </div>
          ) : (
            <button
              onClick={onRelaunchAdmin}
              title={t('header', 'standardUser')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>{t('header', 'standardUser')}</span>
            </button>
          )}

          {/* Pro Edition Badge / Action */}
          {licenseStatus?.is_pro ? (
            <button
              onClick={onOpenProModal}
              title={`OptimaAI Pro - ${licenseStatus.holder} (${licenseStatus.tier?.toUpperCase()})`}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-purple-500/20 text-amber-300 border border-amber-400/40 shadow-sm shadow-amber-500/10 hover:border-amber-300 hover:scale-105 transition-all"
            >
              <Crown className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400/20" />
              <span>PRO ({licenseStatus.holder})</span>
            </button>
          ) : (
            <button
              onClick={onOpenProModal}
              title={t('header', 'activatePro')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-md shadow-amber-500/20 hover:scale-105 transition-all"
            >
              <Crown className="h-3.5 w-3.5 text-slate-950 fill-slate-950/20" />
              <span>{t('header', 'activatePro')}</span>
            </button>
          )}

          {/* Manual Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/50"
            title={t('header', 'refreshTooltip')}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

      </div>
    </header>
  );
}
