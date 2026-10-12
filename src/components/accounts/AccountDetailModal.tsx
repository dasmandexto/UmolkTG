import React from 'react';
import { useCombiner } from '../../context/CombinerContext';
import {
  X,
  Smartphone,
  Shield,
  Clock,
  Send,
  MessageSquare,
  Key,
  Globe,
} from 'lucide-react';

export const AccountDetailModal: React.FC = () => {
  const {
    selectedAccountForDetail,
    setSelectedAccountForDetail,
    setWebTelegramAccount,
  } = useCombiner();

  if (!selectedAccountForDetail) return null;

  const acc = selectedAccountForDetail;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded bg-sky-950 border border-sky-800 flex items-center justify-center text-xs text-sky-400 font-bold">
              {acc.firstName.charAt(0)}
            </span>
            <div>
              <div className="text-sm font-semibold text-white">
                {acc.firstName} {acc.lastName} (@{acc.username})
              </div>
              <div className="text-xs font-mono text-neutral-400">{acc.phone}</div>
            </div>
          </div>
          <button
            onClick={() => setSelectedAccountForDetail(null)}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Key Parameters Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-neutral-950 p-3 rounded border border-neutral-800">
              <div className="text-neutral-400 text-[11px] flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                <span>Дата-центр & Гео</span>
              </div>
              <div className="mt-1 font-mono text-white text-xs font-medium">
                DC {acc.dcId} · {acc.geo}
              </div>
            </div>

            <div className="bg-neutral-950 p-3 rounded border border-neutral-800">
              <div className="text-neutral-400 text-[11px] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Возраст / Отлежка</span>
              </div>
              <div className="mt-1 font-mono text-white text-xs font-medium">
                {acc.daysAlive} дней активен
              </div>
            </div>

            <div className="bg-neutral-950 p-3 rounded border border-neutral-800">
              <div className="text-neutral-400 text-[11px] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>2FA Пароль</span>
              </div>
              <div className="mt-1 font-mono text-white text-xs font-medium">
                {acc.twoFa ? 'Установлен (SHA-256)' : 'Отсутствует'}
              </div>
            </div>

            <div className="bg-neutral-950 p-3 rounded border border-neutral-800">
              <div className="text-neutral-400 text-[11px] flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-amber-400" />
                <span>Всего отправлено</span>
              </div>
              <div className="mt-1 font-mono text-white text-xs font-medium">
                {acc.messagesSent} сообщений
              </div>
            </div>
          </div>

          {/* Emulated Device Profile */}
          <div className="bg-neutral-950 p-3 rounded border border-neutral-800 space-y-2">
            <div className="text-neutral-300 font-medium flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-sky-400" />
              <span>Эмулируемое устройство (Fingerprint)</span>
            </div>
            <div className="font-mono text-[11px] text-neutral-400 space-y-1">
              <div className="flex justify-between">
                <span>Модель:</span>
                <span className="text-neutral-200">{acc.deviceModel}</span>
              </div>
              <div className="flex justify-between">
                <span>Версия приложения:</span>
                <span className="text-neutral-200">{acc.appVersion}</span>
              </div>
              <div className="flex justify-between">
                <span>Привязанный прокси:</span>
                <span className="text-neutral-200">{acc.proxyIp || 'Прямое подключение'}</span>
              </div>
            </div>
          </div>

          {/* SpamBot Check result */}
          <div className="bg-neutral-950 p-3 rounded border border-neutral-800 space-y-1.5">
            <div className="text-neutral-300 font-medium flex items-center justify-between">
              <span>Статус в официальном @SpamBot:</span>
              <span
                className={`font-mono text-[11px] ${
                  acc.spambotStatus === 'free'
                    ? 'text-emerald-400'
                    : acc.spambotStatus === 'limited'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {acc.spambotStatus === 'free'
                  ? 'Ограничений нет'
                  : acc.spambotStatus === 'limited'
                  ? 'Временный блок'
                  : 'Перманентный бан'}
              </span>
            </div>
            {acc.spambotExpires && (
              <div className="text-[11px] text-neutral-400 font-mono">
                Истекает: {acc.spambotExpires}
              </div>
            )}
          </div>

          {/* Notes */}
          {acc.notes && (
            <div className="text-[11px] text-neutral-400 p-2.5 bg-neutral-950 rounded border border-neutral-800">
              <span className="text-neutral-300 font-medium">Заметка: </span>
              {acc.notes}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between gap-2">
          <button
            onClick={() => {
              const target = selectedAccountForDetail;
              setSelectedAccountForDetail(null);
              setWebTelegramAccount(target);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-medium transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Запустити сесію (.session ➔ TData)</span>
          </button>

          <button
            onClick={() => setSelectedAccountForDetail(null)}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
