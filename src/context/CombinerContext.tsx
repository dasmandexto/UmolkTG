import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Language,
  TelegramAccount,
  ProxyItem,
  AutomationTask,
  TaskStatus,
  LogEntry,
  ParsedUser,
  SettingsConfig,
} from '../types';
import {
  initialAccounts,
  initialProxies,
  initialTasks,
  initialLogs,
  sampleParsedUsers,
  defaultSettings,
} from '../data/mockData';
import { translations } from '../utils/localization';

interface CombinerContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof translations['ru'];
  activeModule: string;
  setActiveModule: (module: string) => void;
  accounts: TelegramAccount[];
  proxies: ProxyItem[];
  tasks: AutomationTask[];
  logs: LogEntry[];
  parsedUsers: ParsedUser[];
  settings: SettingsConfig;
  selectedAccountIds: string[];
  isEngineRunning: boolean;
  activeThreads: number;
  selectedAccountForDetail: TelegramAccount | null;
  setSelectedAccountForDetail: (acc: TelegramAccount | null) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean) => void;
  webTelegramAccount: TelegramAccount | null;
  setWebTelegramAccount: (acc: TelegramAccount | null) => void;
  targetRecipientsText: string;
  setTargetRecipientsText: (text: string) => void;
  
  // Actions
  toggleSelectAccount: (id: string) => void;
  selectAllAccounts: (selected: boolean) => void;
  deleteSelectedAccounts: () => void;
  assignProxyToSelected: (proxyId: string) => void;
  checkAccountsSpambot: () => void;
  triggerProxyRotation: (proxyId: string) => void;
  pingAllProxies: () => void;
  pauseTask: (id: string) => void;
  resumeTask: (id: string) => void;
  abortTask: (id: string) => void;
  createTask: (task: Omit<AutomationTask, 'id' | 'startedAt' | 'progressCurrent' | 'successCount' | 'failedCount' | 'floodWaitCount' | 'status'>) => void;
  addAccountsBulk: (newAccs: TelegramAccount[]) => void;
  addLog: (level: LogEntry['level'], module: LogEntry['module'], message: string, target?: string, phone?: string) => void;
  clearLogs: () => void;
  toggleEngine: () => void;
  updateSettings: (newSettings: Partial<SettingsConfig>) => void;
  setParsedUsers: React.Dispatch<React.SetStateAction<ParsedUser[]>>;
}

const CombinerContext = createContext<CombinerContextType | undefined>(undefined);

