import React from 'react';
import { useCombiner } from '../../context/CombinerContext';
import {
  Users,
  Send,
  UserPlus,
  TrendingUp,
  AlertTriangle,
  Play,
  Pause,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const OverviewDashboard: React.FC = () => {
  const {
    t,
    accounts,
    tasks,
    logs,
    setActiveModule,
    setIsAddModalOpen,
    checkAccountsSpambot,
    pauseTask,
    resumeTask,
  } = useCombiner();

  const totalAccounts = accounts.length;
  const activeAccounts = accounts.filter((a) => a.status === 'active').length;
  const spamblockAccounts = accounts.filter((a) => a.status === 'spamblock').length;
  const bannedAccounts = accounts.filter((a) => a.status === 'banned').length;
  const warmingAccounts = accounts.filter((a) => a.status === 'warming').length;

  const totalSentToday = accounts.reduce((acc, curr) => acc + curr.messagesSent, 0);
  const runningTasks = tasks.filter((t) => t.status === 'running');

  return (
    <div className="space-y-6">
      {/* Operating Mode Banner */}
      {totalAccounts === 0 ? (
        <div className="p-4 bg-neutral-900 border border-sky-800/60 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <div>
              <div className="text-xs font-semibold text-white">
                🟢 Режим реальної роботи (LIVE MTProto) активний
              </div>
              <div className="text-[11px] text-neutral-300 mt-0.5">
                База готова для вашого власного використання. Додайте власні акаунти (.session + .json або ZIP) для початку реального парсингу, розсилки та дзвінків.
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Users className="w-3.5 h-3.5" />
            <span>+ Додати власні акаунти</span>
          </button>
        </div>
      ) : null}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>{t.statsTotalAccounts}</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono tracking-tight text-white tabular-nums">
              {activeAccounts}
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              / {totalAccounts} online
            </span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>{Math.round((activeAccounts / (totalAccounts || 1)) * 100)}% pool health</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>{t.statsDmsSentToday}</span>
            <Send className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono tracking-tight text-white tabular-nums">
              {totalSentToday.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-400 font-mono">
              +18.4%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-400 flex items-center gap-1.5">
            <span>Avg delay: 24s · 0 flood bans</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>{t.statsInvitesToday}</span>
            <UserPlus className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono tracking-tight text-white tabular-nums">
              1,248
            </span>
            <span className="text-xs text-purple-400 font-mono">
              96.8% ok
            </span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-400 flex items-center gap-1.5">
            <span>Contacts method bypass enabled</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>{t.statsConversionRate}</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono tracking-tight text-white tabular-nums">
              14.2%
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              176 replies
            </span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-400 flex items-center gap-1.5">
            <span>Spintax diversity: 92% entropy</span>
          </div>
        </div>
      </div>

      {/* Quick Operations Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded p-4">
        <div className="text-xs font-semibold text-neutral-300 mb-3">
          {t.quickActionsTitle}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t.actionAddAccounts}</span>
          </button>

          <button
            onClick={() => setActiveModule('sender')}
            className="flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 hover:text-white rounded transition-colors"
          >
            <Send className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.actionStartSender}</span>
          </button>

          <button
            onClick={() => setActiveModule('parser')}
            className="flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 hover:text-white rounded transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.actionParseChat}</span>
          </button>

          <button
            onClick={checkAccountsSpambot}
            className="flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 hover:text-white rounded transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>{t.actionCheckSpambot}</span>
          </button>
        </div>
      </div>

      {/* Two Column Grid: Active Tasks & Account Pool Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Running Operations */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-neutral-300">
              {t.recentActivity}
            </div>
            <button
              onClick={() => setActiveModule('tasks')}
              className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
            >
              <span>{t.navTasks}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {tasks.slice(0, 3).map((task) => {
              const percentage = Math.round((task.progressCurrent / (task.progressTotal || 1)) * 100);
              const isRunning = task.status === 'running';

              return (
                <div
                  key={task.id}
                  className="bg-neutral-950/70 border border-neutral-800/80 rounded p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-medium text-neutral-200">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                        }`}
                      ></span>
                      <span className="truncate max-w-sm">{task.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => (isRunning ? pauseTask(task.id) : resumeTask(task.id))}
                        className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                        title={isRunning ? t.btnPause : t.btnResume}
                      >
                        {isRunning ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                      <span className="font-mono tabular-nums">
                        {task.progressCurrent.toLocaleString()} / {task.progressTotal.toLocaleString()} ({percentage}%)
                      </span>
                      <span className="font-mono tabular-nums text-neutral-500">
                        {task.speedPerMin} actions/min · {task.estimatedTimeLeft || 'calculating...'}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-500 transition-all duration-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Meta stats unboxed */}
                  <div className="flex items-center gap-3 text-[11px] text-neutral-400 font-mono">
                    <span className="text-emerald-400">✓ {task.successCount} ok</span>
                    <span aria-hidden="true" className="text-neutral-700">·</span>
                    <span className={task.failedCount > 0 ? 'text-rose-400' : 'text-neutral-500'}>
                      ✕ {task.failedCount} errors
                    </span>
                    <span aria-hidden="true" className="text-neutral-700">·</span>
                    <span className="text-neutral-400">{task.accountsAssigned} threads active</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Account Pool Health Breakdown */}
        <div className="bg-neutral-900 border border-neutral-800 rounded p-4 space-y-4">
          <div className="text-xs font-semibold text-neutral-300">
            {t.accountHealth}
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-neutral-800">
              <span className="flex items-center gap-2 text-neutral-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{t.filterActive}</span>
              </span>
              <span className="font-mono font-medium text-emerald-400 tabular-nums">
                {activeAccounts}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-neutral-800">
              <span className="flex items-center gap-2 text-neutral-300">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>{t.filterSpamblock}</span>
              </span>
              <span className="font-mono font-medium text-amber-400 tabular-nums">
                {spamblockAccounts}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-neutral-800">
              <span className="flex items-center gap-2 text-neutral-300">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                <span>{t.filterWarming}</span>
              </span>
              <span className="font-mono font-medium text-sky-400 tabular-nums">
                {warmingAccounts}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-neutral-800">
              <span className="flex items-center gap-2 text-neutral-300">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>{t.filterBanned}</span>
              </span>
              <span className="font-mono font-medium text-rose-400 tabular-nums">
                {bannedAccounts}
              </span>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="p-3 bg-neutral-950/80 rounded border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Anti-Flood Protection</span>
            </div>
            <p className="leading-relaxed">
              Global safe delay is set to 24s. All accounts bound to mobile rotating proxies.
            </p>
          </div>
        </div>
      </div>

      {/* Mini Live Stream Preview */}
      <div className="bg-neutral-900 border border-neutral-800 rounded p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-neutral-300">
            {t.logsTitle} (Latest Events)
          </div>
          <button
            onClick={() => setActiveModule('logs')}
            className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
          >
            <span>Open Console</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="font-mono text-xs space-y-1.5 bg-neutral-950 p-3 rounded border border-neutral-800 max-h-36 overflow-y-auto">
          {logs.slice(0, 5).map((log) => (
            <div key={log.id} className="flex items-baseline gap-2 text-[11px] leading-relaxed">
              <span className="text-neutral-500 tabular-nums shrink-0">{log.timestamp}</span>
              <span
                className={`font-semibold shrink-0 uppercase text-[10px] ${
                  log.level === 'success'
                    ? 'text-emerald-400'
                    : log.level === 'warn'
                    ? 'text-amber-400'
                    : log.level === 'error' || log.level === 'flood'
                    ? 'text-rose-400'
                    : 'text-sky-400'
                }`}
              >
                [{log.module}]
              </span>
              <span className="text-neutral-300 truncate">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
