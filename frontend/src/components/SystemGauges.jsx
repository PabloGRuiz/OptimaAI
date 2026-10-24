import React from 'react';
import { Cpu, Server, HardDrive, Activity } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function SystemGauges({ status }) {
  const { t } = useLanguage();
  if (!status) return null;

  const getBarColor = (pct) => {
    if (pct >= 88) return 'bg-[#ef4444] shadow-[0_0_8px_#ef4444]';
    if (pct >= 70) return 'bg-[#f59e0b]';
    return 'bg-[#107C41]';
  };

  const getTextColor = (pct) => {
    if (pct >= 88) return 'text-[#ef4444]';
    return 'text-[#f3f4f6]';
  };

  const cpuPct = status.cpu_total_percent || 0;
  const ramPct = status.memory_percent || 0;
  const diskPct = status.disk_usage_percent || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      
      {/* CPU Usage Card */}
      <div className="glass-panel p-4 hover:bg-[#202026] hover:border-[#33333b] transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-[#9ca3af] text-xs font-semibold">
            <Cpu className="h-4 w-4 text-[#10d05c]" />
            <span>{t('gauges', 'cpu')}</span>
          </div>
          <span className="text-[11px] font-mono text-[#9ca3af]">{status.cpu_count_logical} {t('gauges', 'cores')}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-extrabold tracking-tight font-mono ${getTextColor(cpuPct)}`}>
            {cpuPct}%
          </span>
        </div>
        <div className="w-full bg-[#121214] border border-[#26262b] rounded-full h-1.5 mt-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full ${getBarColor(cpuPct)} transition-all duration-500`}
            style={{ width: `${Math.min(cpuPct, 100)}%` }}
          />
        </div>
      </div>

      {/* RAM Usage Card */}
      <div className="glass-panel p-4 hover:bg-[#202026] hover:border-[#33333b] transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-[#9ca3af] text-xs font-semibold">
            <Server className="h-4 w-4 text-[#10d05c]" />
            <span>{t('gauges', 'ram')}</span>
          </div>
          <span className="text-[11px] font-mono text-[#9ca3af]">
            {status.memory_used_gb} / {status.memory_total_gb} GB
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-extrabold tracking-tight font-mono ${getTextColor(ramPct)}`}>
            {ramPct}%
          </span>
          <span className="text-[11px] text-[#9ca3af] font-mono">
            ({status.memory_free_gb} GB {t('gauges', 'availableRam').toLowerCase()})
          </span>
        </div>
        <div className="w-full bg-[#121214] border border-[#26262b] rounded-full h-1.5 mt-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full ${getBarColor(ramPct)} transition-all duration-500`}
            style={{ width: `${Math.min(ramPct, 100)}%` }}
          />
        </div>
      </div>

      {/* Disk Usage Card */}
      <div className="glass-panel p-4 hover:bg-[#202026] hover:border-[#33333b] transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-[#9ca3af] text-xs font-semibold">
            <HardDrive className="h-4 w-4 text-[#10d05c]" />
            <span>{t('gauges', 'disk')}</span>
          </div>
          <span className="text-[11px] font-mono text-[#9ca3af]">Drive C:\</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-extrabold tracking-tight font-mono ${getTextColor(diskPct)}`}>
            {diskPct}%
          </span>
        </div>
        <div className="w-full bg-[#121214] border border-[#26262b] rounded-full h-1.5 mt-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full ${getBarColor(diskPct)} transition-all duration-500`}
            style={{ width: `${Math.min(diskPct, 100)}%` }}
          />
        </div>
      </div>

      {/* Total Processes Card */}
      <div className="glass-panel p-4 hover:bg-[#202026] hover:border-[#33333b] transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-[#9ca3af] text-xs font-semibold">
            <Activity className="h-4 w-4 text-[#10d05c]" />
            <span>{t('gauges', 'processes')}</span>
          </div>
          <span className="text-[11px] text-[#10d05c] font-semibold">{t('gauges', 'availableRam')}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold tracking-tight font-mono text-[#f3f4f6]">
            {status.total_processes || '--'}
          </span>
          <span className="text-[11px] text-[#9ca3af]">activos</span>
        </div>
        <div className="w-full bg-[#121214] border border-[#26262b] rounded-full h-1.5 mt-2.5 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#107C41]"
            style={{ width: '100%' }}
          />
        </div>
      </div>

    </div>
  );
}
