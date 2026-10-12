import React, { useState } from 'react';
import { useCombiner } from '../../context/CombinerContext';
import {
  Settings,
  Key,
  Shield,
  Smartphone,
  Save,
  CheckCircle,
  RefreshCw,
  Wallet,
} from 'lucide-react';

export const SettingsPanel: React.FC = () => {
  const { t, settings, updateSettings } = useCombiner();

  const [formState, setFormState] = useState(settings);
  const [balanceStatus, setBalanceStatus] = useState<string | null>(null);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleCheckBalance = () => {
    setIsCheckingBalance(true);
    setTimeout(() => {
      setIsCheckingBalance(false);
      setBalanceStatus('Баланс: 1,480.50 ₽ (Доступно ~52 номеров)');
    }, 1000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formState);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-4 text-xs max-w-4xl">
      {/* Top Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-sky-400" />
            <span>{t.settingsTitle}</span>
          </h2>
          <p className="text-neutral-400 mt-0.5">
            Ключи авторизации MTProto, сервисы приема SMS-кодов и глобальные пороги безопасности
          </p>
        </div>

        <button
          type="submit"
          className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{t.btnSaveSettings}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>Настройки успешно применены ко всем модулям!</span>
        </div>
      )}

      {/* Telegram Core API Section */}
      <div className="bg-neutral-900 border border-neutral-800 rounded p-4 space-y-3">
        <div className="font-semibold text-neutral-200 flex items-center gap-2">
          <Key className="w-4 h-4 text-sky-400" />
          <span>{t.tgApiSection}</span>
        </div>
        <p className="text-neutral-400 text-[11px]">
          Официальные ключи приложения из консоли разработчика my.telegram.org для легализации MTProto сессий.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-neutral-300 font-medium mb-1">App API ID</label>
            <input
              type="text"
              value={formState.telegramApiId}
              onChange={(e) => setFormState({ ...formState, telegramApiId: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-neutral-200 font-mono focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1">App API Hash</label>
            <input
              type="text"
              value={formState.telegramApiHash}
              onChange={(e) => setFormState({ ...formState, telegramApiHash: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-neutral-200 font-mono focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* SMS & Captcha Services */}
      <div className="bg-neutral-900 border border-neutral-800 rounded p-4 space-y-3">
        <div className="font-semibold text-neutral-200 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span>{t.smsSection}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-neutral-300 font-medium mb-1">SMS Провайдер</label>
            <select
              value={formState.smsProvider}
              onChange={(e) => setFormState({ ...formState, smsProvider: e.target.value as any })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-neutral-200 focus:outline-none focus:border-sky-500"
            >
              <option value="sms_activate">SMS-Activate.org</option>
              <option value="five_sim">5SIM.net</option>
              <option value="vak_sms">Vak-SMS.com</option>
              <option value="onlinesim">OnlineSIM.ru</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-neutral-300 font-medium">API Token SMS сервиса</label>
              <button
                type="button"
                onClick={handleCheckBalance}
                className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-sans"
              >
                <Wallet className="w-3 h-3" />
                <span>{isCheckingBalance ? 'Проверка...' : 'Проверить баланс'}</span>
              </button>
            </div>
            <input
              type="password"
              value={formState.smsApiKey}
              onChange={(e) => setFormState({ ...formState, smsApiKey: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-neutral-200 font-mono focus:outline-none focus:border-sky-500"
            />
            {balanceStatus && (
              <div className="text-[11px] text-emerald-400 font-mono mt-1">
                ✓ {balanceStatus}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Anti-Ban & Safety Safeguards */}
      <div className="bg-neutral-900 border border-neutral-800 rounded p-4 space-y-4">
        <div className="font-semibold text-neutral-200 flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-400" />
          <span>{t.antiBanSection}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Флуд-пауза при FLOOD_WAIT (сек)
            </label>
            <input
              type="number"
              value={formState.globalFloodDelay}
              onChange={(e) => setFormState({ ...formState, globalFloodDelay: Number(e.target.value) })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-neutral-200 font-mono"
            />
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Стоп задач при бане N аккаунтов подряд
            </label>
            <input
              type="number"
              value={formState.autoStopOnBans}
              onChange={(e) => setFormState({ ...formState, autoStopOnBans: Number(e.target.value) })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-neutral-200 font-mono"
            />
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Период авто-чека SpamBot (мин)
            </label>
            <input
              type="number"
              value={formState.autoSpambotCheckInterval}
              onChange={(e) => setFormState({ ...formState, autoSpambotCheckInterval: Number(e.target.value) })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-neutral-200 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-neutral-300 font-medium mb-1">
            Эмуляция клиента по умолчанию (User-Agent / Device Profile)
          </label>
          <select
            value={formState.spoofDevice}
            onChange={(e) => setFormState({ ...formState, spoofDevice: e.target.value })}
            className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-neutral-200 focus:outline-none focus:border-sky-500 font-mono text-[11px]"
          >
            <option value="Telegram Desktop 4.16.8 (Windows 11)">
              Telegram Desktop 4.16.8 (Windows 11 x64) — Рекомендуется для TData
            </option>
            <option value="Telegram Android 10.14.2 (Samsung Galaxy S24)">
              Telegram Android 10.14.2 (Samsung Galaxy S24 Ultra) — Для авторегов
            </option>
            <option value="Telegram iOS 10.9.1 (iPhone 15 Pro)">
              Telegram iOS 10.9.1 (Apple iPhone 15 Pro) — Высокий траст
            </option>
          </select>
        </div>
      </div>
    </form>
  );
};
