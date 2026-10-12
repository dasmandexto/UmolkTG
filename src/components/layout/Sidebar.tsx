import React from 'react';
import { useCombiner } from '../../context/CombinerContext';
import {
  LayoutDashboard,
  Users,
  Search,
  Send,
  UserPlus,
  Flame,
  ArrowRightLeft,
  PhoneCall,
  Radio,
  ListTodo,
  Terminal,
  Settings,
  X,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeModule,
    setActiveModule,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    t,
    accounts,
    proxies,
    tasks,
    logs,
  } = useCombiner();

  const runningTasksCount = tasks.filter((t) => t.status === 'running').length;
  const aliveAccounts = accounts.filter((a) => a.status === 'active').length;

  const navItems = [
    {
      id: 'dashboard',
      label: t.navOverview,
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'accounts',
      label: t.navAccounts,
      icon: Users,
      badge: `${aliveAccounts}/${accounts.length}`,
    },
    {
      id: 'parser',
      label: t.navParser,
      icon: Search,
      badge: null,
    },
    {
      id: 'sender',
      label: t.navSender,
      icon: Send,
      badge: null,
    },
    {
      id: 'inviter',
      label: t.navInviter,
      icon: UserPlus,
      badge: null,
    },
    {
      id: 'warmup',
      label: t.navWarmup,
      icon: Flame,
      badge: null,
    },
    {
      id: 'converter',
      label: t.navConverter,
      icon: ArrowRightLeft,
      badge: null,
    },
    {
      id: 'dialer',
      label: t.navDialer,
      icon: PhoneCall,
      badge: null,
    },
    {
      id: 'proxies',
      label: t.navProxies,
      icon: Radio,
      badge: `${proxies.length}`,
    },
    {
      id: 'tasks',
      label: t.navTasks,
      icon: ListTodo,
      badge: runningTasksCount > 0 ? `${runningTasksCount}` : null,
      highlightBadge: runningTasksCount > 0,
    },
    {
      id: 'logs',
      label: t.navLogs,
      icon: Terminal,
      badge: `${logs.length}`,
    },
    {
      id: 'settings',
      label: t.navSettings,
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex md:w-64 bg-neutral-900 border-r border-neutral-800 flex-col shrink-0 select-none">
        {/* Workspace branding info */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-neutral-200">
              UmolkTG Automation
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              Telegram Marketing Engine
            </div>
          </div>
          <span className="text-[10px] font-mono text-sky-400 font-medium">
            v4.2 CORE
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded transition-colors text-left ${
                  isActive
                    ? 'bg-neutral-800 text-sky-400 font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-sky-400' : 'text-neutral-500'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`font-mono text-[11px] tabular-nums shrink-0 ml-2 ${
                      item.highlightBadge
                        ? 'text-sky-400 font-bold'
                        : 'text-neutral-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer System Status */}
        <div className="p-4 border-t border-neutral-800 text-[11px] text-neutral-400 space-y-1.5">
          <div className="flex items-center justify-between">
            <span>Core Protocol:</span>
            <span className="font-mono text-neutral-300">MTProto Layer 182</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Client Spoof:</span>
            <span className="font-mono text-neutral-300">TDesktop 4.16</span>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Overlay (< md screens) */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileDrawerOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] bg-neutral-900 border-r border-neutral-800 h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-200 select-none">
            {/* Header */}
            <div className="px-4 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse"></span>
                <div>
                  <div className="text-sm font-semibold text-white">
                    UmolkTG
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    {t.mobileNavTitle}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                title={t.closeMenu}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
              <div className="text-[10px] uppercase font-semibold text-neutral-500 px-3 py-1 tracking-wider">
                {t.systemModules}
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveModule(item.id);
                      setIsMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 min-h-[42px] text-xs font-medium rounded-lg transition-colors text-left ${
                      isActive
                        ? 'bg-neutral-800 text-sky-400 font-semibold'
                        : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-sky-400' : 'text-neutral-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`font-mono text-[11px] tabular-nums shrink-0 ml-2 px-1.5 py-0.5 rounded bg-neutral-950 ${
                          item.highlightBadge
                            ? 'text-sky-400 font-bold'
                            : 'text-neutral-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Mobile Drawer Footer */}
            <div className="p-4 border-t border-neutral-800 text-[11px] text-neutral-400 space-y-1.5 bg-neutral-950/80">
              <div className="flex items-center justify-between">
                <span>{t.engineCore}:</span>
                <span className="font-mono text-sky-400">UmolkTG v4.2 PRO</span>
              </div>
              <div className="flex items-center justify-between">
                <span>MTProto Protocol:</span>
                <span className="font-mono text-neutral-300">Layer 182</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
