import React from 'react';
import { useCombiner } from '../../context/CombinerContext';
import { Play, Pause, Globe, Cpu, Network, ShieldCheck, Menu } from 'lucide-react';

export const TopBar: React.FC = () => {
  const {
    lang,
    setLang,
    t,
    isEngineRunning,
    toggleEngine,
    activeThreads,
    proxies,
    tasks,
    setIsMobileDrawerOpen,
    activeModule,
    operatingMode,
    setOperatingMode,
    clearDemoDataAndEnableLive,
  } = useCombiner();

  const aliveProxies = proxies.filter((p) => p.status === 'alive').length;
  const runningTasksCount = tasks.filter((t) => t.status === 'running').length;

  return (
    <header className="h-14 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md px-3 sm:px-5 flex items-center justify-between z-20 shrink-0">
      {/* Zone 1: Hamburger + Wordmark */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Hamburger Drawer Button */}
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="md:hidden p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          title="Меню навігації"
        >
          <Menu className="w-5 h-5" />
        </button>

        <a href="#dashboard" className="text-sm sm:text-base font-semibold tracking-tight text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse"></span>
          <span>UmolkTG</span>
          <span className="hidden sm:inline text-xs font-mono font-normal text-neutral-400">COMBINER</span>
        </a>
        <span className="hidden sm:inline text-neutral-700">/</span>
        <span className="hidden sm:inline text-xs text-neutral-400 font-medium truncate max-w-[200px]">
          Workspace #1 · Production Pool
        </span>
      </div>

      {/* Zone 2: Telemetry indicators (unboxed, clean tabular numerals) */}
      <div className="hidden lg:flex items-center gap-6 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-neutral-500" />
          <span>{t.activeThreads}:</span>
          <span className="font-mono font-medium text-neutral-200 tabular-nums">
            {activeThreads}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Network className="w-3.5 h-3.5 text-neutral-500" />
          <span>{t.proxiesAlive}:</span>
          <span className="font-mono font-medium text-emerald-400 tabular-nums">
            {aliveProxies}/{proxies.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-neutral-500" />
          <span>{t.statsRunningTasks}:</span>
          <span className="font-mono font-medium text-sky-400 tabular-nums">
            {runningTasksCount}
          </span>
        </div>
      </div>

      {/* Zone 3: Primary actions, Mode badge & Language toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Operating Mode Indicator / Switcher */}
        {operatingMode === 'live' ? (
          <button
            onClick={() => setOperatingMode('simulation')}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded text-xs font-medium bg-emerald-950 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/40 transition-colors"
            title="Реальний режим LIVE MTProto активний. Натисніть для перегляду демо-симуляції."
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-[11px] sm:text-xs">LIVE MTProto</span>
          </button>
        ) : (
          <button
            onClick={clearDemoDataAndEnableLive}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded text-xs font-medium bg-amber-950 text-amber-300 border border-amber-800/60 hover:bg-amber-900/50 transition-colors"
            title="Зараз увімкнено демо-симуляцію. Натисніть, щоб очистити демо-дані та перейти у реальний режим (LIVE)!"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span className="font-semibold text-[11px] sm:text-xs">ДЕМО ➔ Увімкнути LIVE</span>
          </button>
        )}

        {/* 3-Language segmented switch (RU / UK / EN) */}
        <div className="flex items-center bg-neutral-800/80 rounded-md p-0.5 border border-neutral-700/50 text-xs">
          <Globe className="w-3.5 h-3.5 text-neutral-400 ml-1.5 mr-1 shrink-0 hidden sm:inline" />
          {(['ru', 'uk', 'en'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold uppercase transition-colors ${
                lang === l
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title={l === 'ru' ? 'Русский' : l === 'uk' ? 'Українська' : 'English'}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Engine Toggle */}
        <button
          onClick={toggleEngine}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
            isEngineRunning
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/60'
              : 'bg-amber-950 text-amber-300 border border-amber-800/60 hover:bg-amber-900/60'
          }`}
        >
          {isEngineRunning ? (
            <>
              <Pause className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{t.simulatingRunning}</span>
              <span className="sm:hidden">Вкл</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current shrink-0" />
              <span className="hidden sm:inline">{t.simulatingPaused}</span>
              <span className="sm:hidden">Пауза</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
