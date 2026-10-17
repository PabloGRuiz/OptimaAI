import React, { useState } from 'react';
import { Crown, Sparkles, CheckCircle2, AlertCircle, X, ExternalLink, Key, ShieldCheck, Heart } from 'lucide-react';

export default function ProActivationModal({ isOpen, onClose, licenseStatus, onActivateSuccess, onDeactivateSuccess }) {
  if (!isOpen) return null;

  const [inputKey, setInputKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isPro = licenseStatus?.is_pro;

  const handleActivate = async (e) => {
    e.preventDefault();
    if (!inputKey.trim()) {
      setErrorMsg('Por favor ingresa una clave válida.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const resp = await fetch('http://127.0.0.1:8765/api/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: inputKey.trim().toUpperCase() }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.detail || 'Clave no válida o firma incorrecta.');
      }

      setSuccessMsg(`¡Licencia Pro activada para ${data.holder}!`);
      if (onActivateSuccess) onActivateSuccess(data);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      setErrorMsg(err.message || 'Error al validar la licencia.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm('¿Seguro que deseas desactivar la versión Pro en este equipo?')) return;
    setLoading(true);
    try {
      const resp = await fetch('http://127.0.0.1:8765/api/license/deactivate', { method: 'POST' });
      const data = await resp.json();
      if (onDeactivateSuccess) onDeactivateSuccess(data);
      onClose();
    } catch (err) {
      setErrorMsg('No se pudo desactivar la licencia.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900/95 border border-amber-500/30 rounded-2xl p-6 shadow-2xl shadow-amber-500/10 overflow-hidden text-slate-100">
        
        {/* Background glow effects */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-amber-500/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-tr from-indigo-500/20 to-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Crown className="h-6 w-6 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">OptimaAI PRO</h2>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Patreon Edition
              </span>
            </div>
            <p className="text-xs text-slate-400">Automatización, centinela en segundo plano y máximo rendimiento</p>
          </div>
        </div>

        {/* IF ALREADY PRO */}
        {isPro ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-200">¡Tu licencia Pro está activa y validada!</p>
                <p className="text-xs text-emerald-400/80 mt-1">
                  Titular: <span className="font-bold text-white">{licenseStatus.holder}</span> ({licenseStatus.tier.toUpperCase()})
                </p>
                {licenseStatus.activated_at && (
                  <p className="text-[11px] text-slate-400 mt-0.5">Activada el: {licenseStatus.activated_at}</p>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 space-y-1.5">
              <p className="font-medium text-slate-200">Beneficios activos en este equipo:</p>
              <div className="flex items-center gap-2 text-slate-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Smart Game Boost automático</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Modo Centinela en segundo plano</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Soporte prioritario y acceso anticipado</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                onClick={handleDeactivate}
                disabled={loading}
                className="px-3.5 py-2 text-xs font-medium rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
              >
                Desactivar Licencia
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          /* IF FREE USER (ACTIVATION FORM) */
          <div className="space-y-4">
            
            {/* Features Highlight */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                <span>HUD Overlay In-Game</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>Auto-Boost de Juegos</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center gap-2">
                <Key className="h-4 w-4 text-purple-400 shrink-0" />
                <span>Prioridad CPU Alta</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-400 shrink-0" />
                <span>Soporte Prioritario</span>
              </div>
            </div>

            {/* Patreon Callout */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-500/20 flex items-center justify-between gap-3">
              <div className="text-xs">
                <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 text-rose-400 fill-rose-400" /> ¿Aún no tienes tu clave?
                </p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Apoya el proyecto en Patreon o pídele una clave de prueba al desarrollador.
                </p>
              </div>
              <a
                href="https://patreon.com/Reselec"
                target="_blank"
                rel="noreferrer"
                className="shrink-0 px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-semibold text-xs flex items-center gap-1 shadow-md shadow-rose-500/20 transition-all"
              >
                <span>Patreon</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Key Input Form */}
            <form onSubmit={handleActivate} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-amber-400" /> Ingresa tu Clave de Licencia:
                </label>
                <input
                  type="text"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value.toUpperCase())}
                  placeholder="OPRO-NOMBRE-XXXX-XXXX-XXXX"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm font-mono tracking-wider text-amber-200 placeholder:text-slate-600 transition-colors"
                />
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Success Alert */}
              {successMsg && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  <span>Activar OptimaAI PRO</span>
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
