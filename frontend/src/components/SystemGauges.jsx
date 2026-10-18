import React from 'react';
import { Cpu, Server, HardDrive, Activity } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function SystemGauges({ status }) {
  const { t } = useLanguage();
  if (!status) return null;

  const getUsageColor = (pct) => {
    if (pct >= 85) return 'from-rose-500 to-red-600 text-rose-400';
    if (pct >= 65) return 'from-amber-500 to-orange-500 text-amber-400';
    return 'from-emerald-500 to-teal-500 text-emerald-400';
  };

  const cpuPct = status.cpu_total_percent || 0;
  const ramPct = status.memory_percent || 0;
  const diskPct = status.disk_usage_percent || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      
      {/* CPU Usage Card */}
      <div className="glass-panel rounded-2xl p-5 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
            <Cpu className="h-4 w-4 text-indigo-400" />
            <span>{t('gauges', 'cpu')}</span>
          </div>
          <span className="text-xs text-slate-400">{status.cpu_count_logical} {t('gauges', 'cores')}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">{cpuPct}%</span>
        </div>
        <div className="w-full bg-slate-800/80 rounded-full h-2 mt-3 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${getUsageColor(cpuPct)} transition-all duration-500`}
            style={{ width: `${Math.min(cpuPct, 100)}%` }}
          />
        </div>
      </div>

      {/* RAM Usage Card */}
      <div className="glass-panel rounded-2xl p-5 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
            <Server className="h-4 w-4 text-cyan-400" />
            <span>{t('gauges', 'ram')}</span>
          </div>
          <span className="text-xs text-slate-400">
            {status.memory_used_gb} / {status.memory_total_gb} GB
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">{ramPct}%</span>
          <span className="text-xs text-slate-400">({status.memory_free_gb} GB {t('gauges', 'availableRam').toLowerCase()})</span>
        </div>
        <div className="w-full bg-slate-800/80 rounded-full h-2 mt-3 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${getUsageColor(ramPct)} transition-all duration-500`}
            style={{ width: `${Math.min(ramPct, 100)}%` }}
          />
        </div>
      </div>

      {/* Disk Usage Card */}
      <div className="glass-panel rounded-2xl p-5 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
            <HardDrive className="h-4 w-4 text-emerald-400" />
            <span>{t('gauges', 'disk')}</span>
          </div>
          <span className="text-xs text-slate-400">Drive C:\</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">{diskPct}%</span>
        </div>
        <div className="w-full bg-slate-800/80 rounded-full h-2 mt-3 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${getUsageColor(diskPct)} transition-all duration-500`}
            style={{ width: `${Math.min(diskPct, 100)}%` }}
          />
        </div>
      </div>

      {/* Total Processes Card */}
      <div className="glass-panel rounded-2xl p-5 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
            <Activity className="h-4 w-4 text-amber-400" />
            <span>{t('gauges', 'processes')}</span>
          </div>
          <span className="text-xs text-emerald-400 font-semibold">{t('gauges', 'availableRam')}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">
            {status.total_processes || '--'}
          </span>
          <span className="text-xs text-slate-400">PID</span>
        </div>
        <div className="w-full bg-slate-800/80 rounded-full h-2 mt-3 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
            style={{ width: '100%' }}
          />
        </div>
      </div>

    </div>
  );
}
