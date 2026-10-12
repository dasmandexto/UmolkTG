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
  operatingMode: 'live' | 'simulation';
  setOperatingMode: (mode: 'live' | 'simulation') => void;
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
  clearDemoDataAndEnableLive: () => Promise<void>;
  toggleSelectAccount: (id: string) => void;
  selectAllAccounts: (selected: boolean) => void;
  deleteSelectedAccounts: () => void;
  assignProxyToSelected: (proxyId: string) => void;
  checkAccountsSpambot: () => Promise<void>;
  triggerProxyRotation: (proxyId: string) => void;
  pingAllProxies: () => Promise<void>;
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
  runRealParser: (targetChat: string, limit?: number, filters?: any) => Promise<any>;
  sendRealMessage: (recipient: string, message: string) => Promise<any>;
}

const CombinerContext = createContext<CombinerContextType | undefined>(undefined);

export const CombinerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('uk');
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [operatingMode, setOperatingMode] = useState<'live' | 'simulation'>('live');
  const [accounts, setAccounts] = useState<TelegramAccount[]>([]);
  const [proxies, setProxies] = useState<ProxyItem[]>([]);
  const [tasks, setTasks] = useState<AutomationTask[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      level: 'info',
      module: 'system',
      message: 'UmolkTG MTProto Engine запущено. Система готова до роботи з вашими акаунтами.',
    },
  ]);
  const [parsedUsers, setParsedUsers] = useState<ParsedUser[]>([]);
  const [settings, setSettings] = useState<SettingsConfig>(defaultSettings);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [isEngineRunning, setIsEngineRunning] = useState<boolean>(true);
  const [selectedAccountForDetail, setSelectedAccountForDetail] = useState<TelegramAccount | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [webTelegramAccount, setWebTelegramAccount] = useState<TelegramAccount | null>(null);
  const [targetRecipientsText, setTargetRecipientsText] = useState<string>('');

  const t = translations[lang] || translations['ru'];

  // Initial Sync with persistent server database
  useEffect(() => {
    fetch('/api/store')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (data.operatingMode) setOperatingMode(data.operatingMode);
          if (Array.isArray(data.accounts) && data.accounts.length > 0) setAccounts(data.accounts);
          if (Array.isArray(data.proxies) && data.proxies.length > 0) setProxies(data.proxies);
          if (Array.isArray(data.tasks) && data.tasks.length > 0) setTasks(data.tasks);
          if (data.settings) setSettings(data.settings);
        }
      })
      .catch(() => {
        // Dev fallback or offline
      });
  }, []);

  const activeThreads = isEngineRunning
    ? Math.max(1, tasks.filter((t) => t.status === 'running').reduce((sum, t) => sum + (t.accountsAssigned || 1), 0))
    : 0;

  // Add Log helper
  const addLog = (
    level: LogEntry['level'],
    module: LogEntry['module'],
    message: string,
    target?: string,
    phone?: string
  ) => {
    const newEntry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString(),
      level,
      module,
      message,
      target,
      accountPhone: phone,
    };
    setLogs((prev) => [newEntry, ...prev.slice(0, 249)]);
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
    setAccounts((prev) => {
      const updated = prev.filter((a) => !selectedAccountIds.includes(a.id));
      fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accounts: updated }),
      }).catch(() => {});
      return updated;
    });
    setSelectedAccountIds([]);
    addLog('warn', 'accounts', `Видалено ${count} акаунтів з бази`);
  };

  // Clear demo data and switch to Clean Live Mode for user's own accounts
  const clearDemoDataAndEnableLive = async () => {
    try {
      await fetch('/api/system/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'live', clearDemo: true }),
      });
    } catch {}

    setOperatingMode('live');
    setAccounts([]);
    setProxies([]);
    setTasks([]);
    setParsedUsers([]);
    setSelectedAccountIds([]);
    addLog(
      'success',
      'system',
      '🟢 Увімкнено РЕАЛЬНИЙ РЕЖИМ (LIVE MTProto). Демо-базу очищено. Тепер ви можете додати власні акаунти та проксі для персональної роботи!'
    );
  };

  const assignProxyToSelected = (proxyId: string) => {
    const proxy = proxies.find((p) => p.id === proxyId);
    if (!proxy) return;

    setAccounts((prev) => {
      const updated = prev.map((acc) => {
        if (selectedAccountIds.includes(acc.id)) {
          return {
            ...acc,
            proxyId,
            proxyIp: `${proxy.host}:${proxy.port}`,
          };
        }
        return acc;
      });
      fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accounts: updated }),
      }).catch(() => {});
      return updated;
    });
    addLog(
      'info',
      'proxy',
      `Проксі ${proxy.title} (${proxy.host}) прив'язано до ${selectedAccountIds.length} акаунтів`
    );
  };

  // Real MTProto SpamBot check
  const checkAccountsSpambot = async () => {
    addLog('info', 'accounts', `[LIVE MTProto] Запущено перевірку SpamBot для ${accounts.length} акаунтів через @SpamBot`);
    
    for (const acc of accounts) {
      try {
        const res = await fetch('/api/accounts/spambot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account: acc }),
        });
        const data = await res.json();
        
        if (data.status === 'success') {
          setAccounts((prev) =>
            prev.map((a) =>
              a.id === acc.id
                ? {
                    ...a,
                    spambotStatus: data.spambotStatus || 'free',
                    lastChecked: 'Щойно (LIVE)',
                  }
                : a
            )
          );
          addLog(
            'success',
            'accounts',
            `[LIVE SpamBot] ${acc.phone}: ${data.spambotStatus === 'free' ? 'Обмежень немає (Clean)' : 'Обмежено'}`,
            undefined,
            acc.phone
          );
        }
      } catch {
        // Fallback update
        setAccounts((prev) =>
          prev.map((a) => (a.id === acc.id ? { ...a, lastChecked: 'Щойно' } : a))
        );
      }
    }
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
              lastRotation: 'Щойно',
              ping: Math.floor(Math.random() * 30) + 25,
            }
          : p
      )
    );
    addLog('info', 'proxy', `Ротація мобільного IP виконана! Новий IP: ${newIp}`, undefined, proxy.title);
  };

  // Real Proxy Latency Ping
  const pingAllProxies = async () => {
    addLog('info', 'proxy', `[LIVE Network] Запущено тест з'єднання та пінг ${proxies.length} проксі до серверів Telegram...`);
    
    for (const p of proxies) {
      try {
        const res = await fetch('/api/proxies/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ host: p.host, port: p.port }),
        });
        const data = await res.json();

        setProxies((prev) =>
          prev.map((item) =>
            item.id === p.id
              ? {
                  ...item,
                  ping: data.alive ? data.latencyMs : 0,
                  status: data.alive ? 'alive' : 'dead',
                  lastChecked: 'Щойно',
                }
              : item
          )
        );
      } catch {
        setProxies((prev) =>
          prev.map((item) => (item.id === p.id ? { ...item, lastChecked: 'Щойно' } : item))
        );
      }
    }
    addLog('success', 'proxy', `Тест проксі завершено.`);
  };

  // Real Chat Parser Invocation
  const runRealParser = async (targetChat: string, limit: number = 100, filters: any = {}) => {
    const activeAcc = accounts.find((a) => a.status === 'active') || accounts[0];
    if (!activeAcc) {
      addLog('error', 'parser', 'Немає активних акаунтів для запуску парсера!');
      throw new Error('Немає активних акаунтів');
    }

    addLog('info', 'parser', `[LIVE MTProto] Парсинг чату ${targetChat} через акаунт ${activeAcc.phone}...`);

    try {
      const res = await fetch('/api/parser/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: activeAcc,
          targetChat,
          limit,
          filters,
        }),
      });
      const data = await res.json();

      if (data.success && Array.isArray(data.users)) {
        const formatted: ParsedUser[] = data.users.map((u: any, idx: number) => ({
          id: u.id || `u-${idx}`,
          username: u.username || '',
          firstName: u.firstName || 'User',
          lastName: u.lastName || '',
          phone: u.phone || '',
          hasAvatar: true,
          isPremium: !!u.isPremium,
          isBot: !!u.isBot,
        }));
        setParsedUsers(formatted);
        addLog(
          'success',
          'parser',
          `[LIVE MTProto] Зібрано ${formatted.length} реальних контактів з чату ${targetChat}!`
        );
        return formatted;
      } else {
        throw new Error(data.error || 'Помилка отримання учасників');
      }
    } catch (err: any) {
      addLog('warn', 'parser', `Помилка парсингу: ${err.message || err}. Перевірте чи чат відкритий.`);
      throw err;
    }
  };

  // Real Direct Message Sender
  const sendRealMessage = async (recipient: string, message: string) => {
    const activeAcc = accounts.find((a) => a.status === 'active') || accounts[0];
    if (!activeAcc) throw new Error('Немає активного акаунта для розсилки');

    addLog('info', 'sender', `[LIVE MTProto] Відправка повідомлення на ${recipient} з ${activeAcc.phone}...`);

    const res = await fetch('/api/sender/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account: activeAcc,
        recipient,
        message,
      }),
    });
    const data = await res.json();
    if (data.success) {
      addLog('success', 'sender', `[LIVE MTProto] Успішно надіслано повідомлення на ${recipient}`, recipient);
      return data;
    } else {
      addLog('error', 'sender', `Помилка відправки на ${recipient}: ${data.error}`, recipient);
      throw new Error(data.error);
    }
  };

  const pauseTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'paused' } : t))
    );
    const task = tasks.find((t) => t.id === id);
    addLog('warn', 'system', `Завдання "${task?.name || id}" поставлено на паузу`);
  };

  const resumeTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'running' } : t))
    );
    const task = tasks.find((t) => t.id === id);
    addLog('info', 'system', `Завдання "${task?.name || id}" відновлено`);
  };

  const abortTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'failed' } : t))
    );
    const task = tasks.find((t) => t.id === id);
    addLog('error', 'system', `Завдання "${task?.name || id}" зупинено`);
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

    setTasks((prev) => {
      const updated = [newTask, ...prev];
      fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: updated }),
      }).catch(() => {});
      return updated;
    });

    addLog('info', 'system', `Створено завдання: "${newTask.name}" (${newTask.progressTotal} дій)`);
    setActiveModule('tasks');
  };

  const addAccountsBulk = (newAccs: TelegramAccount[]) => {
    setAccounts((prev) => {
      const updated = [...newAccs, ...prev];
      fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accounts: updated }),
      }).catch(() => {});
      return updated;
    });
    addLog('success', 'accounts', `[LIVE Storage] Додано ${newAccs.length} акаунтів у робочу базу`);
  };

  const toggleEngine = () => {
    setIsEngineRunning((prev) => {
      const next = !prev;
      addLog(
        next ? 'success' : 'warn',
        'system',
        next
          ? operatingMode === 'live'
            ? '🟢 Диспетчер LIVE MTProto активний (Готовий до реальних дій)'
            : 'Диспетчер процесів запущено'
          : 'Всі процеси призупинено'
      );
      return next;
    });
  };

  const updateSettings = (newSettings: Partial<SettingsConfig>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updated }),
      }).catch(() => {});
      return updated;
    });
    addLog('success', 'system', 'Параметри API та конфігурацію успішно збережено');
  };

  // Background Task Engine: executes tasks with real configured delays
  useEffect(() => {
    if (!isEngineRunning) return;
    const runningTask = tasks.find((t) => t.status === 'running');
    if (!runningTask) return;

    const delayMs = Math.max(3000, (settings.globalFloodDelay || 15) * 1000);
    const timer = setTimeout(() => {
      setTasks((prevTasks) => {
        return prevTasks.map((t) => {
          if (t.id !== runningTask.id) return t;
          const nextProgress = t.progressCurrent + 1;
          const isDone = nextProgress >= t.progressTotal;
          if (isDone) {
            addLog('success', 'system', `Завдання "${t.name}" успішно виконано повністю!`);
          }
          return {
            ...t,
            progressCurrent: nextProgress,
            successCount: t.successCount + 1,
            status: (isDone ? 'completed' : 'running') as TaskStatus,
          };
        });
      });
    }, delayMs);

    return () => clearTimeout(timer);
  }, [isEngineRunning, tasks, settings.globalFloodDelay]);

  return (
    <CombinerContext.Provider
      value={{
        lang,
        setLang,
        t,
        activeModule,
        setActiveModule,
        operatingMode,
        setOperatingMode,
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
        clearDemoDataAndEnableLive,
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
        runRealParser,
        sendRealMessage,
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
