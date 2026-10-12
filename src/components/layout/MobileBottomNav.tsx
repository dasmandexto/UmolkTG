import React from 'react';
import { useCombiner } from '../../context/CombinerContext';
import {
  LayoutDashboard,
  Users,
  ListTodo,
  PhoneCall,
  Menu,
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const {
    activeModule,
    setActiveModule,
    setIsMobileDrawerOpen,
    accounts,
    tasks,
  } = useCombiner();

  const aliveAccounts = accounts.filter((a) => a.status === 'active').length;
  const runningTasksCount = tasks.filter((t) => t.status === 'running').length;

  const tabs = [
    {
      id: 'dashboard',
      label: 'Огляд',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'accounts',
      label: 'Акаунти',
      icon: Users,
      badge: `${aliveAccounts}`,
    },
    {
      id: 'tasks',
      label: 'Завдання',
      icon: ListTodo,
      badge: runningTasksCount > 0 ? `${runningTasksCount}` : null,
      highlightBadge: runningTasksCount > 0,
    },
    {
      id: 'dialer',
      label: 'Дзвінки',
      icon: PhoneCall,
      badge: null,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800 pb-[env(safe-area-inset-bottom)] select-none">
      <div className="grid grid-cols-5 h-14 items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeModule === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveModule(tab.id);
                setIsMobileDrawerOpen(false);
              }}
              className={`flex flex-col items-center justify-center h-full relative transition-colors ${
                isActive ? 'text-sky-400' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {tab.badge && (
                  <span
                    className={`absolute -top-1.5 -right-2 font-mono text-[9px] px-1 rounded-full ${
                      tab.highlightBadge
                        ? 'bg-sky-500 text-white font-bold animate-pulse'
                        : 'bg-neutral-800 text-neutral-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 font-medium truncate max-w-[56px]">
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* More / Menu Drawer Toggle */}
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="flex flex-col items-center justify-center h-full text-neutral-400 hover:text-white transition-colors"
          title="Відкрити всі модулі"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">
            Меню
          </span>
        </button>
      </div>
    </nav>
  );
};
