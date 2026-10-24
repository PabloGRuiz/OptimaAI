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
    <header className="glass-panel-header px-6 py-3.5 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-[#18181c] border border-[#2d2d34] flex items-center justify-center shadow-sm">
            <Cpu className="h-4.5 w-4.5 text-[#10d05c]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-[#f3f4f6]">
                {t('header', 'title')}<span className="text-[#10d05c]">{t('header', 'aiSuffix')}</span>
              </h1>
              {ollamaStatus?.is_running ? (
                <span className="badge-mono px-2 py-0.5 text-[11px] flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#10d05c] shadow-[0_0_8px_#10d05c]" />
                  <span>{t('header', 'localAIActive')}</span>
                </span>
              ) : (
                <span className="badge-mono px-2 py-0.5 text-[11px] text-[#9ca3af] flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9ca3af]" />
                  <span>{t('header', 'heuristicMode')}</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#9ca3af] -mt-0.5">{t('header', 'subtitle')}</p>
          </div>
        </div>

        {/* Status Indicators & Controls */}
        <div className="flex items-center gap-2.5">
          
          {/* New Version Badge (if available) */}
          {updateInfo?.has_update && (
            <button
              onClick={onOpenUpdateModal}
              title={`Nueva versión v${updateInfo.latest_version} disponible.`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#1f1f24] hover:bg-[#26262c] text-[#13de64] border border-[#107C41]/50 shadow-[0_0_10px_-2px_rgba(16,208,92,0.3)] transition-all"
            >
              <ArrowUpCircle className="h-3.5 w-3.5 text-[#10d05c]" />
              <span>{t('header', 'updateAvailable')} v{updateInfo.latest_version}</span>
            </button>
          )}

          {/* Language Switcher Button (ES / EN) */}
          <button
            onClick={toggleLanguage}
            title={t('header', 'langSwitch')}
            className="btn-dark-subtle flex items-center gap-1.5 px-2.5 py-1 text-xs"
          >
            <Globe className="h-3.5 w-3.5 text-[#9ca3af]" />
            <span>{lang === 'es' ? 'ES' : 'EN'}</span>
          </button>

          {/* Model Selector */}
          <div className="hidden sm:flex items-center gap-2 bg-[#18181c] border border-[#26262b] rounded-md px-2.5 py-1 text-xs hover:border-[#3b3b45] transition-colors">
            <span className="text-[#9ca3af] font-medium">{t('header', 'ollamaModel')}:</span>
            <select
              value={activeModel}
              onChange={(e) => onSelectModel(e.target.value)}
              className="bg-transparent text-[#f3f4f6] font-semibold focus:outline-none cursor-pointer text-xs"
            >
              {models && models.length > 0 ? (
                models.map((m) => (
                  <option key={m} value={m} className="bg-[#18181c] text-[#f3f4f6]">
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
            <div className="badge-mono flex items-center gap-1.5 px-2.5 py-1 text-xs">
              <Shield className="h-3.5 w-3.5 text-[#10d05c]" />
              <span>{t('header', 'adminElevated')}</span>
            </div>
          ) : (
            <button
              onClick={onRelaunchAdmin}
              title={t('header', 'standardUser')}
              className="btn-dark-subtle flex items-center gap-1.5 px-2.5 py-1 text-xs border-amber-500/30 text-amber-400 hover:border-amber-500/50"
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
              className="badge-mono hover:bg-[#26262c] hover:border-[#3b3b45] flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-[#f3f4f6] transition-all cursor-pointer"
            >
              <Crown className="h-3.5 w-3.5 text-[#d1d5db]" />
              <span>PRO • {licenseStatus.holder}</span>
            </button>
          ) : (
            <button
              onClick={onOpenProModal}
              title={t('header', 'activatePro')}
              className="btn-xbox-primary flex items-center gap-1.5 px-3 py-1 text-xs"
            >
              <Crown className="h-3.5 w-3.5 text-white" />
              <span>{t('header', 'activatePro')}</span>
            </button>
          )}

          {/* Manual Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="btn-dark-subtle p-1.5 flex items-center justify-center"
            title={t('header', 'refreshTooltip')}
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#9ca3af] ${refreshing ? 'animate-spin text-white' : ''}`} />
          </button>
        </div>

      </div>
    </header>
  );
}
