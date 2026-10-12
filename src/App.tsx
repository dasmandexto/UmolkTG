import React from 'react';
import { CombinerProvider, useCombiner } from './context/CombinerContext';
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/Sidebar';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { AccountsManager } from './components/accounts/AccountsManager';
import { AddAccountsModal } from './components/accounts/AddAccountsModal';
import { AccountDetailModal } from './components/accounts/AccountDetailModal';
import { WebTelegramModal } from './components/accounts/WebTelegramModal';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { AudienceParser } from './components/parser/AudienceParser';
import { BulkSender } from './components/sender/BulkSender';
import { InviterManager } from './components/inviter/InviterManager';
import { WarmupAndCloner } from './components/warmup/WarmupAndCloner';
import { ProxyManager } from './components/proxy/ProxyManager';
import { TaskManager } from './components/tasks/TaskManager';
import { LiveConsole } from './components/logs/LiveConsole';
import { SettingsPanel } from './components/settings/SettingsPanel';
import { SessionConverter } from './components/converter/SessionConverter';
import { HeadlessDialer } from './components/dialer/HeadlessDialer';

const AppContent: React.FC = () => {
  const { activeModule } = useCombiner();

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <OverviewDashboard />;
      case 'accounts':
        return <AccountsManager />;
      case 'converter':
        return <SessionConverter />;
      case 'dialer':
        return <HeadlessDialer />;
      case 'parser':
        return <AudienceParser />;
      case 'sender':
        return <BulkSender />;
      case 'inviter':
        return <InviterManager />;
      case 'warmup':
        return <WarmupAndCloner />;
      case 'proxies':
        return <ProxyManager />;
      case 'tasks':
        return <TaskManager />;
      case 'logs':
        return <LiveConsole />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <OverviewDashboard />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100 font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar contract */}
        <TopBar />

        {/* Viewport content with safe padding for mobile bottom nav */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 pb-20 md:pb-6 bg-neutral-950">
          <div className="max-w-7xl mx-auto w-full">
            {renderActiveModule()}
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <MobileBottomNav />
      </div>

      {/* Global Modals */}
      <AddAccountsModal />
      <AccountDetailModal />
      <WebTelegramModal />
    </div>
  );
};

export default function App() {
  return (
    <CombinerProvider>
      <AppContent />
    </CombinerProvider>
  );
}
