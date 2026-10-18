import React from 'react';
import { AlertCircle, Shield, ShieldAlert, Activity } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function CandidateTable({ candidates }) {
  const { t } = useLanguage();
  if (!candidates || candidates.length === 0) return null;

  return (
    <div className="glass-panel rounded-2xl p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            <span>{t('candidates', 'title')}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('candidates', 'subtitle')}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="pb-3 font-semibold">{t('candidates', 'pid')}</th>
              <th className="pb-3 font-semibold">{t('candidates', 'process')}</th>
              <th className="pb-3 font-semibold">{t('candidates', 'cpu')}</th>
              <th className="pb-3 font-semibold">{t('candidates', 'ram')}</th>
              <th className="pb-3 font-semibold">{t('candidates', 'security')}</th>
              <th className="pb-3 font-semibold">{t('candidates', 'pathAnomalies')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {candidates.map((p) => (
              <tr key={p.pid} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-2.5 font-mono text-slate-400">{p.pid}</td>
                <td className="py-2.5 font-semibold text-white font-mono">{p.name}</td>
                <td className="py-2.5 font-mono">
                  <span className={p.cpu_percent > 15 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                    {p.cpu_percent}%
                  </span>
                </td>
                <td className="py-2.5 font-mono">
                  <span className={p.memory_rss_mb > 350 ? 'text-cyan-400 font-bold' : 'text-slate-300'}>
                    {p.memory_rss_mb} MB
                  </span>
                </td>
                <td className="py-2.5">
                  {p.is_protected ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <Shield className="h-3 w-3" /> {t('candidates', 'protected')}
                    </span>
                  ) : p.is_suspicious ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                      <ShieldAlert className="h-3 w-3" /> {t('candidates', 'anomaly')}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">{t('candidates', 'standard')}</span>
                  )}
                </td>
                <td className="py-2.5 max-w-xs truncate text-slate-400 font-mono text-[11px]">
                  {p.anomaly_flags && p.anomaly_flags.length > 0 ? (
                    <span className="text-amber-400 flex items-center gap-1">
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

