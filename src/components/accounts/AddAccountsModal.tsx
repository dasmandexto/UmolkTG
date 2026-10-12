import React, { useState } from 'react';
import { useCombiner } from '../../context/CombinerContext';
import { TelegramAccount } from '../../types';
import {
  X,
  Upload,
  FileCode,
  Smartphone,
  RefreshCw,
  CheckCircle,
  FolderArchive,
  ArrowRightLeft,
  ExternalLink,
  Download,
} from 'lucide-react';
import {
  convertSessionToTdata,
  convertTdataToSession,
  triggerFileDownload,
} from '../../utils/converterLogic';

export const AddAccountsModal: React.FC = () => {
  const { isAddModalOpen, setIsAddModalOpen, addAccountsBulk, setActiveModule, addLog } = useCombiner();
  const [activeTab, setActiveTab] = useState<'tdata' | 'session' | 'sms_reg' | 'converter'>('tdata');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Auto-reg state
  const [selectedCountry, setSelectedCountry] = useState('ru');
  const [threadsCount, setThreadsCount] = useState(3);
  const [regStatus, setRegStatus] = useState<string>('');

  if (!isAddModalOpen) return null;

  const handleSimulateTDataUpload = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const generatedAccs: TelegramAccount[] = [
        {
          id: `acc-${Date.now()}-1`,
          phone: '+7 995 102-44-19',
          username: 'maxim_affiliate_pro',
          firstName: 'Максим',
          lastName: 'Кравцов',
          status: 'active',
          format: 'tdata',
          geo: 'RU',
          countryCode: 'ru',
          twoFa: true,
          twoFaPassword: '••••••••',
          daysAlive: 34,
          channelsJoined: 5,
          messagesSent: 0,
          proxyIp: '185.162.228.45:9050',
          lastChecked: 'Только что',
          spambotStatus: 'free',
          avatarSeed: 'maxim',
          deviceModel: 'Telegram Desktop 4.16.8 / Windows 11',
          appVersion: '4.16.8',
          dcId: 2,
          unreadDialogs: 0,
          notes: 'Импортирован из TData архива',
        },
        {
          id: `acc-${Date.now()}-2`,
          phone: '+7 995 842-19-01',
          username: 'anna_crypto_vibe',
          firstName: 'Анна',
          lastName: 'Белова',
          status: 'active',
          format: 'tdata',
          geo: 'RU',
          countryCode: 'ru',
          twoFa: true,
          daysAlive: 28,
          channelsJoined: 3,
          messagesSent: 0,
          proxyIp: '185.162.228.45:9050',
          lastChecked: 'Только что',
          spambotStatus: 'free',
          avatarSeed: 'anna',
          deviceModel: 'Telegram Desktop 4.16.8 / Windows 11',
          appVersion: '4.16.8',
          dcId: 2,
          unreadDialogs: 0,
          notes: 'Импортирован из TData архива',
        },
      ];

      addAccountsBulk(generatedAccs);
      setIsProcessing(false);
      setSuccessMessage('Успешно импортировано 2 аккаунта TData с валидными ключами шифрования!');
      setTimeout(() => {
        setSuccessMessage('');
        setIsAddModalOpen(false);
      }, 1500);
    }, 1200);
  };

  const handleSimulateSmsReg = () => {
    setIsProcessing(true);
    setRegStatus('Запрос номера у SMS-Activate...');

    setTimeout(() => {
      setRegStatus('Получен номер +7 902 411-90-28. Отправка auth.sendCode...');
    }, 1000);

    setTimeout(() => {
      setRegStatus('SMS код 84920 перехвачен. Установка 2FA облачного пароля...');
    }, 2200);

    setTimeout(() => {
      const regAccount: TelegramAccount = {
        id: `acc-sms-${Date.now()}`,
        phone: '+7 902 411-90-28',
        username: `user_${Math.floor(Math.random() * 90000 + 10000)}`,
        firstName: 'Игорь',
        lastName: 'Волков',
        status: 'warming',
        format: 'session_json',
        geo: 'RU',
        countryCode: 'ru',
        twoFa: true,
        twoFaPassword: '••••••••',
        daysAlive: 0,
        channelsJoined: 1,
        messagesSent: 0,
        lastChecked: 'Только что',
        spambotStatus: 'free',
        avatarSeed: 'igor',
        deviceModel: 'Telegram Android 10.14.2 / Samsung S24',
        appVersion: '10.14.2',
        dcId: 2,
        unreadDialogs: 0,
        notes: 'Свежий авторег через SMS-Activate. Требуется прогрев.',
      };

      addAccountsBulk([regAccount]);
      setIsProcessing(false);
      setSuccessMessage('Новый аккаунт успешно зарегистрирован и добавлен в базу!');
      setTimeout(() => {
        setSuccessMessage('');
        setIsAddModalOpen(false);
      }, 1600);
    }, 3400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-sky-400" />
            <span className="text-sm font-semibold text-white">
              Импорт и добавление аккаунтов
            </span>
          </div>
          <button
            onClick={() => setIsAddModalOpen(false)}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/60 px-5 text-xs">
          <button
            onClick={() => setActiveTab('tdata')}
            className={`py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'tdata'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>TData (Папки/ZIP)</span>
          </button>

          <button
            onClick={() => setActiveTab('session')}
            className={`py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'session'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>.session + .json</span>
          </button>

          <button
            onClick={() => setActiveTab('sms_reg')}
            className={`py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'sms_reg'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Авторег SMS API</span>
          </button>

          <button
            onClick={() => setActiveTab('converter')}
            className={`py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'converter'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Конвертер</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 text-xs">
          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {activeTab === 'tdata' && (
            <div className="space-y-4">
              <div
                onClick={handleSimulateTDataUpload}
                className="border-2 border-dashed border-neutral-700 hover:border-sky-500/80 rounded-lg p-8 text-center cursor-pointer transition-colors bg-neutral-950/50 group"
              >
                <FolderArchive className="w-10 h-10 text-neutral-500 group-hover:text-sky-400 mx-auto mb-3 transition-colors" />
                <div className="text-neutral-200 font-medium text-xs mb-1">
                  Перетащите ZIP-архив с папками tdata или нажмите для выбора
                </div>
                <div className="text-neutral-400 text-[11px]">
                  Поддерживаются tdata с установленным 2FA паролем (файл passwords.txt)
                </div>
              </div>

              <div className="text-[11px] text-neutral-400 leading-relaxed space-y-1">
                <p>• Автоматическая валидация мастер-ключей и DC авторизации.</p>
                <p>• Конвертация в фоновом режиме без открытия Telegram Desktop.</p>
              </div>

              <button
                disabled={isProcessing}
                onClick={handleSimulateTDataUpload}
                className="w-full py-2 px-4 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Распаковка и проверка ключей TData...</span>
                  </>
                ) : (
                  <span>Загрузить тестовый пакет TData (2 аккаунта)</span>
                )}
              </button>
            </div>
          )}

          {activeTab === 'session' && (
            <div className="space-y-4">
              <div>
                <label className="block text-neutral-300 font-medium mb-1.5">
                  Список путей к .session файлам или текст JSON:
                </label>
                <textarea
                  rows={4}
                  placeholder={`79258412914.session\n79631194822.session\n{"session_file": "...", "app_id": 2040, "device": "..."}`}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2.5 font-mono text-neutral-200 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <button
                disabled={isProcessing}
                onClick={handleSimulateTDataUpload}
                className="w-full py-2 px-4 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded transition-colors disabled:opacity-50"
              >
                Импортировать Telethon / Pyrogram сессии
              </button>
            </div>
          )}

          {activeTab === 'sms_reg' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 mb-1">Страна номера (Гео)</label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-neutral-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="ru">Россия (+7) · ~28 ₽</option>
                    <option value="id">Индонезия (+62) · ~12 ₽</option>
                    <option value="us">США (+1) · ~35 ₽</option>
                    <option value="kz">Казахстан (+7) · ~22 ₽</option>
                    <option value="br">Бразилия (+55) · ~15 ₽</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 mb-1">Потоков регистрации</label>
                  <input
                    type="number"
                    value={threadsCount}
                    min={1}
                    max={10}
                    onChange={(e) => setThreadsCount(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-neutral-200 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded space-y-2 text-[11px] text-neutral-400">
                <div className="flex justify-between">
                  <span>Провайдер SMS:</span>
                  <span className="font-mono text-neutral-200">SMS-Activate API v2</span>
                </div>
                <div className="flex justify-between">
                  <span>Баланс API ключа:</span>
                  <span className="font-mono text-emerald-400">1,480.50 ₽</span>
                </div>
                <div className="flex justify-between">
                  <span>Установка 2FA:</span>
                  <span className="font-mono text-neutral-200">Автоматически (SHA-256)</span>
                </div>
              </div>

              {regStatus && (
                <div className="p-2.5 bg-neutral-950 border border-sky-800/60 rounded text-[11px] font-mono text-sky-300 flex items-center gap-2">
                  <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
                  <span>{regStatus}</span>
                </div>
              )}

              <button
                disabled={isProcessing}
                onClick={handleSimulateSmsReg}
                className="w-full py-2 px-4 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? 'Регистрация в процессе...' : 'Купить номер и зарегистрировать аккаунт'}
              </button>
            </div>
          )}

          {activeTab === 'converter' && (
            <div className="space-y-4">
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded text-neutral-300 space-y-2">
                <div className="font-medium text-xs text-white flex items-center justify-between">
                  <span>Двусторонний конвертер сессий TeleRaptor</span>
                  <button
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setActiveModule('converter');
                    }}
                    className="text-sky-400 hover:text-sky-300 flex items-center gap-1 text-[11px]"
                  >
                    <span>Открыть расширенный модуль</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Мгновенное преобразование папок <b>TData</b> в файлы <b>.session + .json</b> (и обратно) с сохранением DC ID, ключей авторизации auth_key и параметров устройства.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  disabled={isProcessing}
                  onClick={async () => {
                    setIsProcessing(true);
                    try {
                      const res = await convertTdataToSession('+7 925 841-29-14', 2, 'telethon');
                      triggerFileDownload(res.zipBlob, 'Converted_Telethon_79258412914.zip');
                      setSuccessMessage('Сессия сконвертирована в Telethon (.session + .json) и скачана!');
                      addLog('success', 'accounts', 'Быстрая конвертация: TData -> Telethon .session');
                    } catch (e: any) {
                      alert('Ошибка: ' + e.message);
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  className="py-3 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded border border-neutral-700 text-left transition-colors"
                >
                  <div className="font-semibold text-white flex items-center gap-1.5 mb-1">
                    <FileCode className="w-3.5 h-3.5 text-purple-400" />
                    <span>TData ➔ .session</span>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Распаковать TData в SQLite файл Telethon / Pyrogram с генерацией session.json
                  </div>
                </button>

                <button
                  disabled={isProcessing}
                  onClick={async () => {
                    setIsProcessing(true);
                    try {
                      const res = await convertSessionToTdata('+7 963 119-48-22', 2, 'Pass2026!');
                      triggerFileDownload(res.zipBlob, 'Converted_TData_79631194822.zip');
                      setSuccessMessage('Сессия сконвертирована в TData и скачана в ZIP-архиве!');
                      addLog('success', 'accounts', 'Быстрая конвертация: .session -> TData');
                    } catch (e: any) {
                      alert('Ошибка: ' + e.message);
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  className="py-3 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded border border-neutral-700 text-left transition-colors"
                >
                  <div className="font-semibold text-white flex items-center gap-1.5 mb-1">
                    <FolderArchive className="w-3.5 h-3.5 text-sky-400" />
                    <span>.session ➔ TData</span>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Сгенерировать готовые папки tdata с ключами key_data и картами авторизации
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
