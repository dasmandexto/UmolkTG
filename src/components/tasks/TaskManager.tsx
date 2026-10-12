import React from 'react';
import { useCombiner } from '../../context/CombinerContext';
import {
  ListTodo,
  Play,
  Pause,
  StopCircle,
  Clock,
  Zap,
  CheckCircle,
  AlertTriangle,
  Send,
  UserPlus,
  Flame,
  Search,
} from 'lucide-react';
import { TaskType } from '../../types';

export const TaskManager: React.FC = () => {
  const { t, tasks, pauseTask, resumeTask, abortTask } = useCombiner();

  const getTaskIcon = (type: TaskType) => {
    switch (type) {
      case 'sender_dm':
      case 'sender_chat':
        return <Send className="w-3.5 h-3.5 text-emerald-400" />;
      case 'inviter':
        return <UserPlus className="w-3.5 h-3.5 text-purple-400" />;
      case 'warmup':
        return <Flame className="w-3.5 h-3.5 text-amber-400" />;
      case 'parser':
        return <Search className="w-3.5 h-3.5 text-sky-400" />;
      default:
        return <Zap className="w-3.5 h-3.5 text-neutral-400" />;
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Top Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-sky-400" />
            <span>{t.tasksTitle}</span>
            <span className="text-xs font-mono font-normal text-neutral-400">
              ({tasks.length} процессов)
            </span>
          </h2>
          <p className="text-neutral-400 mt-0.5">
            Диспетчер параллельных потоков, контроль задержек и распределение задач между аккаунтами
          </p>
        </div>
      </div>

      {/* Tasks Queue List */}
      <div className="space-y-3">
        {tasks.map((task) => {
          const isRunning = task.status === 'running';
          const isPaused = task.status === 'paused';
          const isCompleted = task.status === 'completed';
          const percentage = Math.round((task.progressCurrent / (task.progressTotal || 1)) * 100);

          return (
            <div
              key={task.id}
              className="bg-neutral-900 border border-neutral-800 rounded p-4 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded bg-neutral-950 border border-neutral-800 shrink-0">
                    {getTaskIcon(task.type)}
                  </span>
                  <div>
                    <div className="font-semibold text-white text-xs flex items-center gap-2">
                      <span>{task.name}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded uppercase ${
                          isRunning
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : isPaused
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>
                    {task.targetChat && (
                      <div className="text-[11px] font-mono text-neutral-400 mt-0.5">
                        Цель: {task.targetChat}
                      </div>
                    )}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {!isCompleted && (
                    <>
                      {isRunning ? (
                        <button
                          onClick={() => pauseTask(task.id)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded font-medium transition-colors"
                        >
                          <Pause className="w-3 h-3" />
                          <span>{t.btnPause}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => resumeTask(task.id)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded font-medium transition-colors"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>{t.btnResume}</span>
                        </button>
                      )}

                      <button
                        onClick={() => abortTask(task.id)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded font-medium transition-colors"
                      >
                        <StopCircle className="w-3 h-3" />
                        <span>{t.btnAbort}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1 font-mono">
                  <span>
                    Выполнено: <b className="text-white">{task.progressCurrent.toLocaleString()}</b> из {task.progressTotal.toLocaleString()} ({percentage}%)
                  </span>
                  <span>
                    Скорость: <b className="text-sky-400">{task.speedPerMin}</b> д./мин · ETA: {task.estimatedTimeLeft || '—'}
                  </span>
                </div>
                <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      isCompleted ? 'bg-emerald-500' : 'bg-sky-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Bottom Telemetry unboxed text with dots */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-neutral-400 pt-1 border-t border-neutral-800/60">
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-emerald-400">✓ {task.successCount} успешно</span>
                  <span aria-hidden="true" className="text-neutral-700">·</span>
                  <span className={task.failedCount > 0 ? 'text-rose-400' : 'text-neutral-500'}>
                    ✕ {task.failedCount} ошибок
                  </span>
                  <span aria-hidden="true" className="text-neutral-700">·</span>
                  <span className="text-neutral-300">{task.accountsAssigned} потоков выделено</span>
                </div>

                <div className="text-neutral-500 font-mono">
                  Старт: {task.startedAt} · Задержка: {task.delayRange[0]}–{task.delayRange[1]}s
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
