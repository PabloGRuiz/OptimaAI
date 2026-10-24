import React from 'react';
import { AlertCircle, Shield, ShieldAlert, Activity } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function CandidateTable({ candidates }) {
  const { t } = useLanguage();
  if (!candidates || candidates.length === 0) return null;

  return (
    <div className="glass-panel p-5 overflow-hidden">
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h3 className="text-sm font-bold text-ink-primary flex items-center gap-2">
            <Activity className="h-4 w-4 text-xbox-light" />
            <span>{t('candidates', 'title')}</span>
          </h3>
          <p className="text-xs text-ink-secondary mt-0.5">
            {t('candidates', 'subtitle')}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-line-subtle text-ink-secondary bg-surface-ground/40">
              <th className="py-2.5 px-3 font-semibold">{t('candidates', 'pid')}</th>
              <th className="py-2.5 px-3 font-semibold">{t('candidates', 'process')}</th>
              <th className="py-2.5 px-3 font-semibold">{t('candidates', 'cpu')}</th>
              <th className="py-2.5 px-3 font-semibold">{t('candidates', 'ram')}</th>
              <th className="py-2.5 px-3 font-semibold">{t('candidates', 'security')}</th>
              <th className="py-2.5 px-3 font-semibold">{t('candidates', 'pathAnomalies')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-subtle/40">
            {candidates.map((p) => (
              <tr key={p.pid} className="hover:bg-surface-raised/50 transition-colors">
                <td className="py-2 px-3 font-mono text-ink-secondary">{p.pid}</td>
                <td className="py-2 px-3 font-semibold text-ink-primary font-mono">{p.name}</td>
                <td className="py-2 px-3 font-mono">
                  <span className={p.cpu_percent > 15 ? 'text-[#f59e0b] font-bold' : 'text-ink-secondary'}>
                    {p.cpu_percent}%
                  </span>
                </td>
                <td className="py-2 px-3 font-mono">
                  <span className={p.memory_rss_mb > 350 ? 'text-xbox-light font-bold' : 'text-ink-secondary'}>
                    {p.memory_rss_mb} MB
                  </span>
                </td>
                <td className="py-2 px-3">
                  {p.is_protected ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-xbox-light bg-[#141f17] px-2 py-0.5 rounded-md border border-[#107C41]/30">
                      <Shield className="h-3 w-3" /> {t('candidates', 'protected')}
                    </span>
                  ) : p.is_suspicious ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#ef4444] bg-[#261416] px-2 py-0.5 rounded-md border border-[#ef4444]/30">
                      <ShieldAlert className="h-3 w-3" /> {t('candidates', 'anomaly')}
                    </span>
                  ) : (
                    <span className="text-[11px] text-ink-secondary">{t('candidates', 'standard')}</span>
                  )}
                </td>
                <td className="py-2 px-3 max-w-xs truncate text-ink-secondary font-mono text-[11px]">
                  {p.anomaly_flags && p.anomaly_flags.length > 0 ? (
                    <span className="text-[#f59e0b] flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 flex-shrink-0" />
                      {p.anomaly_flags.join(', ')}
                    </span>
                  ) : (
                    p.exe_path || 'Sistema'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

