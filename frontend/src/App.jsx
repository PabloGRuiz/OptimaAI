import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import SystemGauges from './components/SystemGauges';
import AIDiagnosticPanel from './components/AIDiagnosticPanel';
import ActionList from './components/ActionList';
import CandidateTable from './components/CandidateTable';
import ActivityLogPanel from './components/ActivityLogPanel';
import OllamaStatusBanner from './components/OllamaStatusBanner';
import ProActivationModal from './components/ProActivationModal';
import SmartGameBoostCard from './components/SmartGameBoostCard';
import UpdateModal from './components/UpdateModal';
import { useLanguage } from './i18n/LanguageContext';
import { Play, Zap, RefreshCw, AlertCircle, CheckCircle2, Rocket } from 'lucide-react';

export default function App() {
  const { t } = useLanguage();
  const [systemStatus, setSystemStatus] = useState(null);
  const [models, setModels] = useState([]);
  const [activeModel, setActiveModel] = useState('llama3.2:latest');
  const [snapshot, setSnapshot] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [logs, setLogs] = useState([]);
  const [latestTrimSummary, setLatestTrimSummary] = useState(null);
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [licenseStatus, setLicenseStatus] = useState(null);
  const [detectorStatus, setDetectorStatus] = useState(null);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  
  // Auto-updater state
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  
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

  // 5. Fetch Smart Game Detector status
  const fetchGameDetectorStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/game-detector/status');
      if (res.ok) {
        const data = await res.json();
        setDetectorStatus(data);
      }
    } catch (e) {
      console.warn("Error fetching game detector status:", e);
    }
  }, []);

  // 6. Check for app updates via GitHub releases
  const fetchUpdateInfo = useCallback(async () => {
    try {
      const res = await fetch('/api/system/update/check');
      if (res.ok) {
        const data = await res.json();
        setUpdateInfo(data);
      }
    } catch (e) {
      console.warn("Error checking for updates:", e);
    }
  }, []);

  const handleToggleDetector = async (enabled) => {
    try {
      const res = await fetch('/api/game-detector/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      const data = await res.json();
      setDetectorStatus(data);
      showToast(enabled ? "Centinela de juegos activado." : "Centinela pausado.", 'info');
    } catch (e) {
      showToast("Error al alternar estado del detector.", 'error');
    }
  };

  const handleAddCustomGame = async (name) => {
    try {
      const res = await fetch('/api/game-detector/custom-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      setDetectorStatus(data);
      showToast(`Juego '${name}' añadido a la lista de monitoreo.`, 'success');
    } catch (e) {
      showToast("Error al añadir juego personalizado.", 'error');
    }
  };

  const handleRemoveCustomGame = async (name) => {
    try {
      const res = await fetch(`/api/game-detector/custom-game/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      setDetectorStatus(data);
      showToast(`Juego '${name}' removido.`, 'info');
    } catch (e) {
      showToast("Error al remover juego personalizado.", 'error');
    }
  };

  const handleIgnoreProcess = async (name) => {
    try {
      const res = await fetch('/api/game-detector/ignore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      setDetectorStatus(data);
      showToast(`'${name}' añadido a procesos ignorados. El centinela continuará buscando.`, 'info');
    } catch (e) {
      showToast("Error al ignorar proceso.", 'error');
    }
  };

  const handleUnignoreProcess = async (name) => {
    try {
      const res = await fetch('/api/game-detector/unignore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      setDetectorStatus(data);
      showToast(`'${name}' removido de ignorados.`, 'info');
    } catch (e) {
      showToast("Error al remover proceso ignorado.", 'error');
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchModels();
    fetchOllamaStatus();
    fetchLogs();
    fetchLicenseStatus();
    fetchGameDetectorStatus();
    fetchUpdateInfo();
    const interval = setInterval(() => {
      fetchStatus();
      fetchOllamaStatus();
      fetchGameDetectorStatus();
    }, 3500);

    // Notify backend to cleanly shutdown when window is closed
    const handleUnload = () => {
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/system/shutdown');
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [fetchStatus, fetchModels, fetchOllamaStatus, fetchLogs, fetchLicenseStatus, fetchGameDetectorStatus, fetchUpdateInfo]);


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
    <div className="min-h-screen bg-[#0e0e10] text-[#f3f4f6] flex flex-col">
      
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
        updateInfo={updateInfo}
        onOpenUpdateModal={() => setIsUpdateModalOpen(true)}
        onRefresh={async () => {
          setRefreshing(true);
          await fetchStatus();
          await fetchOllamaStatus();
          await fetchLicenseStatus();
          await fetchUpdateInfo();
          setRefreshing(false);
        }}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-5 space-y-4">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className={`p-3.5 rounded-lg border flex items-center justify-between text-xs transition-all shadow-md ${
            toastMessage.type === 'error'
              ? 'bg-[#18181c] border-[#ef4444]/40 text-[#ef4444]'
              : toastMessage.type === 'success'
              ? 'bg-[#18181c] border-[#107C41]/50 text-[#10d05c]'
              : 'bg-[#18181c] border-[#26262b] text-[#d1d5db]'
          }`}>
            <div className="flex items-center gap-2 font-medium">
              {toastMessage.type === 'error' ? <AlertCircle className="h-4 w-4 text-[#ef4444]" /> : <CheckCircle2 className="h-4 w-4 text-[#10d05c]" />}
              <span>{toastMessage.msg}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-xs opacity-60 hover:opacity-100 text-[#9ca3af]">✕</button>
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

        {/* Smart Game Detection & Auto-Boost Watchdog */}
        <SmartGameBoostCard
          detectorStatus={detectorStatus}
          onToggleDetector={handleToggleDetector}
          onAddCustomGame={handleAddCustomGame}
          onRemoveCustomGame={handleRemoveCustomGame}
          onIgnoreProcess={handleIgnoreProcess}
          onUnignoreProcess={handleUnignoreProcess}
          onOpenProModal={() => setIsProModalOpen(true)}
        />

        {/* Primary Action Controls Bar */}
        <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-[#f3f4f6] flex items-center gap-2">
              <span>{t('diagnostic', 'title')}</span>
              <span className="h-2 w-2 rounded-full bg-[#10d05c] shadow-[0_0_8px_#10d05c]" />
            </h2>
            <p className="text-xs text-[#9ca3af] mt-0.5">
              {t('diagnostic', 'subtitle')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Memory Sweep CTA */}
            <button
              onClick={handleQuickTrimRam}
              disabled={trimmingRam || boostingGame || scanning || diagnosing}
              className="btn-dark-subtle flex items-center gap-2 px-3.5 py-2 text-xs"
              title={t('dashboard', 'quickTrimHelp')}
            >
              <Zap className={`h-3.5 w-3.5 text-[#10d05c] ${trimmingRam ? 'animate-spin' : ''}`} />
              <span>{trimmingRam ? t('dashboard', 'trimming') : t('dashboard', 'quickTrimBtn')}</span>
            </button>

            {/* Game Boost CTA */}
            <button
              onClick={handleGameBoost}
              disabled={boostingGame || trimmingRam || scanning || diagnosing}
              className="btn-xbox-primary flex items-center gap-2 px-4 py-2 text-xs"
              title={t('dashboard', 'gameBoostHelp')}
            >
              <Rocket className={`h-3.5 w-3.5 text-white ${boostingGame ? 'animate-spin' : ''}`} />
              <span>{boostingGame ? t('dashboard', 'boosting') : t('dashboard', 'gameBoostBtn')}</span>
            </button>

            {/* Iniciar Examen Extenso CTA */}
            <button
              onClick={handleStartDeepExam}
              disabled={scanning || diagnosing}
              className="bg-[#1f1f24] hover:bg-[#26262c] text-[#f3f4f6] border border-[#2d2d34] hover:border-[#107C41] flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
            >
              <Play className={`h-3.5 w-3.5 text-[#10d05c] fill-current ${scanning || diagnosing ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
              <span>{scanning ? t('dashboard', 'scanning') : diagnosing ? t('dashboard', 'analyzing') : t('dashboard', 'startExamBtn')}</span>
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
      <footer className="border-t border-[#26262b] py-4 px-6 text-center text-xs text-[#9ca3af]">
        {t('dashboard', 'footer')}
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

      {/* In-App Auto-Updater Modal */}
      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        updateInfo={updateInfo}
      />


    </div>
  );
}
