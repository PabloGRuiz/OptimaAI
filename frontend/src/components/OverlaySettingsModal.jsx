import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Monitor,
  Move,
  Keyboard,
  Volume2,
  VolumeX,
  Palette,
  Maximize2,
  Minimize2,
  Check,
  Sparkles,
  Sliders
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function OverlaySettingsModal({
  isOpen,
  onClose,
  currentConfig,
  onSave
}) {
  const { t } = useLanguage();

  const screenWidth = currentConfig?.screen_width || 1920;
  const screenHeight = currentConfig?.screen_height || 1080;
  const refreshRate = currentConfig?.refresh_rate || 60;

  // Local state for configuration
  const [position, setPosition] = useState('top-right');
  const [posX, setPosX] = useState(null);
  const [posY, setPosY] = useState(null);
  const [theme, setTheme] = useState('cyan');
  const [layout, setLayout] = useState('full');
  const [overlayHotkey, setOverlayHotkey] = useState('F10');
  const [benchmarkHotkey, setBenchmarkHotkey] = useState('F11');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [isDragging, setIsDragging] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const screenBoxRef = useRef(null);

  // Sync state on open
  useEffect(() => {
    if (isOpen && currentConfig) {
      setPosition(currentConfig.overlay_position || currentConfig.position || 'top-right');
      setPosX(currentConfig.overlay_pos_x !== undefined ? currentConfig.overlay_pos_x : currentConfig.pos_x);
      setPosY(currentConfig.overlay_pos_y !== undefined ? currentConfig.overlay_pos_y : currentConfig.pos_y);
      setTheme(currentConfig.overlay_theme || currentConfig.theme || 'cyan');
      setLayout(currentConfig.overlay_layout || currentConfig.layout || 'full');
      setOverlayHotkey(currentConfig.overlay_hotkey || 'F10');
      setBenchmarkHotkey(currentConfig.benchmark_hotkey || 'F11');
      setSoundEnabled(currentConfig.sound_enabled !== undefined ? currentConfig.sound_enabled : true);
      setSavedSuccess(false);
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  // Virtual monitor dimensions (fixed preview width 500px, proportional height)
  const previewWidth = 500;
  const aspectRatio = screenHeight / screenWidth;
  const previewHeight = Math.max(Math.round(previewWidth * aspectRatio), 240);

  // Miniature card preview dimensions scaled
  const cardScale = previewWidth / screenWidth;
  const cardPixelWidth = layout === 'compact' ? 280 : 460;
  const cardPixelHeight = layout === 'compact' ? 42 : 62;
  const miniCardWidth = Math.max(Math.round(cardPixelWidth * cardScale * 1.6), 90);
  const miniCardHeight = Math.max(Math.round(cardPixelHeight * cardScale * 1.6), 26);

  // Calculate position in virtual monitor
  let displayLeft = 0;
  let displayTop = 0;

  if (posX !== null && posY !== null) {
    displayLeft = Math.round((posX / screenWidth) * (previewWidth - miniCardWidth));
    displayTop = Math.round((posY / screenHeight) * (previewHeight - miniCardHeight));
  } else {
    // Preset anchors
    const margin = 12;
    if (position === 'top-left') {
      displayLeft = margin;
      displayTop = margin;
    } else if (position === 'top-center') {
      displayLeft = (previewWidth - miniCardWidth) / 2;
      displayTop = margin;
    } else if (position === 'top-right') {
      displayLeft = previewWidth - miniCardWidth - margin;
      displayTop = margin;
    } else if (position === 'bottom-left') {
      displayLeft = margin;
      displayTop = previewHeight - miniCardHeight - margin;
    } else if (position === 'bottom-center') {
      displayLeft = (previewWidth - miniCardWidth) / 2;
      displayTop = previewHeight - miniCardHeight - margin;
    } else {
      // bottom-right
      displayLeft = previewWidth - miniCardWidth - margin;
      displayTop = previewHeight - miniCardHeight - margin;
    }
  }

  // Handle Dragging
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);

    const box = screenBoxRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialLeft = displayLeft;
    const initialTop = displayTop;

    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newLeft = Math.max(0, Math.min(initialLeft + deltaX, previewWidth - miniCardWidth));
      let newTop = Math.max(0, Math.min(initialTop + deltaY, previewHeight - miniCardHeight));

      // Translate to real physical native resolution
      const realX = Math.round((newLeft / (previewWidth - miniCardWidth)) * (screenWidth - cardPixelWidth));
      const realY = Math.round((newTop / (previewHeight - miniCardHeight)) * (screenHeight - cardPixelHeight));

      setPosX(realX);
      setPosY(realY);
      setPosition('custom');
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleSnap = (anchor) => {
    setPosition(anchor);
    setPosX(null);
    setPosY(null);
  };

  const handleApply = async () => {
    const payload = {
      position,
      pos_x: posX,
      pos_y: posY,
      theme,
      layout,
      overlay_hotkey: overlayHotkey,
      benchmark_hotkey: benchmarkHotkey,
      sound_enabled: soundEnabled
    };
    if (onSave) {
      await onSave(payload);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    }
  };

  // Theme accent colors for virtual card
  const themeColors = {
    cyan: { bg: 'bg-[#0b132b]', border: 'border-cyan-400', text: 'text-cyan-400' },
    cyberpunk: { bg: 'bg-[#051a14]', border: 'border-emerald-400', text: 'text-emerald-400' },
    violet: { bg: 'bg-[#170f2e]', border: 'border-purple-400', text: 'text-purple-400' },
    stealth: { bg: 'bg-[#111827]', border: 'border-slate-400', text: 'text-slate-300' }
  };
  const activeThemeColor = themeColors[theme] || themeColors.cyan;

  const hotkeyOptions = ['F7', 'F8', 'F9', 'F10', 'F11', 'F12'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in text-slate-100">
      <div className="relative w-full max-w-2xl bg-gradient-to-br from-slate-900/98 via-[#0b101e]/98 to-slate-900/98 border border-indigo-500/40 rounded-3xl p-6 shadow-2xl shadow-indigo-500/20 max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Glow backdrop */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sliders className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {t('overlaySettings', 'modalTitle', 'Personalizar Posición & Atajos del HUD')}
              </h2>
              <p className="text-xs text-slate-400">
                {t('overlaySettings', 'modalSubtitle', 'Arrastra el overlay en tu pantalla interactiva o elige anclajes rápidos')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">

          {/* Screen Resolution Badge */}
          <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-cyan-400" />
              <span className="text-slate-300 font-medium">
                {t('overlaySettings', 'displayInfo', 'Monitor Principal Detectado')}:
              </span>
              <span className="font-mono font-bold text-cyan-300">
                {screenWidth} × {screenHeight} @ {refreshRate}Hz
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Ratio {screenWidth}:{screenHeight}
            </span>
          </div>

          {/* VIRTUAL MONITOR VIEWPORT (INTERACTIVE DRAGGABLE CANVAS) */}
          <div className="flex flex-col items-center">
            <div className="text-center mb-2">
              <span className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
                <Move className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                {t('overlaySettings', 'dragHelp', 'Haz clic y arrastra el recuadro dentro del monitor para ubicarlo donde prefieras')}
              </span>
            </div>

            {/* Monitor Outer Frame & Bezel */}
            <div className="relative p-2.5 rounded-2xl bg-gradient-to-b from-slate-800 via-slate-850 to-slate-900 border-2 border-slate-700 shadow-2xl">
              
              {/* Webcam dot */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-slate-600" />

              {/* Monitor Screen Glass */}
              <div
                ref={screenBoxRef}
                style={{ width: `${previewWidth}px`, height: `${previewHeight}px` }}
                className="relative bg-gradient-to-br from-[#070b14] via-[#0d1629] to-[#080d1a] rounded-lg overflow-hidden border border-slate-700/80 shadow-inner select-none cursor-crosshair"
              >
                {/* Subtle desktop grid pattern */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

                {/* Draggable HUD Card Preview */}
                <div
                  onMouseDown={handleMouseDown}
                  style={{
                    position: 'absolute',
                    left: `${displayLeft}px`,
                    top: `${displayTop}px`,
                    width: `${miniCardWidth}px`,
                    height: `${miniCardHeight}px`
                  }}
                  className={`rounded-lg border-2 shadow-xl cursor-grab active:cursor-grabbing transition-shadow flex items-center justify-between px-2 text-[9px] font-mono select-none ${
                    activeThemeColor.bg
                  } ${activeThemeColor.border} ${
                    isDragging ? 'ring-2 ring-indigo-400 shadow-indigo-500/50 scale-105' : ''
                  }`}
                >
                  <div className="flex items-center gap-1 overflow-hidden">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className={`font-bold ${activeThemeColor.text}`}>FPS: {refreshRate}</span>
                  </div>
                  {layout === 'full' && (
                    <span className="text-slate-400 text-[8px]">1%: {Math.round(refreshRate * 0.75)}</span>
                  )}
                </div>

                {/* Quick Anchor Target Markers */}
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2">
                  <div className="flex justify-between">
                    <span className="h-2 w-2 rounded-full border border-dashed border-slate-600/50" />
                    <span className="h-2 w-2 rounded-full border border-dashed border-slate-600/50" />
                    <span className="h-2 w-2 rounded-full border border-dashed border-slate-600/50" />
                  </div>
                  <div className="flex justify-between">
                    <span className="h-2 w-2 rounded-full border border-dashed border-slate-600/50" />
                    <span className="h-2 w-2 rounded-full border border-dashed border-slate-600/50" />
                    <span className="h-2 w-2 rounded-full border border-dashed border-slate-600/50" />
                  </div>
                </div>
              </div>

              {/* Monitor Stand */}
              <div className="mx-auto w-16 h-3 bg-gradient-to-b from-slate-700 to-slate-800 -mb-2 rounded-b-md" />
              <div className="mx-auto w-28 h-1.5 bg-slate-800 rounded-full mt-2" />
            </div>

            {/* Position Readout Coordinates */}
            <div className="mt-3 flex items-center gap-4 text-xs font-mono text-slate-400">
              <span className="text-cyan-400 font-bold">
                {position === 'custom'
                  ? `Posición Manual: X = ${posX !== null ? posX : 0}px, Y = ${posY !== null ? posY : 0}px`
                  : `Anclaje Automático: ${position.toUpperCase()}`}
              </span>
            </div>
          </div>

          {/* QUICK SNAP PRESET BUTTONS */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">
              {t('overlaySettings', 'snapTitle', 'Anclajes Rápidos')}
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <button
                onClick={() => handleSnap('top-left')}
                className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-all ${
                  position === 'top-left'
                    ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                ↖ {t('overlaySettings', 'snapTopLeft', 'Sup-Izq')}
              </button>
              <button
                onClick={() => handleSnap('top-center')}
                className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-all ${
                  position === 'top-center'
                    ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                ⬆ {t('overlaySettings', 'snapTopCenter', 'Sup-Centro')}
              </button>
              <button
                onClick={() => handleSnap('top-right')}
                className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-all ${
                  position === 'top-right'
                    ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                ↗ {t('overlaySettings', 'snapTopRight', 'Sup-Der')}
              </button>
              <button
                onClick={() => handleSnap('bottom-left')}
                className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-all ${
                  position === 'bottom-left'
                    ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                ↙ {t('overlaySettings', 'snapBottomLeft', 'Inf-Izq')}
              </button>
              <button
                onClick={() => handleSnap('bottom-center')}
                className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-all ${
                  position === 'bottom-center'
                    ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                ⬇ {t('overlaySettings', 'snapBottomCenter', 'Inf-Centro')}
              </button>
              <button
                onClick={() => handleSnap('bottom-right')}
                className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-all ${
                  position === 'bottom-right'
                    ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                ↘ {t('overlaySettings', 'snapBottomRight', 'Inf-Der')}
              </button>
            </div>
          </div>

          {/* HOTKEYS CONFIGURATION */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <Keyboard className="h-4 w-4 text-purple-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                {t('overlaySettings', 'hotkeysTitle', 'Atajos de Teclado Globales (En el Juego)')}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Overlay Toggle Key */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-300">
                  {t('overlaySettings', 'hotkeyOverlay', 'Atajo Mostrar/Ocultar HUD')}
                </span>
                <select
                  value={overlayHotkey}
                  onChange={(e) => setOverlayHotkey(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-indigo-400 focus:outline-none focus:border-indigo-500"
                >
                  {hotkeyOptions.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              {/* Benchmark Toggle Key */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-300">
                  {t('overlaySettings', 'hotkeyBenchmark', 'Atajo Iniciar/Detener Benchmark')}
                </span>
                <select
                  value={benchmarkHotkey}
                  onChange={(e) => setBenchmarkHotkey(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-yellow-400 focus:outline-none focus:border-indigo-500"
                >
                  {hotkeyOptions.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sound confirmation toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <VolumeX className="h-4 w-4 text-slate-500" />
                )}
                <div>
                  <span className="text-xs font-medium text-slate-300">
                    {t('overlaySettings', 'soundTone', 'Confirmación Sonora por Tono (Beep)')}
                  </span>
                  <p className="text-[10px] text-slate-500">
                    {t('overlaySettings', 'soundToneHelp', 'Emite un sutil beep de confirmación al presionar los atajos')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  soundEnabled ? 'bg-indigo-600' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    soundEnabled ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* THEME & LAYOUT SELECTORS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Theme */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <Palette className="h-3.5 w-3.5 text-cyan-400" />
                <span>{t('overlaySettings', 'themeTitle', 'Tema de Color Neón')}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTheme('cyberpunk')}
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
                    theme === 'cyberpunk'
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> Cyberpunk
                </button>
                <button
                  onClick={() => setTheme('cyan')}
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
                    theme === 'cyan'
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-cyan-400" /> Cyan Tech
                </button>
                <button
                  onClick={() => setTheme('violet')}
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
                    theme === 'violet'
                      ? 'bg-purple-950/60 border-purple-500 text-purple-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-purple-400" /> Violet Gamer
                </button>
                <button
                  onClick={() => setTheme('stealth')}
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
                    theme === 'stealth'
                      ? 'bg-slate-800 border-slate-400 text-slate-100 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-slate-400" /> Stealth
                </button>
              </div>
            </div>

            {/* Layout Mode */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <Maximize2 className="h-3.5 w-3.5 text-indigo-400" />
                <span>{t('overlaySettings', 'layoutTitle', 'Modo de Presentación')}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setLayout('full')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                    layout === 'full'
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <Maximize2 className="h-3 w-3" />
                  <span>{t('overlaySettings', 'layoutFull', 'Completo')}</span>
                </button>
                <button
                  onClick={() => setLayout('compact')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                    layout === 'compact'
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <Minimize2 className="h-3 w-3" />
                  <span>{t('overlaySettings', 'layoutMini', 'Mini')}</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <div>
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <Check className="h-3.5 w-3.5" />
                {t('overlaySettings', 'appliedSuccess', '¡Configuración guardada!')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t('overlaySettings', 'applyBtn', 'Guardar & Aplicar en Pantalla')}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
