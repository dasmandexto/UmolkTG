import React, { useState } from 'react';
import { useCombiner } from '../../context/CombinerContext';
import { ParsedUser } from '../../types';
import {
  Search,
  Filter,
  Download,
  Send,
  UserPlus,
  RefreshCw,
  CheckCircle,
  Sparkles,
  Users,
} from 'lucide-react';

export const AudienceParser: React.FC = () => {
  const {
    t,
    parsedUsers,
    setParsedUsers,
    setTargetRecipientsText,
    setActiveModule,
    addLog,
  } = useCombiner();

  const [targetChat, setTargetChat] = useState('@ton_community_chat');
  const [scrapeMode, setScrapeMode] = useState<string>('active_3d');
  const [onlyUsername, setOnlyUsername] = useState(true);
  const [excludeBots, setExcludeBots] = useState(true);
  const [hasAvatar, setHasAvatar] = useState(true);
  const [onlyPremium, setOnlyPremium] = useState(false);
  const [bioKeywords, setBioKeywords] = useState('crypto, trader, ton');

  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);

  const handleStartParsing = () => {
    if (!targetChat.trim()) return;

    setIsParsing(true);
    setParseProgress(15);
    addLog('info', 'parser', `Инициализация подключения к донорскому чату ${targetChat} через MTProto`);

    setTimeout(() => {
      setParseProgress(45);
      addLog('info', 'parser', `Чат определен как Supergroup (ID: -100184910284). Сбор истории сообщений...`);
    }, 900);

    setTimeout(() => {
      setParseProgress(80);
      addLog('info', 'parser', `Фильтрация: исключение ботов, проверка наличия аватарок и даты последнего визита`);
    }, 1800);

    setTimeout(() => {
      setParseProgress(100);
      setIsParsing(false);

      const newFound: ParsedUser[] = [
        {
          id: `p-${Date.now()}-1`,
          userId: '891048291',
          username: 'ton_investor_alex',
          firstName: 'Александр',
          lastName: 'Медведев',
          phone: '+7 915 391-**-**',
          hasAvatar: true,
          isPremium: true,
          isBot: false,
          lastSeen: 'был недавно',
          bio: 'TON & DeFi developer, crypto enthusiast',
          messagesInChat: 64,
        },
        {
          id: `p-${Date.now()}-2`,
          userId: '710294821',
          username: 'kristina_arbitrage',
          firstName: 'Кристина',
          lastName: 'Новикова',
          hasAvatar: true,
          isPremium: false,
          isBot: false,
          lastSeen: 'был сегодня в 11:20',
          bio: 'Арбитраж крипты, P2P связки',
          messagesInChat: 28,
        },
        {
          id: `p-${Date.now()}-3`,
          userId: '601928471',
          username: 'gleb_ton_founder',
          firstName: 'Глеб',
          hasAvatar: true,
          isPremium: true,
          isBot: false,
          lastSeen: 'был недавно',
          bio: 'Building Web3 Telegram Mini Apps',
          messagesInChat: 92,
        },
      ];

      setParsedUsers((prev) => [...newFound, ...prev]);
      addLog('success', 'parser', `Парсинг успешно завершен! Собрано и отфильтровано +3 свежих контакта из ${targetChat}`);
    }, 2600);
  };

  const handleExportTxt = () => {
    const content = parsedUsers.map((u) => `@${u.username}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `teleraptor_parsed_${Date.now()}.txt`;
    link.click();
    addLog('info', 'parser', `Экспорт ${parsedUsers.length} юзернеймов в TXT файл`);
  };

  const handlePushToSender = () => {
    const list = parsedUsers.map((u) => `@${u.username}`).join('\n');
    setTargetRecipientsText(list);
    addLog('info', 'sender', `База из ${parsedUsers.length} контактов передана в модуль Рассылки`);
    setActiveModule('sender');
  };

  const handlePushToInviter = () => {
    const list = parsedUsers.map((u) => `@${u.username}`).join('\n');
    setTargetRecipientsText(list);
    addLog('info', 'inviter', `База из ${parsedUsers.length} контактов передана в Инвайтер`);
    setActiveModule('inviter');
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-sky-400" />
            <span>{t.navParser}</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Сбор целевой аудитории из групп, каналов, комментариев и геолокаций с глубокой фильтрацией
          </p>
        </div>

        {parsedUsers.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePushToSender}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-600 rounded transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t.btnPushToSender}</span>
            </button>

            <button
              onClick={handlePushToInviter}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-purple-700 hover:bg-purple-600 rounded transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t.btnPushToInviter}</span>
            </button>
          </div>
        )}
      </div>

      {/* Target & Options Configurator */}
      <div className="bg-neutral-900 border border-neutral-800 rounded p-4 space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Target chat link */}
          <div className="md:col-span-2">
            <label className="block text-neutral-300 font-medium mb-1.5">
              {t.parserTargetChat}
            </label>
            <input
              type="text"
              value={targetChat}
              onChange={(e) => setTargetChat(e.target.value)}
              placeholder={t.parserPlaceholderChat}
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>

          {/* Mode */}
          <div>
            <label className="block text-neutral-300 font-medium mb-1.5">
              {t.parserMode}
            </label>
            <select
              value={scrapeMode}
              onChange={(e) => setScrapeMode(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-sky-500"
            >
              <option value="active_3d">{t.modeActiveDays}</option>
              <option value="all_members">{t.modeAllMembers}</option>
              <option value="writers">{t.modeMessageWriters}</option>
              <option value="commenters">{t.modeCommenters}</option>
              <option value="admins">{t.modeAdmins}</option>
            </select>
          </div>
        </div>

        {/* Cleaning Filters */}
        <div className="pt-2 border-t border-neutral-800">
          <div className="text-neutral-400 font-medium mb-2.5 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-sky-400" />
            <span>{t.parserFilters}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="flex items-center gap-2 text-neutral-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyUsername}
                onChange={(e) => setOnlyUsername(e.target.checked)}
                className="rounded bg-neutral-950 border-neutral-700 text-sky-500 focus:ring-0"
              />
              <span>{t.filterOnlyWithUsername}</span>
            </label>

            <label className="flex items-center gap-2 text-neutral-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={excludeBots}
                onChange={(e) => setExcludeBots(e.target.checked)}
                className="rounded bg-neutral-950 border-neutral-700 text-sky-500 focus:ring-0"
              />
              <span>{t.filterExcludeBots}</span>
            </label>

            <label className="flex items-center gap-2 text-neutral-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasAvatar}
                onChange={(e) => setHasAvatar(e.target.checked)}
                className="rounded bg-neutral-950 border-neutral-700 text-sky-500 focus:ring-0"
              />
              <span>{t.filterHasAvatar}</span>
            </label>

            <label className="flex items-center gap-2 text-neutral-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyPremium}
                onChange={(e) => setOnlyPremium(e.target.checked)}
                className="rounded bg-neutral-950 border-neutral-700 text-sky-500 focus:ring-0"
              />
              <span>{t.filterOnlyPremium}</span>
            </label>
          </div>

          {/* Keywords input */}
          <div className="mt-3">
            <label className="block text-neutral-400 text-[11px] mb-1">
              {t.filterKeywordBio}
            </label>
            <input
              type="text"
              value={bioKeywords}
              onChange={(e) => setBioKeywords(e.target.value)}
              placeholder="крипта, трейдинг, ton, btc, менеджер..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Start button & Progress */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            disabled={isParsing}
            onClick={handleStartParsing}
            className="w-full sm:w-auto px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isParsing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Парсинг аудитории ({parseProgress}%)...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t.btnStartParsing}</span>
              </>
            )}
          </button>

          <div className="text-[11px] text-neutral-400 flex items-center gap-3">
            <span>{t.parsedResultsCount}: <b className="font-mono text-white text-xs">{parsedUsers.length}</b></span>
            <button
              onClick={handleExportTxt}
              className="text-neutral-400 hover:text-white flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.btnExportTxt}</span>
            </button>
          </div>
        </div>

        {isParsing && (
          <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 transition-all duration-300"
              style={{ width: `${parseProgress}%` }}
            ></div>
          </div>
        )}
      </div>

      {/* Results Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between text-xs">
          <div className="font-medium text-neutral-300 flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-400" />
            <span>База спарсенных пользователей</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-medium">
              <tr>
                <th className="py-2.5 px-3">Юзернейм</th>
                <th className="py-2.5 px-3">Имя / Фамилия</th>
                <th className="py-2.5 px-3">Telegram ID</th>
                <th className="py-2.5 px-3">Premium</th>
                <th className="py-2.5 px-3">Последний визит</th>
                <th className="py-2.5 px-3 text-right">Сообщений в чате</th>
                <th className="py-2.5 px-3">Био / Описание</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-mono text-[11px]">
              {parsedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-neutral-800/40 transition-colors">
                  <td className="py-2.5 px-3 text-sky-400 font-medium">
                    @{user.username}
                  </td>
                  <td className="py-2.5 px-3 font-sans text-neutral-200">
                    {user.firstName} {user.lastName || ''}
                  </td>
                  <td className="py-2.5 px-3 text-neutral-400 tabular-nums">
                    {user.userId}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`${
                        user.isPremium ? 'text-amber-400 font-semibold' : 'text-neutral-500'
                      }`}
                    >
                      {user.isPremium ? 'Premium ⭐' : 'Regular'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-sans text-neutral-400">
                    {user.lastSeen}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-neutral-300">
                    {user.messagesInChat || 0}
                  </td>
                  <td className="py-2.5 px-3 font-sans text-neutral-400 truncate max-w-xs">
                    {user.bio || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
