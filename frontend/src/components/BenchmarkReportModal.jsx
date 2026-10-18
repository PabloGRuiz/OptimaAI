import React, { useState } from 'react';
import {
  Trophy,
  X,
  Copy,
  Check,
  Activity,
  Flame,
  Layers,
  Cpu,
  Clock,
  Sparkles,
  Zap,
  Gauge,
  AlertTriangle
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function BenchmarkReportModal({ isOpen, onClose, report }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !report) return null;

  const handleCopy = () => {
    const text = `📊 [OptimaAI Benchmark Pro Report]
🎮 Juego: ${report.game_name}
⏱️ Duración: ${report.duration_seconds}s (${report.total_frames} frames)
🚀 FPS Promedio: ${report.avg_fps} FPS
🎯 1% Low FPS: ${report.one_percent_low_fps} FPS
📉 0.1% Low FPS: ${report.zero_one_percent_low_fps} FPS
⚠️ Tasa de Stutter: ${report.stutter_rate_pct}%
🔥 GPU Máxima: ${report.max_gpu_usage_pct}% | VRAM: ${report.max_vram_gb} GB
💡 Veredicto: ${report.verdict}
Generado con OptimaAI System Optimizer`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const minutes = Math.floor(report.duration_seconds / 60);
  const seconds = Math.floor(report.duration_seconds % 60);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-gradient-to-br from-slate-900/98 via-[#0b101d]/98 to-slate-900/98 border border-indigo-500/40 rounded-3xl p-6 shadow-2xl shadow-indigo-500/20 overflow-hidden text-slate-100">
        
        {/* Glow ambient background accents */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Trophy className="h-6 w-6 text-slate-950 font-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-white tracking-tight">
                {t('benchmark', 'reportTitle', 'Auditoría de Rendimiento & Benchmark')}
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                v1.3 PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span className="font-semibold text-cyan-300">{report.game_name}</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono">
                <Clock className="h-3 w-3 text-slate-400" />
                {minutes}m {seconds}s ({report.total_frames} frames)
              </span>
            </p>
          </div>
        </div>

        {/* Performance Verdict Banner */}
        <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-indigo-500/15 to-purple-500/15 border border-emerald-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                {t('benchmark', 'verdictLabel', 'Veredicto de Fluidez')}
              </span>
              <p className="text-sm font-extrabold text-white">
                {report.verdict}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {report.created_at}
          </span>
        </div>

        {/* Primary Metrics 4-Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {/* 1. Average FPS */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-indigo-500/30 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5 text-indigo-400" /> {t('benchmark', 'avgFps', 'FPS Promedio')}
            </span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black font-mono text-indigo-300">
                {report.avg_fps}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">fps</span>
            </div>
          </div>

          {/* 2. 1% Low FPS */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-cyan-500/30 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
              <Activity className="h-3.5 w-3.5 text-cyan-400" /> {t('benchmark', 'onePercentLow', '1% Low FPS')}
            </span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black font-mono text-cyan-300">
                {report.one_percent_low_fps}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">fps</span>
            </div>
          </div>

          {/* 3. 0.1% Low FPS */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-purple-500/30 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-purple-400" /> {t('benchmark', 'zeroOneLow', '0.1% Low FPS')}
            </span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black font-mono text-purple-300">
                {report.zero_one_percent_low_fps}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">fps</span>
            </div>
          </div>

          {/* 4. Stutter Rate */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-rose-500/30 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" /> {t('benchmark', 'stutterRate', 'Tasa Stutter')}
            </span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className={`text-2xl font-black font-mono ${report.stutter_rate_pct < 2 ? 'text-emerald-400' : report.stutter_rate_pct < 5 ? 'text-amber-400' : 'text-rose-400'}`}>
                {report.stutter_rate_pct}%
              </span>
            </div>
          </div>
        </div>

        {/* Peak Hardware Consumption Summary */}
        <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 mb-6 space-y-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-amber-400" /> {t('benchmark', 'hardwarePeaks', 'Consumo Pico de Hardware Durante la Sesión')}
          </span>
          <div className="grid grid-cols-3 gap-3 text-xs pt-1 font-mono">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Carga Pico GPU</span>
              <span className="text-cyan-400 font-bold text-sm">{report.max_gpu_usage_pct}%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">VRAM Máxima</span>
              <span className="text-purple-400 font-bold text-sm">{report.max_vram_gb} GB</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">CPU del Juego</span>
              <span className="text-rose-400 font-bold text-sm">{report.max_cpu_pct}%</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-2 border border-slate-700 transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-slate-400" />}
            <span>{copied ? t('common', 'copied', '¡Copiado!') : t('benchmark', 'copyResults', 'Copiar Resumen')}</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-lg shadow-indigo-600/25 transition-all"
          >
            {t('common', 'close', 'Cerrar')}
          </button>
        </div>

      </div>
    </div>
  );
}