export const CombinerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('ru');
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [accounts, setAccounts] = useState<TelegramAccount[]>(initialAccounts);
  const [proxies, setProxies] = useState<ProxyItem[]>(initialProxies);
  const [tasks, setTasks] = useState<AutomationTask[]>(initialTasks);
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [parsedUsers, setParsedUsers] = useState<ParsedUser[]>(sampleParsedUsers);
  const [settings, setSettings] = useState<SettingsConfig>(defaultSettings);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>(['acc-1', 'acc-2']);
  const [isEngineRunning, setIsEngineRunning] = useState<boolean>(true);
  const [selectedAccountForDetail, setSelectedAccountForDetail] = useState<TelegramAccount | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [webTelegramAccount, setWebTelegramAccount] = useState<TelegramAccount | null>(null);
  const [targetRecipientsText, setTargetRecipientsText] = useState<string>(
    sampleParsedUsers.map((u) => '@' + u.username).join('\n')
  );

  const t = translations[lang];

  const activeThreads = isEngineRunning
    ? tasks.filter((t) => t.status === 'running').reduce((sum, t) => sum + (t.accountsAssigned || 1), 0) * 3
    : 0;

  // Add Log helper
  const addLog = (
    level: LogEntry['level'],
    module: LogEntry['module'],
    message: string,
    target?: string,
    phone?: string
  ) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const newEntry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: timeStr,
      level,
      module,
      message,
      target,
      accountPhone: phone,
    };
    setLogs((prev) => [newEntry, ...prev.slice(0, 199)]); // Keep last 200 logs
  };

  const clearLogs = () => {
    setLogs([]);
  };

  // Toggle Account selection
  const toggleSelectAccount = (id: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAllAccounts = (selected: boolean) => {
    if (selected) {
      setSelectedAccountIds(accounts.map((a) => a.id));
    } else {
      setSelectedAccountIds([]);
    }
  };

  const deleteSelectedAccounts = () => {
    if (selectedAccountIds.length === 0) return;
    const count = selectedAccountIds.length;
    setAccounts((prev) => prev.filter((a) => !selectedAccountIds.includes(a.id)));
    setSelectedAccountIds([]);
    addLog('warn', 'accounts', `Удалено ${count} аккаунтов из базы`);
  };

  const assignProxyToSelected = (proxyId: string) => {
    const proxy = proxies.find((p) => p.id === proxyId);
    if (!proxy) return;

    setAccounts((prev) =>
      prev.map((acc) => {
        if (selectedAccountIds.includes(acc.id)) {
          return {
            ...acc,
            proxyId,
            proxyIp: `${proxy.host}:${proxy.port}`,
          };
        }
        return acc;
      })
    );
    addLog(
      'info',
      'proxy',
      `Прокси ${proxy.title} (${proxy.host}) привязан к ${selectedAccountIds.length} аккаунтам`
    );
  };

  const checkAccountsSpambot = () => {
    addLog('info', 'accounts', `Запущен чек SpamBot для ${accounts.length} аккаунтов через официальный @SpamBot`);
    
    // Simulate updating statuses
    setTimeout(() => {
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.status === 'banned') return acc;
          return {
            ...acc,
            lastChecked: 'Только что',
          };
        })
      );
      addLog('success', 'accounts', `Проверка завершена: 8 без ограничений, 1 временный спамблок, 1 вечный бан`);
    }, 1200);
  };

  const triggerProxyRotation = (proxyId: string) => {
    const proxy = proxies.find((p) => p.id === proxyId);
    if (!proxy || !proxy.rotationUrl) return;

    const newOctet = Math.floor(Math.random() * 200) + 20;
    const newIp = `185.162.228.${newOctet}`;

    setProxies((prev) =>
      prev.map((p) =>
        p.id === proxyId
          ? {
              ...p,
              host: newIp,
              lastRotation: 'Только что',
              ping: Math.floor(Math.random() * 30) + 25,
            }
          : p
      )
    );
    addLog('info', 'proxy', `Ротация мобильного IP выполнена! Новый IP: ${newIp}`, undefined, proxy.title);
  };

  const pingAllProxies = () => {
    addLog('info', 'proxy', `Запущен тест скорости и доступности ${proxies.length} прокси...`);
    setTimeout(() => {
      setProxies((prev) =>
        prev.map((p) => ({
          ...p,
          ping: Math.floor(Math.random() * 45) + 30,
          lastChecked: 'Только что',
          status: 'alive',
        }))
      );
      addLog('success', 'proxy', `Все ${proxies.length} прокси успешно ответили. Средний пинг: 48 мс`);
    }, 1000);
  };

  const pauseTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'paused' } : t))
    );
    const task = tasks.find((t) => t.id === id);
    addLog('warn', 'system', `Задача "${task?.name || id}" поставлена на паузу`);
  };

  const resumeTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'running' } : t))
    );
    const task = tasks.find((t) => t.id === id);
    addLog('info', 'system', `Задача "${task?.name || id}" возобновлена`);
  };

  const abortTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'failed' } : t))
    );
    const task = tasks.find((t) => t.id === id);
    addLog('error', 'system', `Задача "${task?.name || id}" принудительно остановлена`);
  };

  const createTask = (
    taskData: Omit<AutomationTask, 'id' | 'startedAt' | 'progressCurrent' | 'successCount' | 'failedCount' | 'floodWaitCount' | 'status'>
  ) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const newTask: AutomationTask = {
      ...taskData,
      id: `task-${Date.now()}`,
      startedAt: timeStr,
      progressCurrent: 0,
      successCount: 0,
      failedCount: 0,
      floodWaitCount: 0,
      status: 'running' as const,
    };

    setTasks((prev) => [newTask, ...prev]);
    addLog('info', 'system', `Создана новая задача: "${newTask.name}" (${newTask.progressTotal} действий)`);
    setActiveModule('tasks');
  };

  const addAccountsBulk = (newAccs: TelegramAccount[]) => {
    setAccounts((prev) => [...newAccs, ...prev]);
    addLog('success', 'accounts', `Импортировано ${newAccs.length} аккаунтов`);
  };

  const toggleEngine = () => {
    setIsEngineRunning((prev) => {
      const next = !prev;
      addLog(
        next ? 'success' : 'warn',
        'system',
        next ? 'Диспетчер процессов запущен (режим LIVE)' : 'Все процессы приостановлены'
      );
      return next;
    });
  };

  const updateSettings = (newSettings: Partial<SettingsConfig>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    addLog('success', 'system', 'Настройки и API ключи успешно сохранены');
  };

  // Background Live Simulation Engine
  useEffect(() => {
    if (!isEngineRunning) return;

    const interval = setInterval(() => {
      setTasks((prevTasks) => {
        let hasChanges = false;
        const updated = prevTasks.map((task) => {
          if (task.status !== 'running') return task;

          hasChanges = true;
          const increment = Math.floor(Math.random() * 3) + 1;
          const nextProgress = Math.min(task.progressTotal, task.progressCurrent + increment);
          const isDone = nextProgress >= task.progressTotal;

          const isSuccess = Math.random() > 0.06;
          const successInc = isSuccess ? increment : increment - 1;
          const failedInc = isSuccess ? 0 : 1;

          return {
            ...task,
            progressCurrent: nextProgress,
            successCount: task.successCount + Math.max(0, successInc),
            failedCount: task.failedCount + failedInc,
            status: (isDone ? 'completed' : 'running') as TaskStatus,
          };
        });

        return hasChanges ? updated : prevTasks;
      });

      // Occasionally emit dynamic realistic logs
      if (Math.random() > 0.45) {
        const sampleTargets = [
          '@crypto_insider_ton',
          '@alex_solana_trader',
          '@vladimir_dev',
          '@maria_invest',
          '@ton_builder_pro',
          '@arbitrage_master_ru',
          '@diana_cryptomarket',
        ];
        const randomTarget = sampleTargets[Math.floor(Math.random() * sampleTargets.length)];
        const randomPhone = accounts[Math.floor(Math.random() * accounts.length)]?.phone || '+7 925 841-29-14';

        const events = [
          {
            level: 'success' as const,
            module: 'sender' as const,
            msg: `Отправлено ЛС пользователю ${randomTarget} (задержка ${Math.floor(Math.random() * 15) + 18}с)`,
          },
          {
            level: 'info' as const,
            module: 'sender' as const,
            msg: `Генерация Spintax вариации: {Здравствуйте|Привет} -> доставлено`,
          },
          {
            level: 'success' as const,
            module: 'inviter' as const,
            msg: `Пользователь ${randomTarget} успешно добавлен в супергруппу`,
          },
          {
            level: 'info' as const,
            module: 'warmup' as const,
            msg: `Прогрев: чтение 4 постов в канале @telegram, реакция 👍`,
          },
        ];

        const chosen = events[Math.floor(Math.random() * events.length)];
        addLog(chosen.level, chosen.module, chosen.msg, randomTarget, randomPhone);
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [isEngineRunning, accounts]);

  return (
    <CombinerContext.Provider
      value={{
        lang,
        setLang,
        t,
        activeModule,
        setActiveModule,
        accounts,
        proxies,
        tasks,
        logs,
        parsedUsers,
        settings,
        selectedAccountIds,
        isEngineRunning,
        activeThreads,
        selectedAccountForDetail,
        setSelectedAccountForDetail,
        isAddModalOpen,
        setIsAddModalOpen,
        isMobileDrawerOpen,
        setIsMobileDrawerOpen,
        webTelegramAccount,
        setWebTelegramAccount,
        targetRecipientsText,
        setTargetRecipientsText,
        toggleSelectAccount,
        selectAllAccounts,
        deleteSelectedAccounts,
        assignProxyToSelected,
        checkAccountsSpambot,
        triggerProxyRotation,
        pingAllProxies,
        pauseTask,
        resumeTask,
        abortTask,
        createTask,
        addAccountsBulk,
        addLog,
        clearLogs,
        toggleEngine,
        updateSettings,
        setParsedUsers,
      }}
    >
      {children}
    </CombinerContext.Provider>
  );
};

export const useCombiner = () => {
  const context = useContext(CombinerContext);
  if (!context) {
    throw new Error('useCombiner must be used within a CombinerProvider');
  }
  return context;
};
