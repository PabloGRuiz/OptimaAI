import React from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, AlertOctagon, Clock } from 'lucide-react';

export default function AIDiagnosticPanel({ diagnosis, scanning, diagnosing }) {
  if (scanning || diagnosing) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center relative overflow-hidden">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <Sparkles className="h-6 w-6 text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {scanning ? "Muestreando telemetría diferencial del sistema..." : "Consultando diagnóstico estructurado a Ollama..."}
            </h3>
            <p className="text-sm text-slate-400 mt-1">
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
      <div className="glass-panel rounded-2xl p-8 text-center border-dashed border-slate-700/60">
        <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-3">
          <Sparkles className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-white">Examen del Sistema Pendiente</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
          Inicia un examen extenso para que el modelo local de Ollama evalúe en tiempo real los procesos anómalos y recomiende acciones de optimización.
        </p>
      </div>
    );
  }

  const getSafetyBadge = (level) => {
    switch (level) {
      case 'critical':
        return {
          icon: AlertOctagon,
          text: 'Crítico / Anomalía Alta',
          classes: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
        };
      case 'caution':
        return {
          icon: AlertTriangle,
          text: 'Precaución / Consumo Elevado',
          classes: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
        };
      default:
        return {
          icon: CheckCircle2,
          text: 'Seguro / Rendimiento Estable',
          classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
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
          return <h4 key={idx} className="text-base font-bold text-white mt-4 mb-2">{line.replace('### ', '')}</h4>;
        }
        if (line.startsWith('## ')) {
          return <h3 key={idx} className="text-lg font-bold text-white mt-5 mb-2">{line.replace('## ', '')}</h3>;
        }
        if (line.startsWith('# ')) {
          return <h2 key={idx} className="text-xl font-bold text-white mt-6 mb-3">{line.replace('# ', '')}</h2>;
        }
        // Blockquotes
        if (line.startsWith('> ')) {
          return (
            <div key={idx} className="border-l-4 border-indigo-500 bg-slate-800/40 px-4 py-2 my-2 text-sm text-slate-300 italic rounded-r">
              {line.replace('> ', '')}
            </div>
          );
        }
        // Bullet points
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
          const content = line.trim().replace(/^[\*\-]\s+/, '');
          return (
            <li key={idx} className="text-sm text-slate-300 ml-5 list-disc leading-relaxed">
              {formatInlineStyles(content)}
            </li>
          );
        }
        // Empty lines
        if (!line.trim()) {
          return <div key={idx} className="h-2" />;
        }
        // Standard paragraphs
        return (
          <p key={idx} className="text-sm text-slate-300 leading-relaxed">
            {formatInlineStyles(line)}
          </p>
        );
      });
  };

  const formatInlineStyles = (content) => {
    // Basic bold **text** replacement
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
      
      {/* Header of Diagnostic */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Diagnóstico del Modelo Local</h3>
            <p className="text-xs text-slate-400">Generado mediante inferencia estructurada en tiempo real</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Latency & Model */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-md border border-slate-800">
            <Clock className="h-3 w-3 text-cyan-400" />
            <span>{diagnosis.inference_time_ms} ms</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300 font-mono">{diagnosis.model_used}</span>
          </div>

          {/* Safety Level Badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.classes}`}>
            <BadgeIcon className="h-3.5 w-3.5" />
            <span>{badge.text}</span>
          </div>
        </div>
      </div>

      {/* Markdown Content Body */}
      <div className="prose prose-invert max-w-none space-y-1">
        {renderMarkdown(diagnosis.diagnostic_summary)}
      </div>

    </div>
  );
}
