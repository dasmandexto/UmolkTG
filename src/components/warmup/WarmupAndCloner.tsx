import React, { useState } from 'react';
import { useCombiner } from '../../context/CombinerContext';
import {
  Flame,
  Copy,
  MessageSquare,
  ThumbsUp,
  Globe,
  Play,
  CheckCircle,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

export const WarmupAndCloner: React.FC = () => {
  const { t, accounts, createTask, addLog } = useCombiner();

  const [activeTab, setActiveTab] = useState<'warmup' | 'cloner'>('warmup');

  // Warmup state
  const [warmupMode, setWarmupMode] = useState<'matrix' | 'reactions' | 'all'>('all');
  const [intensity, setIntensity] = useState<'light' | 'medium' | 'high'>('medium');
  const [dialogueTopic, setDialogueTopic] = useState('Криптовалюты, IT новости, погода, бытовые темы');
  const [channelsList, setChannelsList] = useState('@telegram\n@durov\n@bbbreaking\n@toncoin');
  const [emojisList, setEmojisList] = useState('👍, 🔥, ❤️, 👏, 🎉');

  // Cloner state
  const [donorChannel, setDonorChannel] = useState('@crypto_donor_news');
  const [targetChannel, setTargetChannel] = useState('@my_crypto_hub_vip');
  const [cloneCount, setCloneCount] = useState(25);
  const [copyAvatarBio, setCopyAvatarBio] = useState(true);
  const [replaceLinks, setReplaceLinks] = useState(true);
  const [replaceFrom, setReplaceFrom] = useState('t.me/donor_ref');
  const [replaceTo, setReplaceTo] = useState('t.me/my_partner_ref');

  const warmingAccs = accounts.filter((a) => a.status === 'warming' || a.status === 'active');

  const handleStartWarmup = () => {
    createTask({
      name: `Интеллектуальный прогрев сетки (${intensity.toUpperCase()})`,
      type: 'warmup',
      progressTotal: warmingAccs.length * 10,
      speedPerMin: 4.5,
      accountsAssigned: Math.min(6, warmingAccs.length),
      delayRange: [30, 90],
      messagePreview: `Диалоги: ${warmupMode === 'matrix' || warmupMode === 'all' ? 'ВКЛ' : 'ВЫКЛ'}, Реакции: ВКЛ`,
    });

    addLog('info', 'warmup', `Запущен прогрев для ${warmingAccs.length} аккаунтов. Тематика диалогов: "${dialogueTopic}"`);
  };

  const handleStartCloner = () => {
    if (!donorChannel || !targetChannel) {
      alert('Укажите донорский и целевой каналы!');
      return;
    }

    createTask({
      name: `Клонирование постов: ${donorChannel} → ${targetChannel}`,
      type: 'cloner',
      progressTotal: cloneCount,
      speedPerMin: 8.0,
      accountsAssigned: 1,
      delayRange: [5, 12],
      targetChat: targetChannel,
      messagePreview: `Копирование ${cloneCount} постов с заменой ссылок: ${replaceFrom} -> ${replaceTo}`,
    });

    addLog('info', 'system', `Запущен клонер канала ${donorChannel} в ${targetChannel} (${cloneCount} постов)`);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Top Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>{t.navWarmup}</span>
          </h2>
          <p className="text-neutral-400 mt-0.5">
            Прокачка трастового рейтинга свежих аккаунтов и быстрое наполнение каналов контентом
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded border border-neutral-800">
          <button
            onClick={() => setActiveTab('warmup')}
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              activeTab === 'warmup'
                ? 'bg-neutral-800 text-amber-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {t.warmupTitle}
          </button>
          <button
            onClick={() => setActiveTab('cloner')}
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              activeTab === 'cloner'
                ? 'bg-neutral-800 text-sky-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {t.clonerTitle}
          </button>
        </div>
      </div>

      {activeTab === 'warmup' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Warmup Main Form */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded p-4 space-y-4">
              <div>
                <label className="block text-neutral-300 font-medium mb-1.5">
                  Режим прогрева
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setWarmupMode('all')}
                    className={`p-3 rounded border text-left transition-colors ${
                      warmupMode === 'all'
                        ? 'bg-amber-950/40 border-amber-600 text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <div className="font-semibold text-xs mb-1 text-amber-400">
                      Комплексный (Все опции)
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Диалоги между ботами + чтение каналов + эмодзи-реакции.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWarmupMode('matrix')}
                    className={`p-3 rounded border text-left transition-colors ${
                      warmupMode === 'matrix'
                        ? 'bg-amber-950/40 border-amber-600 text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <div className="font-semibold text-xs mb-1 text-amber-400">
                      Матрица диалогов
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Взаимная переписка в ЛС со случайными интервалами и паузами.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWarmupMode('reactions')}
                    className={`p-3 rounded border text-left transition-colors ${
                      warmupMode === 'reactions'
                        ? 'bg-amber-950/40 border-amber-600 text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <div className="font-semibold text-xs mb-1 text-amber-400">
                      Скроллинг и реакции
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Просмотр постов, прокрутка ленты, оставление реакций 👍🔥.
                    </div>
                  </button>
                </div>
              </div>

              {/* Dialogue topics */}
              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  Тематики реплик для диалогов:
                </label>
                <input
                  type="text"
                  value={dialogueTopic}
                  onChange={(e) => setDialogueTopic(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-neutral-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Channels for scrolling */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    Каналы для чтения и реакций:
                  </label>
                  <textarea
                    rows={4}
                    value={channelsList}
                    onChange={(e) => setChannelsList(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2.5 font-mono text-neutral-200 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    Пул реакций (эмодзи):
                  </label>
                  <input
                    type="text"
                    value={emojisList}
                    onChange={(e) => setEmojisList(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-neutral-200 focus:outline-none focus:border-amber-500 mb-3"
                  />
                  <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800 text-[11px] text-neutral-400">
                    <span className="text-amber-400 font-medium">Эмуляция поведения: </span>
                    случайный просмотр 3–8 постов, пауза 12–40 секунд, шанс реакции 60%.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Warmup Right Panel */}
          <div className="space-y-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded p-4 space-y-4">
              <div className="text-neutral-300 font-semibold">
                Интенсивность прогрева
              </div>

              <div className="space-y-2">
                {[
                  { id: 'light', label: 'Щадящий (0-3 дня)', desc: 'Минимум действий, 1-2 диалога в день' },
                  { id: 'medium', label: 'Оптимальный (3-14 дней)', desc: 'Баланс диалогов и активности' },
                  { id: 'high', label: 'Активный (14+ дней)', desc: 'Полная имитация живого пользователя' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIntensity(item.id as any)}
                    className={`w-full p-2.5 rounded border text-left transition-colors ${
                      intensity === item.id
                        ? 'bg-amber-950/40 border-amber-600 text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <div className="font-semibold text-xs text-neutral-200">{item.label}</div>
                    <div className="text-[11px] text-neutral-400">{item.desc}</div>
                  </button>
                ))}
              </div>

              <div className="p-3 bg-neutral-950 rounded border border-neutral-800 space-y-1.5 text-[11px] text-neutral-400">
                <div className="flex justify-between">
                  <span>Аккаунтов на прогреве:</span>
                  <span className="font-mono text-amber-400 font-bold">{warmingAccs.length} шт</span>
                </div>
                <div className="flex justify-between">
                  <span>Ожидаемый прирост траста:</span>
                  <span className="font-mono text-emerald-400">+25% к лимитам</span>
                </div>
              </div>

              <button
                onClick={handleStartWarmup}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded transition-colors flex items-center justify-center gap-2"
              >
                <Flame className="w-4 h-4" />
                <span>Запустить прогрев аккаунтов</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cloner' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1.5">
                    {t.donorChannel}
                  </label>
                  <input
                    type="text"
                    value={donorChannel}
                    onChange={(e) => setDonorChannel(e.target.value)}
                    placeholder="@donor_crypto_news"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-200 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1.5">
                    {t.targetChannel}
                  </label>
                  <input
                    type="text"
                    value={targetChannel}
                    onChange={(e) => setTargetChannel(e.target.value)}
                    placeholder="@my_channel_vip"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-200 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3 pt-2 border-t border-neutral-800">
                <label className="flex items-center gap-2 text-neutral-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={copyAvatarBio}
                    onChange={(e) => setCopyAvatarBio(e.target.checked)}
                    className="rounded bg-neutral-950 border-neutral-700 text-sky-500 focus:ring-0"
                  />
                  <span>{t.cloneAvatarsBio}</span>
                </label>

                <div className="flex items-center gap-3">
                  <label className="text-neutral-300">
                    {t.cloneLastPosts}:
                  </label>
                  <input
                    type="number"
                    value={cloneCount}
                    onChange={(e) => setCloneCount(Number(e.target.value))}
                    className="w-24 bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-neutral-200 font-mono"
                  />
                </div>

                <label className="flex items-center gap-2 text-neutral-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={replaceLinks}
                    onChange={(e) => setReplaceLinks(e.target.checked)}
                    className="rounded bg-neutral-950 border-neutral-700 text-sky-500 focus:ring-0"
                  />
                  <span>{t.replaceLinks}</span>
                </label>

                {replaceLinks && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                    <div>
                      <label className="block text-neutral-400 text-[11px] mb-1">
                        Заменять ссылку:
                      </label>
                      <input
                        type="text"
                        value={replaceFrom}
                        onChange={(e) => setReplaceFrom(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-neutral-200 font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-400 text-[11px] mb-1">
                        На вашу ссылку:
                      </label>
                      <input
                        type="text"
                        value={replaceTo}
                        onChange={(e) => setReplaceTo(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-neutral-200 font-mono text-[11px]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded p-4 space-y-4">
              <div className="text-neutral-300 font-semibold">
                Сводка клонирования
              </div>

              <div className="p-3 bg-neutral-950 rounded border border-neutral-800 space-y-2 text-[11px] text-neutral-400">
                <div className="flex justify-between">
                  <span>Объем постов:</span>
                  <span className="font-mono text-white">{cloneCount} сообщений</span>
                </div>
                <div className="flex justify-between">
                  <span>Медиа:</span>
                  <span className="font-mono text-emerald-400">Фото, видео, опросы</span>
                </div>
                <div className="flex justify-between">
                  <span>Интервал публикации:</span>
                  <span className="font-mono text-neutral-200">5–12 сек / пост</span>
                </div>
              </div>

              <button
                onClick={handleStartCloner}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded transition-colors flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                <span>{t.btnStartCloner}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
