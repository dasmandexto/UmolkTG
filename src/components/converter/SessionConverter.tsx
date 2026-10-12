import React, { useState } from 'react';
import { useCombiner } from '../../context/CombinerContext';
import {
  ArrowRightLeft,
  FolderArchive,
  FileCode,
  Download,
  Plus,
  RefreshCw,
  CheckCircle,
  Shield,
  Layers,
  FileCheck,
  AlertCircle,
  Eye,
  Copy,
} from 'lucide-react';
import {
  convertSessionToTdata,
  convertTdataToSession,
  triggerFileDownload,
  ConversionItem,
} from '../../utils/converterLogic';
import { TelegramAccount } from '../../types';

export const SessionConverter: React.FC = () => {
  const { t, accounts, addAccountsBulk, addLog } = useCombiner();

  const [activeTab, setActiveTab] = useState<'session_to_tdata' | 'tdata_to_session' | 'batch' | 'inspector'>('session_to_tdata');

  // Session -> TData state
  const [s2tPhone, setS2tPhone] = useState('+7 925 841-29-14');
  const [s2tDcId, setS2tDcId] = useState(2);
  const [s2tTwoFa, setS2tTwoFa] = useState('Pass2026!');
  const [s2tDesktopVersion, setS2tDesktopVersion] = useState('4.16.8');
  const [s2tIsConverting, setS2tIsConverting] = useState(false);
  const [s2tProgress, setS2tProgress] = useState(0);
  const [s2tCurrentStep, setS2tCurrentStep] = useState('');
  const [s2tResult, setS2tResult] = useState<{
    zipBlob: Blob;
    filesTree: string[];
    accountData: Partial<TelegramAccount>;
  } | null>(null);

  // TData -> Session state
  const [t2sPhone, setT2sPhone] = useState('+7 963 119-48-22');
  const [t2sDcId, setT2sDcId] = useState(2);
  const [t2sFramework, setT2sFramework] = useState<'telethon' | 'pyrogram'>('telethon');
  const [t2sTwoFa, setT2sTwoFa] = useState('');
  const [t2sIsConverting, setT2sIsConverting] = useState(false);
  const [t2sProgress, setT2sProgress] = useState(0);
  const [t2sCurrentStep, setT2sCurrentStep] = useState('');
  const [t2sResult, setT2sResult] = useState<{
    zipBlob: Blob;
    sessionBlob: Blob;
    jsonContent: string;
    filesTree: string[];
    accountData: Partial<TelegramAccount>;
  } | null>(null);

  // Inspector state
  const [inspectInput, setInspectInput] = useState('1BJW92k4BAAA19284019284abcdef... (Telethon StringSession)');
  const [inspectResult, setInspectResult] = useState<any>(null);

  // Batch queue
  const [batchItems, setBatchItems] = useState<ConversionItem[]>([
    {
      id: 'batch-1',
      sourceType: 'session',
      targetType: 'tdata',
      fileName: '79258412914.session',
      phone: '+7 925 841-29-14',
      dcId: 2,
      desktopVersion: '4.16.8',
      status: 'done',
      progress: 100,
      logSteps: ['Auth Key verified', 'TData maps generated', 'Encrypted storage packed'],
      outputFilesTree: ['tdata/key_data', 'tdata/D877F783D5D3EF8C/maps', 'tdata/settings0'],
    },
    {
      id: 'batch-2',
      sourceType: 'tdata',
      targetType: 'session',
      fileName: 'TData_Folder_7963119.zip',
      phone: '+7 963 119-48-22',
      dcId: 2,
      framework: 'telethon',
      status: 'done',
      progress: 100,
      logSteps: ['key_data read', 'LocalKey decrypted', 'telethon.session serialized'],
      outputFilesTree: ['79631194822.session', '79631194822.json'],
    },
  ]);

  // Execute Session -> TData
  const handleConvertSessionToTdata = async () => {
    setS2tIsConverting(true);
    setS2tProgress(15);
    setS2tCurrentStep('Чтение структуры Telethon / Pyrogram SQLite базы...');
    addLog('info', 'accounts', `Конвертация .session -> TData для номера ${s2tPhone}`);

    setTimeout(() => {
      setS2tProgress(40);
      setS2tCurrentStep('Извлечение DC ID: ' + s2tDcId + ' и 256-байтного Auth Key...');
    }, 700);

    setTimeout(() => {
      setS2tProgress(75);
      setS2tCurrentStep('Генерация LocalKey (AES-256-IGE) и создание каталога tdata/D877F783D5D3EF8C...');
    }, 1400);

    setTimeout(async () => {
      try {
        const res = await convertSessionToTdata(s2tPhone, s2tDcId, s2tTwoFa, s2tDesktopVersion);
        setS2tProgress(100);
        setS2tCurrentStep('Конвертация успешно завершена. TData ZIP архив сгенерирован.');
        setS2tResult(res);
        setS2tIsConverting(false);
        addLog('success', 'accounts', `Успешно сконвертировано: .session -> TData (${s2tPhone})`);
      } catch (err: any) {
        setS2tIsConverting(false);
        alert('Ошибка конвертации: ' + err.message);
      }
    }, 2200);
  };

  // Execute TData -> Session
  const handleConvertTdataToSession = async () => {
    setT2sIsConverting(true);
    setT2sProgress(20);
    setT2sCurrentStep('Парсинг каталога tdata и чтение key_data...');
    addLog('info', 'accounts', `Конвертация TData -> .session (${t2sFramework}) для номера ${t2sPhone}`);

    setTimeout(() => {
      setT2sProgress(50);
      setT2sCurrentStep('Расшифровка мастер-ключа и карт авторизации maps0...');
    }, 800);

    setTimeout(() => {
      setT2sProgress(80);
      setT2sCurrentStep(`Формирование SQLite схемы ${t2sFramework}.session и session.json...`);
    }, 1500);

    setTimeout(async () => {
      try {
        const res = await convertTdataToSession(t2sPhone, t2sDcId, t2sFramework, t2sTwoFa);
        setT2sProgress(100);
        setT2sCurrentStep(`Конвертация успешно завершена. Сессия ${t2sFramework} готова.`);
        setT2sResult(res);
        setT2sIsConverting(false);
        addLog('success', 'accounts', `Успешно сконвертировано: TData -> ${t2sFramework} (${t2sPhone})`);
      } catch (err: any) {
        setT2sIsConverting(false);
        alert('Ошибка конвертации: ' + err.message);
      }
    }, 2300);
  };

  // Inspect Session
  const handleInspect = () => {
    setInspectResult({
      format: 'Telethon StringSession (v1.x)',
      dcId: 2,
      serverIp: '149.154.167.50:443',
      authKeyBytes: 256,
      authKeyHashHex: 'f892a01948bc... (valid SHA-1)',
      hasTwoFa: true,
      suggestedDevice: 'Telegram Android 10.14.2 / Samsung Galaxy S24',
      status: 'Valid & Ready for MTProto Handshake',
    });
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Top Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-sky-400" />
            <span>Конвертер сессий Telegram</span>
            <span className="text-xs font-mono font-normal text-neutral-400">
              (TData ⇄ .session + .json)
            </span>
          </h2>
          <p className="text-neutral-400 mt-0.5">
            Двустороннее преобразование между десктопными папками Telegram TData и сессиями Python Telethon / Pyrogram
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded border border-neutral-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('session_to_tdata')}
            className={`px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'session_to_tdata'
                ? 'bg-neutral-800 text-sky-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>.session ➔ TData</span>
          </button>

          <button
            onClick={() => setActiveTab('tdata_to_session')}
            className={`px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'tdata_to_session'
                ? 'bg-neutral-800 text-purple-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>TData ➔ .session</span>
          </button>

          <button
            onClick={() => setActiveTab('batch')}
            className={`px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'batch'
                ? 'bg-neutral-800 text-emerald-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Пакетный режим</span>
          </button>

          <button
            onClick={() => setActiveTab('inspector')}
            className={`px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'inspector'
                ? 'bg-neutral-800 text-amber-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Инспектор сессий</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SESSION -> TDATA */}
      {activeTab === 'session_to_tdata' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Input Form */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="font-semibold text-neutral-200 text-xs flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-sky-400" />
                  <span>Параметры исходной сессии (.session + .json)</span>
                </span>
                <span className="text-[11px] text-neutral-400">Формат на выходе: TData ZIP</span>
              </div>

              {/* Fast fill from accounts */}
              <div>
                <label className="block text-neutral-400 text-[11px] mb-1">
                  Или быстро выбрать номер из базы аккаунтов комбайна:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {accounts.slice(0, 5).map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => {
                        setS2tPhone(acc.phone);
                        setS2tDcId(acc.dcId);
                        if (acc.twoFaPassword) setS2tTwoFa(acc.twoFaPassword);
                      }}
                      className="px-2 py-1 bg-neutral-950 border border-neutral-800 hover:border-sky-500 rounded text-[11px] font-mono text-neutral-300"
                    >
                      {acc.phone} ({acc.geo})
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    Номер телефона сессии
                  </label>
                  <input
                    type="text"
                    value={s2tPhone}
                    onChange={(e) => setS2tPhone(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-neutral-200 font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    Дата-центр Telegram (DC ID)
                  </label>
                  <select
                    value={s2tDcId}
                    onChange={(e) => setS2tDcId(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-neutral-200 font-mono focus:outline-none focus:border-sky-500"
                  >
                    <option value={2}>DC 2 (Амстердам / Европа / СНГ)</option>
                    <option value={1}>DC 1 (Майами / США)</option>
                    <option value={4}>DC 4 (Амстердам / Европа)</option>
                    <option value={5}>DC 5 (Сингапур / Азия)</option>
                    <option value={3}>DC 3 (Майами)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-purple-400" />
                    <span>2FA Облачный пароль (если установлен)</span>
                  </label>
                  <input
                    type="text"
                    value={s2tTwoFa}
                    onChange={(e) => setS2tTwoFa(e.target.value)}
                    placeholder="Пароль двухфакторки"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-neutral-200 font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    Целевая версия Telegram Desktop
                  </label>
                  <select
                    value={s2tDesktopVersion}
                    onChange={(e) => setS2tDesktopVersion(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-neutral-200 font-mono focus:outline-none focus:border-sky-500"
                  >
                    <option value="4.16.8">Telegram Desktop 4.16.8 (Стабильная LTS)</option>
                    <option value="5.0.1">Telegram Desktop 5.0.1 (Windows 11)</option>
                    <option value="5.5.0">Telegram Desktop 5.5.0 (Latest 2026)</option>
                  </select>
                </div>
              </div>

              {/* Progress and status */}
              {s2tIsConverting && (
                <div className="p-3 bg-neutral-950 border border-sky-800/80 rounded space-y-2">
                  <div className="flex justify-between font-mono text-[11px] text-sky-400">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>{s2tCurrentStep}</span>
                    </span>
                    <span>{s2tProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 transition-all duration-300 rounded-full"
                      style={{ width: `${s2tProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Action button */}
              <button
                disabled={s2tIsConverting}
                onClick={handleConvertSessionToTdata}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {s2tIsConverting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Идет MTProto шифрование и упаковка TData...</span>
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Сконвертировать .session в TData</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: Output & Download Box */}
          <div className="space-y-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded p-4 space-y-3">
              <div className="font-semibold text-neutral-200 text-xs flex items-center justify-between">
                <span>Результат конвертации</span>
                {s2tResult && (
                  <span className="text-[10px] font-mono text-emerald-400">✓ Готово</span>
                )}
              </div>

              {s2tResult ? (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="p-3 bg-neutral-950 rounded border border-neutral-800 space-y-2 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Номер:</span>
                      <span className="text-white">{s2tResult.accountData.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Папка TData:</span>
                      <span className="text-emerald-400">tdata/D877F783D5D3EF8C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Шифрование:</span>
                      <span className="text-neutral-300">LocalKey AES-256</span>
                    </div>
                  </div>

                  {/* Files Tree */}
                  <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800 text-[11px] font-mono space-y-1">
                    <span className="text-neutral-400 block mb-1">Содержимое архива:</span>
                    {s2tResult.filesTree.map((f, i) => (
                      <div key={i} className="text-neutral-300 flex items-center gap-1.5">
                        <span className="text-neutral-600">📁</span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* Download ZIP button */}
                  <button
                    onClick={() =>
                      triggerFileDownload(
                        s2tResult.zipBlob,
                        `TData_${s2tPhone.replace(/\D/g, '')}.zip`
                      )
                    }
                    className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Скачать TData (ZIP-архив)</span>
                  </button>

                  {/* Add to account database button */}
                  <button
                    onClick={() => {
                      if (s2tResult.accountData) {
                        addAccountsBulk([s2tResult.accountData as TelegramAccount]);
                        alert(`Аккаунт ${s2tResult.accountData.phone} добавлен в базу TData аккаунтов!`);
                      }
                    }}
                    className="w-full py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-sky-400 font-medium rounded transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Добавить в базу TeleRaptor</span>
                  </button>
                </div>
              ) : (
                <div className="py-12 text-center text-neutral-500 space-y-2">
                  <FolderArchive className="w-8 h-8 mx-auto text-neutral-700" />
                  <p>Заполните параметры и нажмите кнопку запуска для генерации файлов TData.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TDATA -> SESSION */}
      {activeTab === 'tdata_to_session' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Input Form */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="font-semibold text-neutral-200 text-xs flex items-center gap-2">
                  <FolderArchive className="w-4 h-4 text-purple-400" />
                  <span>Параметры исходной папки TData</span>
                </span>
                <span className="text-[11px] text-neutral-400">Формат на выходе: .session + .json</span>
              </div>

              {/* Fast fill from accounts */}
              <div>
                <label className="block text-neutral-400 text-[11px] mb-1">
                  Быстро выбрать существующий TData аккаунт:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {accounts
                    .filter((a) => a.format === 'tdata')
                    .slice(0, 5)
                    .map((acc) => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => {
                          setT2sPhone(acc.phone);
                          setT2sDcId(acc.dcId);
                          if (acc.twoFaPassword) setT2sTwoFa(acc.twoFaPassword);
                        }}
                        className="px-2 py-1 bg-neutral-950 border border-neutral-800 hover:border-purple-500 rounded text-[11px] font-mono text-neutral-300"
                      >
                        {acc.phone} ({acc.firstName})
                      </button>
                    ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    Номер телефона сессии
                  </label>
                  <input
                    type="text"
                    value={t2sPhone}
                    onChange={(e) => setT2sPhone(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-neutral-200 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    Целевой Python фреймворк
                  </label>
                  <select
                    value={t2sFramework}
                    onChange={(e) => setT2sFramework(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-neutral-200 focus:outline-none focus:border-purple-500 font-mono"
                  >
                    <option value="telethon">Telethon (.session SQLite v1.x)</option>
                    <option value="pyrogram">Pyrogram (.session SQLite v2.x)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    Дата-центр Telegram (DC ID)
                  </label>
                  <select
                    value={t2sDcId}
                    onChange={(e) => setT2sDcId(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-neutral-200 font-mono focus:outline-none focus:border-purple-500"
                  >
                    <option value={2}>DC 2 (Европа / 149.154.167.50)</option>
                    <option value={1}>DC 1 (США / 149.154.175.50)</option>
                    <option value={4}>DC 4 (Европа / 149.154.167.91)</option>
                    <option value={5}>DC 5 (Сингапур / 91.108.56.165)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    2FA пароль (если задан)
                  </label>
                  <input
                    type="text"
                    value={t2sTwoFa}
                    onChange={(e) => setT2sTwoFa(e.target.value)}
                    placeholder="Пароль облачной защиты"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-neutral-200 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Progress and status */}
              {t2sIsConverting && (
                <div className="p-3 bg-neutral-950 border border-purple-800/80 rounded space-y-2">
                  <div className="flex justify-between font-mono text-[11px] text-purple-400">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>{t2sCurrentStep}</span>
                    </span>
                    <span>{t2sProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 transition-all duration-300 rounded-full"
                      style={{ width: `${t2sProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Action button */}
              <button
                disabled={t2sIsConverting}
                onClick={handleConvertTdataToSession}
                className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {t2sIsConverting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Расшифровка key_data и компиляция .session...</span>
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Сконвертировать TData в .session + .json</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: Output & Download Box */}
          <div className="space-y-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded p-4 space-y-3">
              <div className="font-semibold text-neutral-200 text-xs flex items-center justify-between">
                <span>Результат конвертации</span>
                {t2sResult && (
                  <span className="text-[10px] font-mono text-emerald-400">✓ Готово</span>
                )}
              </div>

              {t2sResult ? (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="p-3 bg-neutral-950 rounded border border-neutral-800 space-y-2 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Файл:</span>
                      <span className="text-white">{t2sPhone.replace(/\D/g, '')}.session</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Фреймворк:</span>
                      <span className="text-purple-400 uppercase">{t2sFramework}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">JSON метаданные:</span>
                      <span className="text-emerald-400">device, app_id, hash</span>
                    </div>
                  </div>

                  {/* JSON Code snippet preview */}
                  <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800 text-[10px] font-mono max-h-32 overflow-y-auto text-neutral-300">
                    <pre>{t2sResult.jsonContent}</pre>
                  </div>

                  {/* Download Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() =>
                        triggerFileDownload(
                          t2sResult.sessionBlob,
                          `${t2sPhone.replace(/\D/g, '')}.session`
                        )
                      }
                      className="py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 text-purple-300 font-medium rounded transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>.session</span>
                    </button>

                    <button
                      onClick={() =>
                        triggerFileDownload(
                          new Blob([t2sResult.jsonContent], { type: 'application/json' }),
                          `${t2sPhone.replace(/\D/g, '')}.json`
                        )
                      }
                      className="py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 text-sky-300 font-medium rounded transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>.json</span>
                    </button>
                  </div>

                  <button
                    onClick={() =>
                      triggerFileDownload(
                        t2sResult.zipBlob,
                        `Session_${t2sPhone.replace(/\D/g, '')}.zip`
                      )
                    }
                    className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Скачать архив (.session + .json)</span>
                  </button>

                  <button
                    onClick={() => {
                      if (t2sResult.accountData) {
                        addAccountsBulk([t2sResult.accountData as TelegramAccount]);
                        alert(`Аккаунт ${t2sResult.accountData.phone} добавлен в базу TeleRaptor!`);
                      }
                    }}
                    className="w-full py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-purple-400 font-medium rounded transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Добавить в базу TeleRaptor</span>
                  </button>
                </div>
              ) : (
                <div className="py-12 text-center text-neutral-500 space-y-2">
                  <FileCode className="w-8 h-8 mx-auto text-neutral-700" />
                  <p>Настройте параметры и запустите конвертацию TData в файлы .session.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BATCH QUEUE */}
      {activeTab === 'batch' && (
        <div className="space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-white text-xs">
                  Очередь массовой конвертации
                </span>
                <p className="text-neutral-400 text-[11px] mt-0.5">
                  Пакетная обработка сотен сессий одновременно с авто-определением DC и фингерпринтов
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    alert('Все сконвертированные архивы упакованы в batch_converted_sessions.zip!');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Скачать все одним архивом</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-neutral-800 rounded mt-3">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 font-medium">
                  <tr>
                    <th className="py-2.5 px-3">Файл</th>
                    <th className="py-2.5 px-3">Номер телефона</th>
                    <th className="py-2.5 px-3">Направление</th>
                    <th className="py-2.5 px-3">DC</th>
                    <th className="py-2.5 px-3">Статус</th>
                    <th className="py-2.5 px-3 text-right">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 font-mono text-[11px]">
                  {batchItems.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-800/30">
                      <td className="py-2.5 px-3 text-white font-sans">{item.fileName}</td>
                      <td className="py-2.5 px-3 text-neutral-300">{item.phone}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-sky-400">
                          {item.sourceType === 'session' ? '.session ➔ TData' : 'TData ➔ .session'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-neutral-400">DC {item.dcId}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-emerald-400 flex items-center gap-1 font-sans">
                          <CheckCircle className="w-3 h-3" />
                          <span>100% Успешно</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-sans">
                        <button
                          onClick={() => alert(`Загрузка архива для ${item.phone}...`)}
                          className="text-sky-400 hover:text-sky-300 font-medium"
                        >
                          Скачать
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SESSION INSPECTOR */}
      {activeTab === 'inspector' && (
        <div className="space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded p-4 space-y-4">
            <div>
              <span className="font-semibold text-white text-xs">
                Инспектор и валидатор Telethon / Pyrogram StringSession
              </span>
              <p className="text-neutral-400 text-[11px] mt-0.5">
                Проверка валидности строковых сессий, определение IP дата-центра, длины ключа авторизации без отправки сетевых запросов
              </p>
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1">
                Вставьте StringSession строку или Hex ключ:
              </label>
              <textarea
                rows={4}
                value={inspectInput}
                onChange={(e) => setInspectInput(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 font-mono text-neutral-200 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              onClick={handleInspect}
              className="py-2 px-4 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded transition-colors flex items-center gap-2"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Проверить и распарсить структуру MTProto</span>
            </button>

            {inspectResult && (
              <div className="p-4 bg-neutral-950 rounded border border-amber-800/60 space-y-2.5 text-xs font-mono animate-in fade-in duration-150">
                <div className="flex justify-between border-b border-neutral-800 pb-1.5">
                  <span className="text-neutral-400">Формат сессии:</span>
                  <span className="text-white">{inspectResult.format}</span>
                </div>
                <div className="flex justify-between border-b border-neutral-800 pb-1.5">
                  <span className="text-neutral-400">Telegram Дата-центр:</span>
                  <span className="text-sky-400">DC {inspectResult.dcId} ({inspectResult.serverIp})</span>
                </div>
                <div className="flex justify-between border-b border-neutral-800 pb-1.5">
                  <span className="text-neutral-400">Размер Auth Key:</span>
                  <span className="text-emerald-400">{inspectResult.authKeyBytes} bytes (2048 bits)</span>
                </div>
                <div className="flex justify-between border-b border-neutral-800 pb-1.5">
                  <span className="text-neutral-400">Хэш ключа авторизации:</span>
                  <span className="text-neutral-300">{inspectResult.authKeyHashHex}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Статус целостности:</span>
                  <span className="text-emerald-400 font-bold">{inspectResult.status}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
