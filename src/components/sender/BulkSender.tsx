import React, { useState } from 'react';
import { useCombiner } from '../../context/CombinerContext';
import { evaluateSpintax, generateSpintaxSamples } from '../../utils/spintax';
import {
  Send,
  Sparkles,
  Shuffle,
  Paperclip,
  Mic,
  Link,
  Clock,
  Shield,
  Layers,
  CheckCircle,
  Copy,
  Users,
} from 'lucide-react';

export const BulkSender: React.FC = () => {
  const {
    t,
    accounts,
    createTask,
    targetRecipientsText,
    setTargetRecipientsText,
    addLog,
  } = useCombiner();

  const [campaignName, setCampaignName] = useState('Рассылка по крипто-базе #5');
  const [senderMode, setSenderMode] = useState<'dm' | 'chat' | 'comments'>('dm');
  const [messageTemplate, setMessageTemplate] = useState(
    '{Привет|Здравствуйте|Доброго дня}, {друг|партнер}! 🚀\n\nВидел твою активность в крипто-комьюнити. Мы запускаем закрытый пул по арбитражу спредов на TON.\n\n{Интересно взглянуть?|Хочешь получить доступ к тестам?}\n\n[Подробнее в канале|https://t.me/ton_insider_vip]'
  );

  const [minDelay, setMinDelay] = useState(18);
  const [maxDelay, setMaxDelay] = useState(35);
  const [limitPerAcc, setLimitPerAcc] = useState(30);
  const [threads, setThreads] = useState(5);
  const [isVoiceNote, setIsVoiceNote] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [hasButtons, setHasButtons] = useState(true);

  // Spintax Preview state
  const [spintaxSamples, setSpintaxSamples] = useState<string[]>([]);
  const [showSpintaxBox, setShowSpintaxBox] = useState(false);

  // Calculate target lines
  const targetLines = targetRecipientsText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const activeAccountsCount = accounts.filter((a) => a.status === 'active').length;
  const maxPossibleMessages = activeAccountsCount * limitPerAcc;

  const handleTestSpintax = () => {
    const samples = generateSpintaxSamples(messageTemplate, 3);
    setSpintaxSamples(samples);
    setShowSpintaxBox(true);
  };

  const insertTag = (tag: string) => {
    setMessageTemplate((prev) => prev + tag);
  };

  const handleLaunchCampaign = () => {
    if (targetLines.length === 0) {
      alert('Пожалуйста, укажите хотя бы одного получателя!');
      return;
    }

    createTask({
      name: campaignName,
      type: senderMode === 'dm' ? 'sender_dm' : senderMode === 'chat' ? 'sender_chat' : 'sender_dm',
      progressTotal: targetLines.length,
      speedPerMin: 12.5,
      accountsAssigned: Math.min(threads, activeAccountsCount),
      delayRange: [minDelay, maxDelay],
      targetChat: targetLines[0],
      messagePreview: messageTemplate.slice(0, 80) + '...',
    });

    addLog('info', 'sender', `Запущена новая кампания рассылки: "${campaignName}" на ${targetLines.length} контактов`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-emerald-400" />
            <span>{t.navSender}</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Массовая отправка сообщений в ЛС, чаты и комментарии с защитой от банов и умным Spintax
          </p>
        </div>

        <div className="text-xs text-neutral-400 flex items-center gap-2">
          <span>Готовых аккаунтов:</span>
          <span className="font-mono text-emerald-400 font-bold tabular-nums">
            {activeAccountsCount}
          </span>
          <span>· Лимит пула: ~{maxPossibleMessages} сообщ.</span>
        </div>
      </div>

      {/* Main Grid: Left Editor & Right Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-xs">
        {/* Left Column (2 cols): Recipient List & Message Body */}
        <div className="lg:col-span-2 space-y-4">
          {/* Campaign Title & Mode */}
          <div className="bg-neutral-900 border border-neutral-800 rounded p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-neutral-300 font-medium mb-1">
                  Название кампании
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  {t.senderMode}
                </label>
                <select
                  value={senderMode}
                  onChange={(e) => setSenderMode(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="dm">{t.senderModeDm}</option>
                  <option value="chat">{t.senderModeChats}</option>
                  <option value="comments">{t.senderModeComments}</option>
                </select>
              </div>
            </div>

            {/* Recipients text */}
            <div>
              <div className="flex items-center justify-between text-neutral-300 font-medium mb-1">
                <span>{t.senderTargetList}</span>
                <span className="font-mono text-sky-400 text-[11px] tabular-nums">
                  {targetLines.length} контактов
                </span>
              </div>
              <textarea
                rows={4}
                value={targetRecipientsText}
                onChange={(e) => setTargetRecipientsText(e.target.value)}
                placeholder={`@crypto_danila\n@margo_marketing\n+79162901488\n@artem_crypto_trader`}
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2.5 font-mono text-neutral-200 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Message Template & Spintax */}
          <div className="bg-neutral-900 border border-neutral-800 rounded p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-neutral-300 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.messageTemplate}</span>
              </label>

              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => insertTag(' {username}')}
                  className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded font-mono"
                >
                  + &#123;username&#125;
                </button>
                <button
                  type="button"
                  onClick={() => insertTag(' {first_name}')}
                  className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded font-mono"
                >
                  + &#123;first_name&#125;
                </button>
                <button
                  type="button"
                  onClick={handleTestSpintax}
                  className="px-2.5 py-0.5 bg-sky-950 border border-sky-800/80 text-sky-300 hover:bg-sky-900/60 rounded flex items-center gap-1 font-medium"
                >
                  <Shuffle className="w-3 h-3" />
                  <span>{t.btnTestSpintax}</span>
                </button>
              </div>
            </div>

            <textarea
              rows={7}
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-neutral-200 text-xs focus:outline-none focus:border-sky-500 font-mono leading-relaxed"
            />

            <div className="text-[11px] text-neutral-400">
              {t.spintaxHint}
            </div>

            {/* Spintax Samples Live Box */}
            {showSpintaxBox && (
              <div className="p-3 bg-neutral-950 border border-sky-800/60 rounded space-y-2 text-[11px] animate-in fade-in duration-150">
                <div className="text-sky-300 font-medium flex items-center gap-1.5">
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Сгенерированные рандомные вариации Spintax:</span>
                </div>
                {spintaxSamples.map((sample, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-neutral-900/90 rounded border border-neutral-800 text-neutral-300 whitespace-pre-wrap font-sans"
                  >
                    <span className="text-neutral-500 font-mono mr-2">#{idx + 1}:</span>
                    {sample}
                  </div>
                ))}
              </div>
            )}

            {/* Media & Attachments */}
            <div className="pt-2 border-t border-neutral-800 flex flex-wrap items-center gap-4 text-neutral-300">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasPhoto}
                  onChange={(e) => setHasPhoto(e.target.checked)}
                  className="rounded bg-neutral-950 border-neutral-700 text-sky-500 focus:ring-0"
                />
                <Paperclip className="w-3.5 h-3.5 text-neutral-400" />
                <span>{t.addPhoto}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isVoiceNote}
                  onChange={(e) => setIsVoiceNote(e.target.checked)}
                  className="rounded bg-neutral-950 border-neutral-700 text-sky-500 focus:ring-0"
                />
                <Mic className="w-3.5 h-3.5 text-neutral-400" />
                <span>{t.addVoice}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasButtons}
                  onChange={(e) => setHasButtons(e.target.checked)}
                  className="rounded bg-neutral-950 border-neutral-700 text-sky-500 focus:ring-0"
                />
                <Link className="w-3.5 h-3.5 text-neutral-400" />
                <span>{t.addButtons}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Anti-Ban Parameters & Launch CTA */}
        <div className="space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded p-4 space-y-4">
            <div className="text-neutral-300 font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-sky-400" />
              <span>Параметры безопасности</span>
            </div>

            {/* Delays */}
            <div>
              <label className="block text-neutral-400 text-[11px] mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-neutral-400" />
                <span>{t.sendDelay}</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={minDelay}
                  onChange={(e) => setMinDelay(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-1.5 text-neutral-200 font-mono text-center"
                />
                <span className="text-neutral-500">—</span>
                <input
                  type="number"
                  value={maxDelay}
                  onChange={(e) => setMaxDelay(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-1.5 text-neutral-200 font-mono text-center"
                />
              </div>
            </div>

            {/* Limit per account */}
            <div>
              <label className="block text-neutral-400 text-[11px] mb-1.5">
                {t.limitPerAccount}
              </label>
              <input
                type="number"
                value={limitPerAcc}
                onChange={(e) => setLimitPerAcc(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-1.5 text-neutral-200 font-mono"
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Рекомендуется 25-35 для прогретых аккаунтов
              </span>
            </div>

            {/* Threads count */}
            <div>
              <label className="block text-neutral-400 text-[11px] mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-neutral-400" />
                <span>{t.threadsNumber}</span>
              </label>
              <input
                type="number"
                value={threads}
                min={1}
                max={20}
                onChange={(e) => setThreads(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-1.5 text-neutral-200 font-mono"
              />
            </div>

            {/* Summary calculation */}
            <div className="p-3 bg-neutral-950 rounded border border-neutral-800 text-[11px] space-y-1.5 text-neutral-400">
              <div className="flex justify-between">
                <span>Задействовано аккаунтов:</span>
                <span className="font-mono text-neutral-200">
                  {Math.min(threads, activeAccountsCount)} шт
                </span>
              </div>
              <div className="flex justify-between">
                <span>Ожидаемое время:</span>
                <span className="font-mono text-neutral-200">
                  ~{Math.round((targetLines.length * ((minDelay + maxDelay) / 2)) / 60 / Math.max(1, threads))} мин
                </span>
              </div>
              <div className="flex justify-between">
                <span>Ротация прокси:</span>
                <span className="font-mono text-emerald-400">Каждые 5 запросов</span>
              </div>
            </div>

            {/* Launch button */}
            <button
              onClick={handleLaunchCampaign}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{t.btnLaunchSenderTask}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
