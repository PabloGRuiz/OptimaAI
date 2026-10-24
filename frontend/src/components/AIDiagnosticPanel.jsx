import React from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, AlertOctagon, Clock } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function AIDiagnosticPanel({ diagnosis, scanning, diagnosing }) {
  const { t } = useLanguage();

  if (scanning || diagnosing) {
    return (
      <div className="glass-panel p-8 text-center relative overflow-hidden">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="h-14 w-14 rounded-full border-2 border-line-subtle border-t-xbox-core animate-spin" />
            <Sparkles className="h-5 w-5 text-xbox-light absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-ink-primary">
              {scanning ? "Muestreando telemetría diferencial del sistema..." : "Consultando diagnóstico estructurado a Ollama..."}
            </h3>
            <p className="text-xs text-ink-secondary mt-1">
              {scanning
                ? "Calculando deltas de CPU por proceso e inspeccionando árbol de ejecución."
                : "Evaluando anomalías, seguridad del kernel y recomendaciones de optimización."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!diagnosis) {
    return (
      <div className="glass-panel p-8 text-center border-dashed border-line-subtle">
        <div className="h-11 w-11 rounded-md bg-surface-raised border border-line-subtle text-xbox-light flex items-center justify-center mx-auto mb-3 shadow-sm">
          <Sparkles className="h-5 w-5" />
        </div>
        <h3 className="text-base font-semibold text-ink-primary">{t('diagnostic', 'title')}</h3>
        <p className="text-xs text-ink-secondary max-w-md mx-auto mt-1">
          {t('diagnostic', 'subtitle')}
        </p>
      </div>
    );
  }

  const getSafetyBadge = (level) => {
    switch (level) {
      case 'critical':
        return {
          icon: AlertOctagon,
          text: t('diagnostic', 'healthCritical'),
          classes: 'bg-[#261416] text-[#ef4444] border-[#ef4444]/40'
        };
      case 'caution':
        return {
          icon: AlertTriangle,
          text: t('diagnostic', 'healthModerate'),
          classes: 'bg-[#261c14] text-[#f59e0b] border-[#f59e0b]/40'
        };
      default:
        return {
          icon: CheckCircle2,
          text: t('diagnostic', 'healthOptimal'),
          classes: 'bg-[#141f17] text-[#10d05c] border-[#107C41]/50'
        };
    }
  };

  const badge = getSafetyBadge(diagnosis.safety_level);
  const BadgeIcon = badge.icon;

  // Lightweight markdown-to-html renderer
  const renderMarkdown = (text) => {
    if (!text) return '';
    return text
      .split('\n')
      .map((line, idx) => {
        // Headers
        if (line.startsWith('### ')) {
          return <h4 key={idx} className="text-sm font-bold text-ink-primary mt-3.5 mb-1.5">{line.replace('### ', '')}</h4>;
        }
        if (line.startsWith('## ')) {
          return <h3 key={idx} className="text-base font-bold text-ink-primary mt-4 mb-2">{line.replace('## ', '')}</h3>;
        }
        if (line.startsWith('# ')) {
          return <h2 key={idx} className="text-lg font-bold text-ink-primary mt-5 mb-2.5">{line.replace('# ', '')}</h2>;
        }
        // Blockquotes
        if (line.startsWith('> ')) {
          return (
            <div key={idx} className="border-l-2 border-xbox-core bg-surface-ground px-3.5 py-2 my-2 text-xs text-ink-secondary italic rounded-r-md">
              {line.replace('> ', '')}
            </div>
          );
        }
        // Bullet points
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
          const content = line.trim().replace(/^[\*\-]\s+/, '');
          return (
            <li key={idx} className="text-xs text-ink-secondary ml-4 list-disc leading-relaxed">
              {formatInlineStyles(content)}
            </li>
          );
        }
        // Empty lines
        if (!line.trim()) {
          return <div key={idx} className="h-1.5" />;
        }
        // Standard paragraphs
        return (
          <p key={idx} className="text-xs text-ink-secondary leading-relaxed">
            {formatInlineStyles(line)}
          </p>
        );
      });
  };

  const formatInlineStyles = (content) => {
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-ink-primary font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="glass-panel p-5 relative overflow-hidden">
      
      {/* Header of Diagnostic */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-subtle pb-3.5 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md bg-surface-raised border border-line-subtle flex items-center justify-center text-xbox-light">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink-primary">{t('diagnostic', 'analysisSummary')}</h3>
            <p className="text-[11px] text-ink-secondary">
              {diagnosis.is_heuristic ? t('header', 'heuristicMode') : `Ollama (${diagnosis.model_used})`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Latency & Model */}
          <div className="flex items-center gap-1.5 text-[11px] text-ink-secondary bg-surface-ground px-2.5 py-1 rounded-md border border-line-subtle">
            <Clock className="h-3 w-3 text-xbox-light" />
            <span className="font-mono">{diagnosis.inference_time_ms} ms</span>
            <span className="text-line-divider">•</span>
            <span className="text-ink-primary font-mono">{diagnosis.model_used}</span>
          </div>

          {/* Safety Level Badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${badge.classes}`}>
            <BadgeIcon className="h-3.5 w-3.5" />
            <span>{badge.text}</span>
          </div>
        </div>
      </div>

      {/* Markdown Content Body */}
      <div className="space-y-1">
        {renderMarkdown(diagnosis.diagnostic_summary)}
      </div>

    </div>
  );
}
