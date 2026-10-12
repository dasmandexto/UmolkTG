import React, { useState, useRef, useEffect } from 'react';
import { useCombiner } from '../../context/CombinerContext';
import {
  Terminal,
  Trash2,
  Download,
  Search,
  Filter,
  ArrowDownCircle,
} from 'lucide-react';
import { LogLevel } from '../../types';

export const LiveConsole: React.FC = () => {
  const { t, logs, clearLogs, addLog } = useCombiner();

  const [filterModule, setFilterModule] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);

  const consoleEndRef = useRef<HTMLDivElement>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesModule = filterModule === 'all' ? true : log.module === filterModule;
    const matchesQuery =
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.accountPhone && log.accountPhone.includes(searchQuery)) ||
      (log.target && log.target.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesModule && matchesQuery;
  });

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'success':
        return 'text-emerald-400';
      case 'warn':
        return 'text-amber-400';
      case 'error':
      case 'flood':
        return 'text-rose-400 font-semibold';
      case 'info':
      default:
        return 'text-sky-400';
    }
  };

  const handleExportLogs = () => {
    const content = logs
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.module}] ${l.accountPhone ? `(${l.accountPhone}) ` : ''}${l.message}`)
      .join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `teleraptor_console_log_${Date.now()}.txt`;
    link.click();
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Header & Controls */}
      <div className="bg-neutral-900 border border-neutral-800 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-sky-400" />
            <span>{t.logsTitle}</span>
            <span className="text-xs font-mono font-normal text-neutral-400">
              ({filteredLogs.length} записей)
            </span>
          </h2>
          <p className="text-neutral-400 mt-0.5">
            Консольный вывод сетевых запросов MTProto, задержек, Spintax и ответов Telegram API
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.btnClearLogs}</span>
          </button>

          <button
            onClick={handleExportLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.btnExportLogs}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t.searchLogs}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Module Filter buttons */}
        <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 p-1 rounded overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'Все модули' },
            { id: 'sender', label: 'Рассылка' },
            { id: 'inviter', label: 'Инвайтер' },
            { id: 'accounts', label: 'Аккаунты' },
            { id: 'parser', label: 'Парсер' },
            { id: 'warmup', label: 'Прогрев' },
            { id: 'proxy', label: 'Прокси' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterModule(tab.id)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                filterModule === tab.id
                  ? 'bg-neutral-800 text-sky-400 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Output Window */}
      <div className="bg-neutral-950 border border-neutral-800 rounded p-4 font-mono text-[11px] leading-relaxed h-[520px] overflow-y-auto space-y-1.5">
        {filteredLogs.length === 0 ? (
          <div className="text-neutral-600 text-center py-12">
            Журнал событий пуст или нет записей под выбранный фильтр
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-baseline gap-2 py-0.5 hover:bg-neutral-900/60 px-1 rounded transition-colors"
            >
              {/* Timestamp */}
              <span className="text-neutral-500 tabular-nums shrink-0">
                {log.timestamp}
              </span>

              {/* Level */}
              <span className={`uppercase font-semibold shrink-0 text-[10px] ${getLevelColor(log.level)}`}>
                [{log.level}]
              </span>

              {/* Module */}
              <span className="text-neutral-400 shrink-0 text-[10px]">
                [{log.module}]
              </span>

              {/* Phone if available */}
              {log.accountPhone && (
                <span className="text-sky-300 shrink-0">
                  {log.accountPhone}:
                </span>
              )}

              {/* Message */}
              <span className="text-neutral-200 break-all">
                {log.message}
              </span>
            </div>
          ))
        )}
        <div ref={consoleEndRef} />
      </div>
    </div>
  );
};
