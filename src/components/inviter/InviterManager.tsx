import React, { useState } from 'react';
import { useCombiner } from '../../context/CombinerContext';
import {
  UserPlus,
  Shield,
  Clock,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Layers,
  Sparkles,
} from 'lucide-react';

export const InviterManager: React.FC = () => {
  const {
    t,
    accounts,
    createTask,
    targetRecipientsText,
    setTargetRecipientsText,
    addLog,
  } = useCombiner();

  const [destinationGroup, setDestinationGroup] = useState('@ton_traders_vip');
  const [method, setMethod] = useState<'username' | 'id' | 'contacts'>('contacts');
  const [invitesPerAccount, setInvitesPerAccount] = useState(15);
  const [minDelay, setMinDelay] = useState(25);
  const [maxDelay, setMaxDelay] = useState(45);
  const [skipAlreadyInChat, setSkipAlreadyInChat] = useState(true);
  const [retryFailedWithDelay, setRetryFailedWithDelay] = useState(true);

  const targets = targetRecipientsText
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const activeAccountsCount = accounts.filter((a) => a.status === 'active').length;

  const handleLaunchInviter = () => {
    if (!destinationGroup.trim()) {
      alert('Укажите целевую группу для инвайта!');
      return;
    }
    if (targets.length === 0) {
      alert('Список пользователей для инвайта пуст!');
      return;
    }

    createTask({
      name: `Инвайтинг в ${destinationGroup} (${method === 'contacts' ? 'Contacts bypass' : 'Direct'})`,
      type: 'inviter',
      progressTotal: targets.length,
      speedPerMin: 6.8,
      accountsAssigned: Math.min(4, activeAccountsCount),
      delayRange: [minDelay, maxDelay],
      targetChat: destinationGroup,
      messagePreview: `Метод: ${method}, обход приватности: ${method === 'contacts' ? 'ВКЛ' : 'ВЫКЛ'}`,
    });

    addLog('info', 'inviter', `Запущен инвайтинг ${targets.length} пользователей в группу ${destinationGroup}`);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Top Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-purple-400" />
            <span>{t.navInviter}</span>
          </h2>
          <p className="text-neutral-400 mt-0.5">
            Массовое добавление целевой аудитории в ваши группы и супергруппы с обходом фильтров приватности
          </p>
        </div>

        <div className="text-neutral-400 flex items-center gap-2">
          <span>Аккаунтов для инвайта:</span>
          <span className="font-mono text-purple-400 font-bold tabular-nums">
            {activeAccountsCount} шт
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded p-4 space-y-4">
            {/* Target Group */}
            <div>
              <label className="block text-neutral-300 font-medium mb-1.5">
                {t.inviterTargetGroup}
              </label>
              <input
                type="text"
                value={destinationGroup}
                onChange={(e) => setDestinationGroup(e.target.value)}
                placeholder={t.inviterPlaceholderGroup}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-200 focus:outline-none focus:border-purple-500 font-mono"
              />
              <span className="text-[11px] text-neutral-500 mt-1 block">
                Аккаунты должны заранее вступить в группу или обладать правами администратора
              </span>
            </div>

            {/* Inviting Method */}
            <div>
              <label className="block text-neutral-300 font-medium mb-1.5">
                {t.inviterMethod}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setMethod('contacts')}
                  className={`p-3 rounded border text-left transition-colors ${
                    method === 'contacts'
                      ? 'bg-purple-950/50 border-purple-600 text-white'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <div className="font-semibold text-xs flex items-center gap-1.5 mb-1">
                    <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                    <span>Через контакты</span>
                  </div>
                  <div className="text-[11px] leading-tight text-neutral-400">
                    Добавление в адресную книгу аккаунта. Обходит настройку «Кто может добавлять: Мои контакты».
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('username')}
                  className={`p-3 rounded border text-left transition-colors ${
                    method === 'username'
                      ? 'bg-purple-950/50 border-purple-600 text-white'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <div className="font-semibold text-xs flex items-center gap-1.5 mb-1">
                    <span>Прямой инвайт</span>
                  </div>
                  <div className="text-[11px] leading-tight text-neutral-400">
                    Стандартный вызов channels.inviteToChannel по @юзернеймам.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('id')}
                  className={`p-3 rounded border text-left transition-colors ${
                    method === 'id'
                      ? 'bg-purple-950/50 border-purple-600 text-white'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <div className="font-semibold text-xs flex items-center gap-1.5 mb-1">
                    <span>По User ID</span>
                  </div>
                  <div className="text-[11px] leading-tight text-neutral-400">
                    По числовым Telegram ID с использованием хеша доступа access_hash.
                  </div>
                </button>
              </div>
            </div>

            {/* Target List */}
            <div>
              <div className="flex items-center justify-between text-neutral-300 font-medium mb-1">
                <span>Список пользователей для инвайта:</span>
                <span className="font-mono text-purple-400 text-[11px] tabular-nums">
                  {targets.length} пользователей
                </span>
              </div>
              <textarea
                rows={6}
                value={targetRecipientsText}
                onChange={(e) => setTargetRecipientsText(e.target.value)}
                placeholder={`@crypto_danila\n@margo_marketing\n@artem_crypto_trader`}
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2.5 font-mono text-neutral-200 text-xs focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Limits & Safeguards */}
        <div className="space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded p-4 space-y-4">
            <div className="text-neutral-300 font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <span>Лимиты инвайтинга</span>
            </div>

            {/* Delays */}
            <div>
              <label className="block text-neutral-400 text-[11px] mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-neutral-400" />
                <span>{t.inviteDelay} (сек)</span>
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

            {/* Invites per account */}
            <div>
              <label className="block text-neutral-400 text-[11px] mb-1.5">
                {t.invitesPerAccount}
              </label>
              <input
                type="number"
                value={invitesPerAccount}
                onChange={(e) => setInvitesPerAccount(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-1.5 text-neutral-200 font-mono"
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Безопасный предел: до 20 инвайтов в сутки на 1 аккаунт
              </span>
            </div>

            {/* Checkboxes */}
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <label className="flex items-center gap-2 text-neutral-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={skipAlreadyInChat}
                  onChange={(e) => setSkipAlreadyInChat(e.target.checked)}
                  className="rounded bg-neutral-950 border-neutral-700 text-purple-500 focus:ring-0"
                />
                <span>Пропускать уже вступивших</span>
              </label>

              <label className="flex items-center gap-2 text-neutral-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={retryFailedWithDelay}
                  onChange={(e) => setRetryFailedWithDelay(e.target.checked)}
                  className="rounded bg-neutral-950 border-neutral-700 text-purple-500 focus:ring-0"
                />
                <span>Повторять при временных сбоях</span>
              </label>
            </div>

            {/* Summary */}
            <div className="p-3 bg-neutral-950 rounded border border-neutral-800 text-[11px] space-y-1.5 text-neutral-400">
              <div className="flex justify-between">
                <span>Потенциал добавления:</span>
                <span className="font-mono text-purple-400 font-bold">
                  до {activeAccountsCount * invitesPerAccount} чел/день
                </span>
              </div>
              <div className="flex justify-between">
                <span>Метод обхода:</span>
                <span className="font-mono text-neutral-200">
                  {method === 'contacts' ? 'Phone Contacts' : 'Direct Invite'}
                </span>
              </div>
            </div>

            <button
              onClick={handleLaunchInviter}
              className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t.btnLaunchInviterTask}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
