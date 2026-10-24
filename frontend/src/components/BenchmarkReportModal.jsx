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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-surface-card border border-line-divider rounded-card p-6 shadow-2xl overflow-hidden text-ink-primary">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-btn text-ink-secondary hover:text-ink-primary hover:bg-surface-raised transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-md bg-surface-raised border border-line-subtle flex items-center justify-center shadow-sm text-xbox-light">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-ink-primary tracking-tight">
                {t('benchmark', 'reportTitle', 'Auditoría de Rendimiento & Benchmark')}
              </h2>
              <span className="badge-mono text-[10px]">
                v1.3 PRO
              </span>
            </div>
            <p className="text-xs text-ink-secondary mt-0.5 flex items-center gap-2">
              <span className="font-semibold text-ink-primary">{report.game_name}</span>
              <span className="text-line-divider">•</span>
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <Clock className="h-3 w-3 text-ink-secondary" />
                {minutes}m {seconds}s ({report.total_frames} frames)
              </span>
            </p>
          </div>
        </div>

        {/* Performance Verdict Banner */}
        <div className="mb-4 p-3 rounded-card bg-[#141f17] border border-[#107C41]/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-xbox-light shrink-0" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-xbox-light">
                {t('benchmark', 'verdictLabel', 'Veredicto de Fluidez')}
              </span>
              <p className="text-xs font-bold text-white">
                {report.verdict}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-ink-secondary">
            {report.created_at}
          </span>
        </div>

        {/* Primary Metrics 4-Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
          {/* 1. Average FPS */}
          <div className="p-3 rounded-card bg-surface-ground border border-line-subtle flex flex-col justify-between">
            <span className="text-[11px] text-ink-secondary font-medium flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5 text-xbox-light" /> {t('benchmark', 'avgFps', 'FPS Promedio')}
            </span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black font-mono text-white">
                {report.avg_fps}
              </span>
              <span className="text-[10px] text-ink-secondary font-mono">fps</span>
            </div>
          </div>

          {/* 2. 1% Low FPS */}
          <div className="p-3 rounded-card bg-surface-ground border border-line-subtle flex flex-col justify-between">
            <span className="text-[11px] text-ink-secondary font-medium flex items-center gap-1">
              <Activity className="h-3.5 w-3.5 text-xbox-light" /> {t('benchmark', 'onePercentLow', '1% Low FPS')}
            </span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black font-mono text-xbox-light">
                {report.one_percent_low_fps}
              </span>
              <span className="text-[10px] text-ink-secondary font-mono">fps</span>
            </div>
          </div>

          {/* 3. 0.1% Low FPS */}
          <div className="p-3 rounded-card bg-surface-ground border border-line-subtle flex flex-col justify-between">
            <span className="text-[11px] text-ink-secondary font-medium flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-ink-secondary" /> {t('benchmark', 'zeroOneLow', '0.1% Low FPS')}
            </span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black font-mono text-ink-primary">
                {report.zero_one_percent_low_fps}
              </span>
              <span className="text-[10px] text-ink-secondary font-mono">fps</span>
            </div>
          </div>

          {/* 4. Stutter Rate */}
          <div className="p-3 rounded-card bg-surface-ground border border-line-subtle flex flex-col justify-between">
            <span className="text-[11px] text-ink-secondary font-medium flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-ink-secondary" /> {t('benchmark', 'stutterRate', 'Tasa Stutter')}
            </span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className={`text-2xl font-black font-mono ${report.stutter_rate_pct < 2 ? 'text-xbox-light' : report.stutter_rate_pct < 5 ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`}>
                {report.stutter_rate_pct}%
              </span>
            </div>
          </div>
        </div>

        {/* Peak Hardware Consumption Summary */}
        <div className="p-3.5 rounded-card bg-surface-ground border border-line-subtle mb-5 space-y-2">
          <span className="text-xs font-bold text-ink-primary flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-xbox-light" /> {t('benchmark', 'hardwarePeaks', 'Consumo Pico de Hardware Durante la Sesión')}
          </span>
          <div className="grid grid-cols-3 gap-2.5 text-xs pt-0.5 font-mono">
            <div className="p-2 rounded-card bg-surface-card border border-line-subtle">
              <span className="text-ink-secondary block text-[10px]">Carga Pico GPU</span>
              <span className="text-white font-bold text-xs">{report.max_gpu_usage_pct}%</span>
            </div>
            <div className="p-2 rounded-card bg-surface-card border border-line-subtle">
              <span className="text-ink-secondary block text-[10px]">VRAM Máxima</span>
              <span className="text-white font-bold text-xs">{report.max_vram_gb} GB</span>
            </div>
            <div className="p-2 rounded-card bg-surface-card border border-line-subtle">
              <span className="text-ink-secondary block text-[10px]">CPU del Juego</span>
              <span className="text-white font-bold text-xs">{report.max_cpu_pct}%</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={handleCopy}
            className="btn-dark-subtle px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-xbox-light" /> : <Copy className="h-3.5 w-3.5 text-ink-secondary" />}
            <span>{copied ? t('common', 'copied', '¡Copiado!') : t('benchmark', 'copyResults', 'Copiar Resumen')}</span>
          </button>

          <button
            onClick={onClose}
            className="btn-xbox-primary px-5 py-1.5 text-xs font-bold"
          >
            {t('common', 'close', 'Cerrar')}
          </button>
        </div>

      </div>
    </div>
  );
}
