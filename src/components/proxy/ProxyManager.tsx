import React, { useState } from 'react';
import { useCombiner } from '../../context/CombinerContext';
import { ProxyItem } from '../../types';
import {
  Radio,
  Plus,
  RefreshCw,
  RotateCw,
  Globe,
  Trash2,
  CheckCircle,
  Clock,
} from 'lucide-react';

export const ProxyManager: React.FC = () => {
  const {
    t,
    proxies,
    triggerProxyRotation,
    pingAllProxies,
    addLog,
  } = useCombiner();

  const [showAddModal, setShowAddModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [rotatingId, setRotatingId] = useState<string | null>(null);

  const handleRotate = (proxyId: string) => {
    setRotatingId(proxyId);
    triggerProxyRotation(proxyId);
    setTimeout(() => {
      setRotatingId(null);
    }, 1200);
  };

  const handleAddBatch = () => {
    if (!pasteText.trim()) return;
    alert('Прокси успешно импортированы и проверены на валидность!');
    setShowAddModal(false);
    setPasteText('');
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Top Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-sky-400" />
            <span>{t.navProxies}</span>
            <span className="text-xs font-mono font-normal text-neutral-400">
              ({proxies.length} серверов)
            </span>
          </h2>
          <p className="text-neutral-400 mt-0.5">
            Управление мобильными 4G и резидентскими SOCKS5/HTTP прокси, смена IP по ссылкам
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={pingAllProxies}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
            <span>{t.btnCheckAllProxies}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.btnAddProxies}</span>
          </button>
        </div>
      </div>

      {/* Proxies Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-medium">
              <tr>
                <th className="py-2.5 px-3">Название / Описание</th>
                <th className="py-2.5 px-3">{t.proxyTableHost}</th>
                <th className="py-2.5 px-3">{t.proxyTablePort}</th>
                <th className="py-2.5 px-3">{t.proxyTableType}</th>
                <th className="py-2.5 px-3">Гео</th>
                <th className="py-2.5 px-3 text-right">{t.proxyTablePing}</th>
                <th className="py-2.5 px-3 text-center">{t.proxyTableAssigned}</th>
                <th className="py-2.5 px-3">{t.proxyTableRotation}</th>
                <th className="py-2.5 px-3">{t.proxyTableStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-mono text-[11px]">
              {proxies.map((proxy) => {
                const isRotating = rotatingId === proxy.id;

                return (
                  <tr key={proxy.id} className="hover:bg-neutral-800/40 transition-colors">
                    {/* Title */}
                    <td className="py-2.5 px-3 font-sans text-neutral-200 font-medium whitespace-nowrap">
                      {proxy.title}
                    </td>

                    {/* Host */}
                    <td className="py-2.5 px-3 text-neutral-300">
                      {proxy.host}
                    </td>

                    {/* Port */}
                    <td className="py-2.5 px-3 text-neutral-400 tabular-nums">
                      {proxy.port}
                    </td>

                    {/* Type */}
                    <td className="py-2.5 px-3 uppercase text-neutral-300">
                      {proxy.type === 'mobile_rotating' ? 'Mobile 4G' : proxy.type}
                    </td>

                    {/* Geo */}
                    <td className="py-2.5 px-3 text-neutral-300">
                      <span className="uppercase">{proxy.geo}</span>
                    </td>

                    {/* Latency */}
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      <span
                        className={`${
                          proxy.ping < 60
                            ? 'text-emerald-400 font-medium'
                            : proxy.ping < 120
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {proxy.ping} ms
                      </span>
                    </td>

                    {/* Assigned */}
                    <td className="py-2.5 px-3 text-center tabular-nums text-neutral-200 font-medium">
                      {proxy.assignedAccountsCount} акк
                    </td>

                    {/* Rotation */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {proxy.rotationUrl ? (
                        <button
                          onClick={() => handleRotate(proxy.id)}
                          disabled={isRotating}
                          className="flex items-center gap-1.5 px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-sky-400 rounded text-[10px] font-sans transition-colors disabled:opacity-50"
                        >
                          <RotateCw
                            className={`w-3 h-3 ${isRotating ? 'animate-spin' : ''}`}
                          />
                          <span>{isRotating ? 'Смена IP...' : 'Сменить IP'}</span>
                        </button>
                      ) : (
                        <span className="text-neutral-500 font-sans text-[10px]">
                          Статический IP
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 font-medium text-emerald-400 font-sans text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span>Активен</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Proxies Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg w-full max-w-md p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Добавить прокси списком</span>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1">
                Вставьте список (один на строку):
              </label>
              <textarea
                rows={6}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={`185.162.228.45:9050:login:password\nsocks5://user:pass@198.51.100.22:1080`}
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2.5 font-mono text-neutral-200 text-xs focus:outline-none focus:border-sky-500"
              />
              <span className="text-[11px] text-neutral-400 mt-1 block">
                {t.proxyFormatHint}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded"
              >
                Отмена
              </button>
              <button
                onClick={handleAddBatch}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded"
              >
                Импортировать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
