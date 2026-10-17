import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import SystemGauges from './components/SystemGauges';
import AIDiagnosticPanel from './components/AIDiagnosticPanel';
import ActionList from './components/ActionList';
import CandidateTable from './components/CandidateTable';
import ActivityLogPanel from './components/ActivityLogPanel';
import OllamaStatusBanner from './components/OllamaStatusBanner';
import ProActivationModal from './components/ProActivationModal';
import { Play, Zap, RefreshCw, AlertCircle, CheckCircle2, Rocket } from 'lucide-react';

export default function App() {
  const [systemStatus, setSystemStatus] = useState(null);
  const [models, setModels] = useState([]);
  const [activeModel, setActiveModel] = useState('llama3.2:latest');
  const [snapshot, setSnapshot] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [logs, setLogs] = useState([]);
  const [latestTrimSummary, setLatestTrimSummary] = useState(null);
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [licenseStatus, setLicenseStatus] = useState(null);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  
  const [refreshing, setRefreshing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [trimmingRam, setTrimmingRam] = useState(false);
  const [boostingGame, setBoostingGame] = useState(false);
  const [launchingOllama, setLaunchingOllama] = useState(false);
  
  const [executionResult, setExecutionResult] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // 1. Fetch real-time hardware status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/system/status');
      if (res.ok) {
        const data = await res.json();
        setSystemStatus(data);
      }
    } catch (e) {
      console.warn("Error fetching system status:", e);
    }
  }, []);

  // 2. Fetch Ollama background status
  const fetchOllamaStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/ollama/status');
      if (res.ok) {
        const data = await res.json();
        setOllamaStatus(data);
        if (data.models && data.models.length > 0) {
          setModels(data.models);
        }
      }
    } catch (e) {
      console.warn("Error fetching Ollama status:", e);
    }
  }, []);

  // 3. Fetch activity logs
  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.warn("Error fetching logs:", e);
    }
  }, []);

  // 2. Fetch available models from local Ollama
  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch('/api/models');
      if (res.ok) {
        const data = await res.json();
        setModels(data.models || []);
        if (data.active_model) setActiveModel(data.active_model);
      }
    } catch (e) {
      console.warn("Error fetching models:", e);
    }
  }, []);

  // 4. Fetch Pro license status
  const fetchLicenseStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/license/status');
      if (res.ok) {
        const data = await res.json();
        setLicenseStatus(data);
      }
    } catch (e) {
      console.warn("Error fetching license status:", e);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchModels();
    fetchOllamaStatus();
    fetchLogs();
    fetchLicenseStatus();
    const interval = setInterval(() => {
      fetchStatus();
      fetchOllamaStatus();
    }, 3500);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchModels, fetchOllamaStatus, fetchLogs, fetchLicenseStatus]);

  const handleLaunchOllama = async () => {
    setLaunchingOllama(true);
    try {
      const res = await fetch('/api/ollama/launch', { method: 'POST' });
      const data = await res.json();
      showToast(data.message, data.success ? 'success' : 'info');
      setTimeout(fetchOllamaStatus, 2000);
      setTimeout(fetchModels, 2500);
    } catch (e) {
      showToast("Error al invocar inicio de Ollama", 'error');
    } finally {
      setLaunchingOllama(false);
    }
  };

  const handleGameBoost = async () => {
    setBoostingGame(true);
    try {
      const res = await fetch('/api/optimize/game-boost', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLatestTrimSummary(data);
        showToast(data.message, 'success');
        fetchStatus();
        fetchLogs();
      }
    } catch (e) {
      showToast("Error al ejecutar Game Boost", 'error');
    } finally {
      setBoostingGame(false);
    }
  };

  const handleSelectModel = async (newModel) => {
    setActiveModel(newModel);
    try {
      await fetch('/api/models/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: newModel })
      });
      showToast(`Modelo activo actualizado a ${newModel}`, 'success');
    } catch (e) {
      showToast("Error al seleccionar modelo", 'error');
    }
  };

  // 3. Initiate Deep Scan + LLM Diagnosis
  const handleStartDeepExam = async () => {
    setScanning(true);
    setExecutionResult(null);
    try {
      // Step A: Deep scan with delta CPU calculation
      const scanRes = await fetch('/api/scan', { method: 'POST' });
      if (!scanRes.ok) throw new Error("Error en el escaneo profundo");
      const scanData = await scanRes.json();
      setSnapshot(scanData.snapshot);
      setScanning(false);

      // Step B: AI inference with Ollama
      setDiagnosing(true);
      const diagRes = await fetch('/api/diagnose', { method: 'POST' });
      if (!diagRes.ok) throw new Error("Error en la inferencia con Ollama");
      const diagData = await diagRes.json();
      setDiagnosis(diagData);
      showToast("Diagnóstico estructurado completado con éxito", 'success');
    } catch (err) {
      showToast(err.message || "Error durante el análisis", 'error');
    } finally {
      setScanning(false);
      setDiagnosing(false);
      fetchStatus();
      fetchLogs();
    }
  };

  // 4. Quick Memory Sweep (EmptyWorkingSet)
  const handleQuickTrimRam = async () => {
    setTrimmingRam(true);
    try {
      const res = await fetch('/api/optimize/trim-all-ram', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLatestTrimSummary(data);
        showToast(data.message, 'success');
        fetchStatus();
        fetchLogs();
      }
    } catch (e) {
      showToast("Error al vaciar memoria", 'error');
    } finally {
      setTrimmingRam(false);
    }
  };

  // 5. Execute confirmed optimization actions
  const handleExecuteActions = async (actionPayload) => {
    setExecuting(true);
    try {
      const res = await fetch('/api/optimize/execute-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actions: actionPayload })
      });
      if (!res.ok) throw new Error("Fallo al ejecutar optimizaciones");
      const data = await res.json();
      setExecutionResult(data);
      showToast(`Optimizaciones finalizadas: +${data.total_freed_ram_mb} MB liberados`, 'success');
      
      // Update issues list to remove terminated processes
      if (diagnosis?.detected_issues) {
        const succeededPids = new Set(data.results.filter(r => r.success).map(r => r.pid));
        const updatedIssues = diagnosis.detected_issues.filter(i => !succeededPids.has(i.pid));
        setDiagnosis({
          ...diagnosis,
          detected_issues: updatedIssues
        });
      }
      fetchStatus();
      fetchLogs();
    } catch (e) {
      showToast(e.message || "Error al aplicar optimizaciones", 'error');
    } finally {
      setExecuting(false);
    }
  };

  const handleClearLogs = async () => {
    try {
      await fetch('/api/logs', { method: 'DELETE' });
      setLogs([]);
      setLatestTrimSummary(null);
      showToast("Registro de auditoría limpiado", 'info');
    } catch (e) {
      showToast("Error al limpiar registros", 'error');
    }
  };

  const handleRelaunchAdmin = async () => {
    try {
      const res = await fetch('/api/system/relaunch-admin', { method: 'POST' });
      const data = await res.json();
      showToast(data.message, 'info');
    } catch (e) {
      showToast("No se pudo invocar el diálogo UAC", 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col">
      
      {/* Top Navbar */}
      <Header
        systemStatus={systemStatus}
        models={models}
        activeModel={activeModel}
        onSelectModel={handleSelectModel}
        onRelaunchAdmin={handleRelaunchAdmin}
        refreshing={refreshing}
        ollamaStatus={ollamaStatus}
        licenseStatus={licenseStatus}
        onOpenProModal={() => setIsProModalOpen(true)}
        onRefresh={async () => {
          setRefreshing(true);
          await fetchStatus();
          await fetchOllamaStatus();
          await fetchLicenseStatus();
          setRefreshing(false);
        }}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className={`p-4 rounded-xl border flex items-center justify-between text-sm transition-all animate-bounce ${
            toastMessage.type === 'error'
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              : toastMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300'
          }`}>
            <div className="flex items-center gap-2">
              {toastMessage.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              <span>{toastMessage.msg}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-xs opacity-75 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Real-time Hardware Meters */}
        <SystemGauges status={systemStatus} />

        {/* Ollama Status & Native Heuristic Mode Guidance Banner */}
        <OllamaStatusBanner
          ollamaStatus={ollamaStatus}
          onLaunchOllama={handleLaunchOllama}
          launching={launchingOllama}
        />

        {/* Primary Action Controls Bar */}
        <div className="glass-panel rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Optimización & Rendimiento</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspección diferencial de procesos, recorte de páginas inactivas y perfiles de aceleración.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Memory Sweep CTA */}
            <button
              onClick={handleQuickTrimRam}
              disabled={trimmingRam || boostingGame || scanning || diagnosing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/50 shadow-md transition-all disabled:opacity-50"
              title="Aplica EmptyWorkingSet sobre los procesos para liberar RAM sin cerrar aplicaciones"
            >
              <Zap className={`h-4 w-4 ${trimmingRam ? 'animate-spin' : ''}`} />
              <span>{trimmingRam ? "Vaciando RAM..." : "Optimizar Memoria RAM"}</span>
            </button>

            {/* Game Boost CTA */}
            <button
              onClick={handleGameBoost}
              disabled={boostingGame || trimmingRam || scanning || diagnosing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-700 via-indigo-600 to-amber-500 hover:from-purple-600 hover:to-amber-400 text-white shadow-lg shadow-purple-900/30 transition-all disabled:opacity-50"
              title="Vaciado de memoria física y reducción de prioridad CPU en aplicaciones secundarias para maximizar FPS en juegos"
            >
              <Rocket className={`h-4 w-4 ${boostingGame ? 'animate-spin' : ''}`} />
              <span>{boostingGame ? "Aplicando Boost..." : "🚀 Game Boost"}</span>
            </button>

            {/* Iniciar Examen Extenso CTA */}
            <button
              onClick={handleStartDeepExam}
              disabled={scanning || diagnosing}
              className="flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-xl shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <Play className={`h-4 w-4 fill-current ${scanning || diagnosing ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
              <span>{scanning ? "Escaneando..." : diagnosing ? "Analizando..." : "Iniciar Examen Extenso"}</span>
            </button>
          </div>
        </div>

        {/* AI Diagnostic Summary Card */}
        <AIDiagnosticPanel
          diagnosis={diagnosis}
          scanning={scanning}
          diagnosing={diagnosing}
        />

        {/* Actionable Detected Issues List with Execution */}
        {diagnosis?.detected_issues && (
          <ActionList
            issues={diagnosis.detected_issues}
            onExecuteActions={handleExecuteActions}
            executing={executing}
            executionResult={executionResult}
          />
        )}

        {/* Real-time Activity, Optimization & Security Decision Log */}
        <ActivityLogPanel
          logs={logs}
          onClearLogs={handleClearLogs}
          latestTrimSummary={latestTrimSummary}
        />

        {/* Candidate Processes Table */}
        <CandidateTable
          candidates={snapshot?.top_candidates}
        />

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-4 px-6 text-center text-xs text-slate-400">
        OptimaAI System Optimizer • Powered by Ollama Local LLMs • Safe List Enforced
      </footer>

      {/* Pro Activation & Patreon Modal */}
      <ProActivationModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
        licenseStatus={licenseStatus}
        onActivateSuccess={(status) => {
          setLicenseStatus(status);
          showToast(`¡OptimaAI Pro Activado para ${status.holder}! 👑`, 'success');
        }}
        onDeactivateSuccess={(status) => {
          setLicenseStatus(status);
          showToast("Licencia Pro desactivada.", 'info');
        }}
      />

    </div>
  );
}
