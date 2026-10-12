import React, { useState } from 'react';
import { useCombiner } from '../../context/CombinerContext';
import { AccountStatus } from '../../types';
import {
  Users,
  Search,
  Plus,
  ShieldCheck,
  Radio,
  Flame,
  Download,
  Trash2,
  CheckSquare,
  Square,
  Eye,
  Info,
  ArrowRightLeft,
  Globe,
  Zap,
} from 'lucide-react';

export const AccountsManager: React.FC = () => {
  const {
    t,
    accounts,
    selectedAccountIds,
    toggleSelectAccount,
    selectAllAccounts,
    deleteSelectedAccounts,
    assignProxyToSelected,
    checkAccountsSpambot,
    proxies,
    setSelectedAccountForDetail,
    setIsAddModalOpen,
    setActiveModule,
    setWebTelegramAccount,
  } = useCombiner();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProxyIdForBulk, setSelectedProxyIdForBulk] = useState<string>(proxies[0]?.id || '');

  // Filtered accounts
  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      acc.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (acc.notes && acc.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' ? true : acc.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const isAllSelected =
    filteredAccounts.length > 0 &&
    filteredAccounts.every((acc) => selectedAccountIds.includes(acc.id));

  const hasSelection = selectedAccountIds.length > 0;

  const getStatusColor = (status: AccountStatus) => {
    switch (status) {
      case 'active':
        return 'text-emerald-400';
      case 'spamblock':
        return 'text-amber-400';
      case 'banned':
        return 'text-rose-400';
      case 'warming':
        return 'text-sky-400';
      case 'cooldown':
        return 'text-purple-400';
      case 'proxy_error':
        return 'text-rose-500';
      default:
        return 'text-neutral-400';
    }
  };

  const getStatusLabel = (status: AccountStatus) => {
    switch (status) {
      case 'active':
        return t.filterActive;
      case 'spamblock':
        return t.filterSpamblock;
      case 'banned':
        return t.filterBanned;
      case 'warming':
        return t.filterWarming;
      case 'cooldown':
        return t.filterCooldown;
      case 'proxy_error':
        return t.filterProxyError;
      default:
        return status;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 rounded p-4">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-400" />
            <span>{t.navAccounts}</span>
            <span className="text-xs font-mono font-normal text-neutral-400">
              ({filteredAccounts.length} / {accounts.length})
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Управление TData и .session сессиями, проверка ограничений, ротация профилей
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveModule('converter')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-sky-400" />
            <span>Конвертер TData ⇄ .session</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.btnImportAccounts}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t.searchAccounts}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Filter Segmented Control (buttons with active state, no static pills) */}
        <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 p-1 rounded overflow-x-auto text-xs">
          {[
            { id: 'all', label: t.filterAll },
            { id: 'active', label: t.filterActive },
            { id: 'spamblock', label: t.filterSpamblock },
            { id: 'warming', label: t.filterWarming },
            { id: 'cooldown', label: t.filterCooldown },
            { id: 'banned', label: t.filterBanned },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-neutral-800 text-sky-400 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Operations Toolbar */}
      {hasSelection && (
        <div className="bg-neutral-900 border border-sky-800/60 rounded px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-neutral-200">
            <span className="font-semibold text-sky-400 font-mono">
              Выбрано: {selectedAccountIds.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={checkAccountsSpambot}
              className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>{t.btnCheckSpamBot}</span>
            </button>

            {/* Assign proxy dropdown */}
            <div className="flex items-center gap-1.5 bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
              <Radio className="w-3.5 h-3.5 text-neutral-400" />
              <select
                value={selectedProxyIdForBulk}
                onChange={(e) => setSelectedProxyIdForBulk(e.target.value)}
                className="bg-transparent text-xs text-neutral-200 focus:outline-none"
              >
                {proxies.map((p) => (
                  <option key={p.id} value={p.id} className="bg-neutral-900 text-neutral-200">
                    {p.title} ({p.host})
                  </option>
                ))}
              </select>
              <button
                onClick={() => assignProxyToSelected(selectedProxyIdForBulk)}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium px-1"
              >
                Привязать
              </button>
            </div>

            <button
              onClick={() => {
                alert(`Экспорт ${selectedAccountIds.length} сессий в ZIP-архив подготовлен!`);
              }}
              className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.btnExportSessions}</span>
            </button>

            <button
              onClick={deleteSelectedAccounts}
              className="flex items-center gap-1 px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.btnDeleteSelected}</span>
            </button>
          </div>
        </div>
      )}

      {/* High-Density Accounts Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-medium">
              <tr>
                <th className="py-2.5 px-3 w-8">
                  <button
                    onClick={() => selectAllAccounts(!isAllSelected)}
                    className="text-neutral-400 hover:text-neutral-200"
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-sky-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-2.5 px-3">{t.tablePhone}</th>
                <th className="py-2.5 px-3">{t.tableUsername}</th>
                <th className="py-2.5 px-3">{t.tableFormat}</th>
                <th className="py-2.5 px-3">{t.tableGeo}</th>
                <th className="py-2.5 px-3">{t.table2FA}</th>
                <th className="py-2.5 px-3 text-right">{t.tableAliveDays}</th>
                <th className="py-2.5 px-3 text-right">{t.tableSent}</th>
                <th className="py-2.5 px-3">{t.tableProxy}</th>
                <th className="py-2.5 px-3">{t.tableStatus}</th>
                <th className="py-2.5 px-3">{t.tableSpambot}</th>
                <th className="py-2.5 px-3 text-center">{t.tableActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-neutral-500">
                    Аккаунты не найдены по заданным критериям
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => {
                  const isSelected = selectedAccountIds.includes(acc.id);

                  return (
                    <tr
                      key={acc.id}
                      className={`hover:bg-neutral-800/40 transition-colors ${
                        isSelected ? 'bg-neutral-800/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => toggleSelectAccount(acc.id)}
                          className="text-neutral-400 hover:text-neutral-200"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-sky-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Phone / Avatar */}
                      <td className="py-2.5 px-3 font-mono text-neutral-200 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-neutral-800 flex items-center justify-center text-[10px] text-sky-400 font-bold">
                            {acc.firstName.charAt(0)}
                          </span>
                          <span>{acc.phone}</span>
                        </div>
                      </td>

                      {/* Username & Name */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-medium text-neutral-200">
                          {acc.firstName} {acc.lastName}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          @{acc.username}
                        </div>
                      </td>

                      {/* Format */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-400">
                        {acc.format === 'tdata' ? 'TData' : '.session'}
                      </td>

                      {/* Geo */}
                      <td className="py-2.5 px-3 font-mono text-neutral-300">
                        <span className="uppercase">{acc.geo}</span>
                      </td>

                      {/* 2FA */}
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-mono text-[11px] ${
                            acc.twoFa ? 'text-emerald-400' : 'text-neutral-500'
                          }`}
                        >
                          {acc.twoFa ? 'Active' : 'None'}
                        </span>
                      </td>

                      {/* Days alive */}
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-300">
                        {acc.daysAlive} дн
                      </td>

                      {/* Messages sent */}
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-300">
                        {acc.messagesSent}
                      </td>

                      {/* Proxy */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-400 truncate max-w-[120px]">
                        {acc.proxyIp || 'Direct'}
                      </td>

                      {/* Status (unboxed text with colored dot) */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 font-medium ${getStatusColor(acc.status)}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          <span>{getStatusLabel(acc.status)}</span>
                        </span>
                      </td>

                      {/* SpamBot */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`text-[11px] font-mono ${
                            acc.spambotStatus === 'free'
                              ? 'text-emerald-400'
                              : acc.spambotStatus === 'limited'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {acc.spambotStatus === 'free'
                            ? 'Clean'
                            : acc.spambotStatus === 'limited'
                            ? 'Temp Block'
                            : 'Perm Ban'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setWebTelegramAccount(acc)}
                            className="p-1 text-sky-400 hover:text-sky-300 rounded hover:bg-neutral-800 transition-colors"
                            title={
                              acc.format !== 'tdata'
                                ? 'Швидкий запуск сесії (автоконвертація .session ➔ TData)'
                                : 'Швидкий запуск сесії (TData)'
                            }
                          >
                            <Globe className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedAccountForDetail(acc)}
                            className="p-1 text-neutral-400 hover:text-neutral-200 rounded hover:bg-neutral-800 transition-colors"
                            title="Параметры сессии и устройство"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards List (< md screens) */}
        <div className="md:hidden divide-y divide-neutral-800">
          {filteredAccounts.length === 0 ? (
            <div className="p-6 text-center text-neutral-500 text-xs">
              Нет аккаунтов по заданным критериям
            </div>
          ) : (
            filteredAccounts.map((acc) => {
              const isSelected = selectedAccountIds.includes(acc.id);
              return (
                <div
                  key={acc.id}
                  className={`p-3 space-y-2.5 transition-colors ${
                    isSelected ? 'bg-sky-950/20' : 'bg-neutral-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        onClick={() => toggleSelectAccount(acc.id)}
                        className="text-neutral-400 hover:text-neutral-200 shrink-0"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-sky-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold text-white">
                            {acc.phone}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${getStatusColor(acc.status)}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            <span>{getStatusLabel(acc.status)}</span>
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                          {acc.firstName} {acc.lastName} {acc.username ? `(@${acc.username})` : ''}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 uppercase shrink-0">
                      {acc.format}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-neutral-950/60 p-2 rounded border border-neutral-800/60 text-neutral-400">
                    <div>
                      <span className="text-neutral-500 block text-[9px] uppercase">Гео:</span>
                      <span className="text-neutral-300">{acc.geo} · DC{acc.dcId}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[9px] uppercase">Відправлено:</span>
                      <span className="text-neutral-300">{acc.messagesSent} msg</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[9px] uppercase">2FA / Відлежка:</span>
                      <span className={acc.twoFa ? 'text-emerald-400' : 'text-neutral-400'}>
                        {acc.twoFa ? '2FA ON' : 'No 2FA'} · {acc.daysAlive}д
                      </span>
                    </div>
                  </div>

                  {/* Mobile Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-mono text-neutral-500 truncate max-w-[150px]">
                      {acc.proxyIp || 'Direct'}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setWebTelegramAccount(acc)}
                        className="px-2.5 py-1 bg-sky-950 text-sky-400 border border-sky-800/60 hover:bg-sky-900/60 rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                        title={
                          acc.format !== 'tdata'
                            ? 'Швидкий запуск сесії (автоконвертація .session ➔ TData)'
                            : 'Швидкий запуск сесії (TData)'
                        }
                      >
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>Запустити сесію</span>
                      </button>
                      <button
                        onClick={() => setSelectedAccountForDetail(acc)}
                        className="p-1 text-neutral-400 hover:text-white bg-neutral-800 rounded transition-colors"
                        title="Деталі"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
