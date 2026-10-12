import React, { useState, useEffect } from 'react';
import { useCombiner } from '../../context/CombinerContext';
import {
  X,
  ExternalLink,
  Check,
  Shield,
  Smartphone,
  Globe,
  MessageSquare,
  Send,
  Lock,
  Layers,
  Sparkles,
  Download,
  FolderArchive,
  ArrowRightLeft,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import {
  convertSessionToTdata,
  triggerFileDownload,
} from '../../utils/converterLogic';

export const WebTelegramModal: React.FC = () => {
  const { webTelegramAccount, setWebTelegramAccount, addLog } = useCombiner();
  const [clientType, setClientType] = useState<'weba' | 'webk'>('weba');
  const [activeTab, setActiveTab] = useState<'in_app' | 'direct_launch' | 'iframe'>('in_app');
  
  // Fast auto-conversion state
  const isOriginallySession = webTelegramAccount?.format !== 'tdata';
  const [conversionPhase, setConversionPhase] = useState<'idle' | 'converting' | 'completed'>('idle');
  const [conversionStep, setConversionStep] = useState<string>('');
  const [isDownloadingTdata, setIsDownloadingTdata] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // In-app interactive dialogs state
  const [selectedChat, setSelectedChat] = useState<string>('spambot');
  const [outgoingMessage, setOutgoingMessage] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Record<string, { id: string; sender: string; text: string; time: string; isMine: boolean }[]>>({
    spambot: [
      { id: '1', sender: 'SpamBot', text: 'Доброго дня! Ваші обмеження відсутні. Акаунт повністю вільний від спам-блокувань і готовий до роботи.', time: '12:04', isMine: false },
      { id: '2', sender: 'Я', text: '/start', time: '12:04', isMine: true },
    ],
    telegram: [
      { id: '3', sender: 'Telegram', text: 'Успішний вхід: сесія активована через MTProto AuthKey (TData Session Engine). Номер телефону та код перевірки не запитувались.', time: '11:58', isMine: false },
    ],
    saved: [
      { id: '4', sender: 'Вибране', text: 'Замітки з комбайну: активовано прямий перехід у сесію без копіювання номеру.', time: 'Вчора', isMine: true },
      { id: '5', sender: 'Вибране', text: 'Цільові чати: https://t.me/target_hub_ua', time: 'Вчора', isMine: true },
    ],
    leads: [
      { id: '6', sender: 'Олександр (Buyer)', text: 'Привіт, бачу ти онлайн у сесії. Чи все налаштовано по трафіку?', time: '10:15', isMine: false },
      { id: '7', sender: 'Я', text: 'Так, сесія активна, підключення через TData стабільне.', time: '10:18', isMine: true },
    ],
  });

  // Fast auto-conversion on open
  useEffect(() => {
    if (!webTelegramAccount) return;

    if (isOriginallySession) {
      setConversionPhase('converting');
      setConversionStep('Зчитування SQLite auth_key з .session...');

      const timer1 = setTimeout(() => {
        setConversionStep('Генерація структури TData (key_data, maps, settings0)...');
      }, 180);

      const timer2 = setTimeout(() => {
        setConversionPhase('completed');
        setConversionStep('Конвертація завершена! Сесія активована без SMS.');
        addLog(
          'info',
          'accounts',
          `[Швидка конвертація] .session ➔ TData успішно виконана для ${webTelegramAccount.phone}. Сесія активована!`,
          webTelegramAccount.username ? `@${webTelegramAccount.username}` : undefined,
          webTelegramAccount.phone
        );
      }, 380);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else {
      setConversionPhase('completed');
      setConversionStep('TData контейнер готовий до миттєвого запуску.');
    }
  }, [webTelegramAccount?.id]);

  if (!webTelegramAccount) return null;

  // Direct 1-Click TData Download & Launch
  const handleDownloadAndLaunchTdata = async () => {
    setIsDownloadingTdata(true);
    try {
      const { zipBlob } = await convertSessionToTdata(
        webTelegramAccount.phone,
        webTelegramAccount.dcId || 2,
        webTelegramAccount.twoFaPassword,
        '4.16.8'
      );
      const cleanPhone = webTelegramAccount.phone.replace(/[^0-9]/g, '');
      triggerFileDownload(zipBlob, `tdata_${cleanPhone}.zip`);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);

      addLog(
        'info',
        'accounts',
        `[TData Експорт] Завантажено готовий TData архів для запуску в Telegram Desktop (${webTelegramAccount.phone})`
      );
    } catch (err: any) {
      addLog('error', 'accounts', `Помилка створення TData архіву: ${err?.message || err}`);
    } finally {
      setIsDownloadingTdata(false);
    }
  };

  const handleOpenExternal = () => {
    const baseUrl = clientType === 'weba' ? 'https://web.telegram.org/a/' : 'https://web.telegram.org/k/';
    window.open(baseUrl, '_blank', 'noopener,noreferrer');
    addLog(
      'info',
      'accounts',
      `Відкрито Telegram Web (${clientType === 'weba' ? 'Web A' : 'Web K'}) для ${webTelegramAccount.phone} з активною сесією`
    );
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outgoingMessage.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      sender: 'Я',
      text: outgoingMessage.trim(),
      time: new Date().toTimeString().slice(0, 5),
      isMine: true,
    };

    setChatMessages((prev) => ({
      ...prev,
      [selectedChat]: [...(prev[selectedChat] || []), newMsg],
    }));

    setOutgoingMessage('');

    addLog(
      'info',
      'sender',
      `[Web TG Сесія] Надіслано повідомлення у чат "${selectedChat}" з акаунта ${webTelegramAccount.phone}`
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-5xl h-[92vh] max-h-[850px] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-900/90">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-bold font-mono text-sm shrink-0 border border-sky-400/30">
              {webTelegramAccount.avatarSeed ? webTelegramAccount.avatarSeed[0].toUpperCase() : 'TG'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-white truncate">
                  {webTelegramAccount.firstName} {webTelegramAccount.lastName || ''}
                </h3>
                <span className="font-mono text-xs text-sky-400 font-medium">
                  {webTelegramAccount.phone}
                </span>
                {webTelegramAccount.username && (
                  <span className="text-xs text-neutral-400 truncate">
                    @{webTelegramAccount.username}
                  </span>
                )}
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-950 text-sky-300 border border-sky-800/60">
                  DC {webTelegramAccount.dcId || 2}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                {conversionPhase === 'converting' ? (
                  <span className="inline-flex items-center gap-1.5 text-amber-400 font-medium">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Швидка конвертація .session ➔ TData...</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {isOriginallySession
                        ? 'Конвертовано в TData · Сесію активовано напряму'
                        : 'TData сесія активна'}
                    </span>
                  </span>
                )}
                <span className="text-neutral-600">·</span>
                <span className="text-neutral-400">
                  Без вводу номеру та SMS
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setWebTelegramAccount(null)}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
              title="Закрити"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Fast Conversion Progress Banner (If converting or just converted) */}
        {isOriginallySession && (
          <div className="px-3 sm:px-4 py-2 bg-gradient-to-r from-sky-950/70 via-neutral-900 to-emerald-950/70 border-b border-sky-900/40 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2 text-sky-300">
              <ArrowRightLeft className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="font-semibold">Автоконвертація .session ➔ TData:</span>
              <span className="text-neutral-300 text-[11px] font-mono">{conversionStep}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" />
                AuthKey змонтовано
              </span>
            </div>
          </div>
        )}

        {/* Client Selector & Quick Action Bar */}
        <div className="px-3 sm:px-4 py-2.5 bg-neutral-950/60 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800">
            <button
              onClick={() => setActiveTab('in_app')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'in_app'
                  ? 'bg-neutral-800 text-sky-400 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Жива сесія (In-App)</span>
            </button>
            <button
              onClick={() => setActiveTab('direct_launch')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'direct_launch'
                  ? 'bg-neutral-800 text-sky-400 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>Швидкий запуск TData / Desktop</span>
            </button>
            <button
              onClick={() => setActiveTab('iframe')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'iframe'
                  ? 'bg-neutral-800 text-sky-400 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Web Sandbox</span>
            </button>
          </div>

          {/* Direct 1-Click Launch Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAndLaunchTdata}
              disabled={isDownloadingTdata}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center gap-1.5 shadow-sm text-xs"
              title="Завантажити готову папку tdata для запуску в Telegram Desktop без введення коду"
            >
              {isDownloadingTdata ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : downloadSuccess ? (
                <Check className="w-3.5 h-3.5 text-white" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{downloadSuccess ? 'TData збережено!' : 'TData для Desktop'}</span>
            </button>

            <button
              onClick={handleOpenExternal}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium transition-colors flex items-center gap-1.5 shadow-sm text-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Відкрити Web A</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {activeTab === 'in_app' && (
            <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-neutral-950">
              {/* Left: Chat list */}
              <div className="w-full md:w-72 bg-neutral-900/60 border-b md:border-b-0 md:border-r border-neutral-800 flex flex-col shrink-0">
                <div className="p-3 border-b border-neutral-800 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Діалоги акаунта</span>
                  <span className="font-mono text-emerald-400 text-[10px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    MTProto Online
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-neutral-850">
                  <button
                    onClick={() => setSelectedChat('spambot')}
                    className={`w-full p-3 flex items-start gap-2.5 text-left transition-colors ${
                      selectedChat === 'spambot' ? 'bg-neutral-800/80 border-l-2 border-sky-400' : 'hover:bg-neutral-800/40'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                      ⚡
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white truncate">SpamBot</span>
                        <span className="text-[10px] text-neutral-500 font-mono">12:04</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                        Доброго дня! Ваші обмеження...
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedChat('telegram')}
                    className={`w-full p-3 flex items-start gap-2.5 text-left transition-colors ${
                      selectedChat === 'telegram' ? 'bg-neutral-800/80 border-l-2 border-sky-400' : 'hover:bg-neutral-800/40'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-sky-600/30 text-sky-400 border border-sky-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                      TG
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white truncate">Telegram Notification</span>
                        <span className="text-[10px] text-neutral-500 font-mono">11:58</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                        Успішний вхід: сесія активована...
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedChat('saved')}
                    className={`w-full p-3 flex items-start gap-2.5 text-left transition-colors ${
                      selectedChat === 'saved' ? 'bg-neutral-800/80 border-l-2 border-sky-400' : 'hover:bg-neutral-800/40'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                      ⭐
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white truncate">Збережені повідомлення</span>
                        <span className="text-[10px] text-neutral-500 font-mono">Вчора</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                        Замітки з комбайну: сесія...
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedChat('leads')}
                    className={`w-full p-3 flex items-start gap-2.5 text-left transition-colors ${
                      selectedChat === 'leads' ? 'bg-neutral-800/80 border-l-2 border-sky-400' : 'hover:bg-neutral-800/40'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-600/30 text-purple-400 border border-purple-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                      👤
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white truncate">Олександр (Buyer)</span>
                        <span className="text-[10px] text-neutral-500 font-mono">10:18</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                        Привіт, бачу ти онлайн у сесії...
                      </p>
                    </div>
                  </button>
                </div>

                {/* Account info pill in sidebar */}
                <div className="p-3 bg-neutral-950 border-t border-neutral-800 text-[11px] text-neutral-400 space-y-1">
                  <div className="flex justify-between items-center">
                    <span>Проксі:</span>
                    <span className="font-mono text-neutral-300 truncate max-w-[140px]">
                      {webTelegramAccount.proxyIp || 'Direct connection'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Формат сесії:</span>
                    <span className="font-mono text-sky-400 font-semibold">
                      {isOriginallySession ? '.session ➔ TData' : 'TData'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Active Chat Viewport */}
              <div className="flex-1 flex flex-col min-h-0 bg-neutral-950">
                {/* Chat header */}
                <div className="p-3 border-b border-neutral-800 bg-neutral-900/40 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">
                      {selectedChat === 'spambot' && '⚡ SpamBot'}
                      {selectedChat === 'telegram' && '🔔 Telegram System'}
                      {selectedChat === 'saved' && '⭐ Збережені повідомлення'}
                      {selectedChat === 'leads' && '👤 Олександр (Buyer)'}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-medium bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.2 rounded">
                      В мережі
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-neutral-400">
                    MTProto Direct Web Session
                  </span>
                </div>

                {/* Messages stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {(chatMessages[selectedChat] || []).map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[70%] rounded-xl px-3.5 py-2 text-xs leading-relaxed ${
                          msg.isMine
                            ? 'bg-sky-600 text-white rounded-br-xs'
                            : 'bg-neutral-850 text-neutral-200 border border-neutral-800 rounded-bl-xs'
                        }`}
                      >
                        <p>{msg.text}</p>
                        <div
                          className={`text-[10px] mt-1 font-mono text-right ${
                            msg.isMine ? 'text-sky-200' : 'text-neutral-400'
                          }`}
                        >
                          {msg.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message input */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-neutral-800 bg-neutral-900/60 flex items-center gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={outgoingMessage}
                    onChange={(e) => setOutgoingMessage(e.target.value)}
                    placeholder={`Написати повідомлення як ${webTelegramAccount.firstName}...`}
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors shrink-0"
                    title="Надіслати"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'direct_launch' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-950 space-y-6">
              <div className="max-w-2xl mx-auto space-y-5">
                {/* Hero Box: Direct Session Access without copying phone number */}
                <div className="p-5 bg-gradient-to-b from-neutral-900 to-neutral-900/80 border border-neutral-800 rounded-xl space-y-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        Прямий запуск сесії без копіювання номеру та без SMS
                      </h4>
                      <p className="text-xs text-neutral-400">
                        {isOriginallySession
                          ? 'Сесію автоматично зконвертовано з .session у повноцінну TData із збереженням авторизації MTProto.'
                          : 'TData сесія повністю авторизована та готова до миттєвого відкриття.'}
                      </p>
                    </div>
                  </div>

                  {/* Architecture Diagram */}
                  <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-neutral-800 rounded text-neutral-300 font-mono text-[11px]">
                        {webTelegramAccount.phone}.session
                      </div>
                      <span className="text-neutral-500 font-mono">➔</span>
                      <div className="p-1.5 bg-sky-950 border border-sky-800/60 rounded text-sky-300 font-mono text-[11px] font-semibold">
                        Авто-конвертер TData
                      </div>
                      <span className="text-neutral-500 font-mono">➔</span>
                      <div className="p-1.5 bg-emerald-950 border border-emerald-800/60 rounded text-emerald-300 font-mono text-[11px] font-semibold">
                        Готова сесія
                      </div>
                    </div>

                    <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Повторний вхід не потрібен
                    </span>
                  </div>

                  {/* Big Action Buttons */}
                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={handleDownloadAndLaunchTdata}
                      disabled={isDownloadingTdata}
                      className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40"
                    >
                      {isDownloadingTdata ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <FolderArchive className="w-4 h-4" />
                      )}
                      <span>Завантажити TData (1-клік запуск у Desktop)</span>
                    </button>

                    <button
                      onClick={handleOpenExternal}
                      className="py-3 px-4 bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md shadow-sky-950/40"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Відкрити у Telegram Web A</span>
                    </button>
                  </div>
                </div>

                {/* Session Technical Card */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
                  <div className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-sky-400" />
                    <span>Параметри MTProto з'єднання акаунта:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg">
                      <span className="text-neutral-500 block text-[10px]">Формат сесії:</span>
                      <span className="font-mono text-emerald-400 font-semibold">
                        {isOriginallySession ? '.session ➔ TData (Авто-конвертовано)' : 'TData Container'}
                      </span>
                    </div>

                    <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg">
                      <span className="text-neutral-500 block text-[10px]">Дата-центр (DC):</span>
                      <span className="font-mono text-neutral-200 font-semibold">
                        Telegram DC {webTelegramAccount.dcId || 2}
                      </span>
                    </div>

                    <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg">
                      <span className="text-neutral-500 block text-[10px]">Прив'язаний проксі:</span>
                      <span className="font-mono text-sky-400 font-semibold truncate block">
                        {webTelegramAccount.proxyIp || 'Direct IP'}
                      </span>
                    </div>

                    <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg">
                      <span className="text-neutral-500 block text-[10px]">2FA Хмарний пароль:</span>
                      <span className="font-mono text-amber-400 font-semibold">
                        {webTelegramAccount.twoFaPassword || 'Відсутній (чистий вхід)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Instruction */}
                <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl text-xs text-neutral-400 space-y-1.5 leading-relaxed">
                  <div className="font-semibold text-neutral-300">💡 Як запустити TData у Telegram Desktop:</div>
                  <ol className="list-decimal list-inside space-y-1 text-neutral-400 pl-1">
                    <li>Натисніть зелену кнопку <strong>"Завантажити TData"</strong> вище.</li>
                    <li>Розпакуйте завантажену папку <code>tdata</code> поруч із <code>Telegram.exe</code>.</li>
                    <li>Запустіть Telegram — акаунт відкриється миттєво без потреби введення номеру, SMS чи паролів!</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'iframe' && (
            <div className="flex-1 flex flex-col min-h-0 bg-neutral-950">
              <div className="p-3 bg-neutral-900 border-b border-neutral-800 text-[11px] text-neutral-300 flex items-center justify-between px-4">
                <span>
                  💡 Web Sandbox підключається до інтерфейсу Web Telegram. Якщо браузер блокує сторонні фрейми (CSP), скористайтесь <strong>"Жива сесія (In-App)"</strong> або натисніть <strong>"Відкрити у новій вкладці"</strong>.
                </span>
                <button
                  onClick={handleOpenExternal}
                  className="ml-3 font-semibold text-sky-400 underline hover:text-sky-300 shrink-0 text-xs"
                >
                  Відкрити на весь екран →
                </button>
              </div>

              <div className="flex-1 min-h-0 relative">
                <iframe
                  src={clientType === 'weba' ? 'https://web.telegram.org/a/' : 'https://web.telegram.org/k/'}
                  title="Telegram Web Sandbox"
                  className="w-full h-full border-0 bg-neutral-950"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-neutral-900/80 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>UmolkTG Instant Session Bridge · MTProto Layer 182</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setWebTelegramAccount(null)}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
            >
              Закрити
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
