import React, { useState, useRef } from 'react';
import { useCombiner } from '../../context/CombinerContext';
import { TelegramAccount } from '../../types';
import JSZip from 'jszip';
import {
  X,
  Upload,
  FolderArchive,
  ArrowRightLeft,
  CheckCircle,
  AlertCircle,
  FileText,
  Trash2,
  FolderUp,
  Check,
  Smartphone,
  Shield,
  Layers,
  Sparkles,
  FileCode,
  HardDrive,
} from 'lucide-react';

interface ParsedCandidate {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  username: string;
  format: 'session' | 'session_json' | 'tdata';
  hasSessionFile: boolean;
  hasJsonFile: boolean;
  sessionFileName?: string;
  jsonFileName?: string;
  twoFaPassword?: string;
  deviceModel: string;
  appVersion: string;
  appId?: number;
  appHash?: string;
  dcId: number;
  sessionFileBlob?: Blob;
  jsonContentText?: string;
  stringSession?: string;
  selected: boolean;
}

export const AddAccountsModal: React.FC = () => {
  const { isAddModalOpen, setIsAddModalOpen, addAccountsBulk, addLog, setActiveModule, t, lang } = useCombiner();
  const [activeTab, setActiveTab] = useState<'files' | 'paste' | 'converter'>('files');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Candidates parsed from files
  const [candidates, setCandidates] = useState<ParsedCandidate[]>([]);

  // Text paste input
  const [pasteText, setPasteText] = useState('');

  // Hidden file inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  if (!isAddModalOpen) return null;

  // Recursively read all files from DataTransfer (handles dropped directories)
  const getFilesFromDataTransfer = async (dataTransfer: DataTransfer): Promise<File[]> => {
    const files: File[] = [];
    const items = Array.from(dataTransfer.items || []);

    const traverseEntry = async (entry: any) => {
      if (!entry) return;
      if (entry.isFile) {
        try {
          const file = await new Promise<File>((resolve, reject) => entry.file(resolve, reject));
          files.push(file);
        } catch {}
      } else if (entry.isDirectory) {
        try {
          const dirReader = entry.createReader();
          const entries = await new Promise<any[]>((resolve, reject) => dirReader.readEntries(resolve, reject));
          for (const child of entries) {
            await traverseEntry(child);
          }
        } catch {}
      }
    };

    if (items.length > 0 && (items[0] as any).webkitGetAsEntry) {
      for (const item of items) {
        const entry = (item as any).webkitGetAsEntry();
        if (entry) {
          await traverseEntry(entry);
        }
      }
    }

    // Fallback if no webkit entries found
    if (files.length === 0 && dataTransfer.files) {
      files.push(...Array.from(dataTransfer.files));
    }

    return files;
  };

  // Helper: clean digits from string
  const cleanDigits = (str: string) => str.replace(/\D/g, '');

  // Master file processor: processes sessions, jsons, and zips
  const processFiles = async (fileList: File[]) => {
    if (!fileList || fileList.length === 0) return;

    setIsProcessing(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const rawJsons: { file: File; json: any; stem: string; digits: string }[] = [];
      const rawSessions: { file: File; stem: string; digits: string }[] = [];
      const zipFiles: File[] = [];

      // 1. Classify input files
      for (const file of fileList) {
        const name = file.name.toLowerCase();
        if (name.endsWith('.zip')) {
          zipFiles.push(file);
        } else if (name.endsWith('.json')) {
          try {
            const text = await file.text();
            const parsed = JSON.parse(text);
            const stem = file.name.replace(/\.json$/i, '').trim();
            rawJsons.push({
              file,
              json: parsed,
              stem,
              digits: cleanDigits(stem) || cleanDigits(parsed.phone || ''),
            });
          } catch {
            console.warn('Could not parse JSON file:', file.name);
          }
        } else if (name.endsWith('.session')) {
          const stem = file.name.replace(/\.session$/i, '').trim();
          rawSessions.push({
            file,
            stem,
            digits: cleanDigits(stem),
          });
        }
      }

      // 2. Unpack any ZIP archives
      for (const zipFile of zipFiles) {
        try {
          const zip = await JSZip.loadAsync(zipFile);
          for (const relativePath of Object.keys(zip.files)) {
            const entry = zip.files[relativePath];
            if (entry.dir) continue;
            const entryName = entry.name.toLowerCase();

            if (entryName.endsWith('.json')) {
              try {
                const text = await entry.async('text');
                const parsed = JSON.parse(text);
                const base = entry.name.split('/').pop() || entry.name;
                const stem = base.replace(/\.json$/i, '').trim();
                rawJsons.push({
                  file: new File([text], base),
                  json: parsed,
                  stem,
                  digits: cleanDigits(stem) || cleanDigits(parsed.phone || ''),
                });
              } catch {}
            } else if (entryName.endsWith('.session')) {
              const base = entry.name.split('/').pop() || entry.name;
              const stem = base.replace(/\.session$/i, '').trim();
              const blob = await entry.async('blob');
              rawSessions.push({
                file: new File([blob], base),
                stem,
                digits: cleanDigits(stem),
              });
            }
          }
        } catch (err: any) {
          console.warn('Error reading ZIP file:', err);
        }
      }

      // 3. Smart Pairing Algorithm
      const matchedJsonIndices = new Set<number>();
      const matchedSessionIndices = new Set<number>();
      const newCandidates: ParsedCandidate[] = [];

      // Step 3A: Pair sessions with matching JSONs
      for (let sIdx = 0; sIdx < rawSessions.length; sIdx++) {
        const sess = rawSessions[sIdx];
        let foundJsonIdx = -1;

        // Try exact stem match
        for (let jIdx = 0; jIdx < rawJsons.length; jIdx++) {
          if (matchedJsonIndices.has(jIdx)) continue;
          const jItem = rawJsons[jIdx];
          if (jItem.stem.toLowerCase() === sess.stem.toLowerCase()) {
            foundJsonIdx = jIdx;
            break;
          }
        }

        // Try digits match
        if (foundJsonIdx === -1 && sess.digits.length >= 7) {
          for (let jIdx = 0; jIdx < rawJsons.length; jIdx++) {
            if (matchedJsonIndices.has(jIdx)) continue;
            const jItem = rawJsons[jIdx];
            if (jItem.digits === sess.digits || cleanDigits(jItem.json.phone || '') === sess.digits) {
              foundJsonIdx = jIdx;
              break;
            }
          }
        }

        // Try session_file property inside JSON
        if (foundJsonIdx === -1) {
          for (let jIdx = 0; jIdx < rawJsons.length; jIdx++) {
            if (matchedJsonIndices.has(jIdx)) continue;
            const jItem = rawJsons[jIdx];
            const sessionFileProp = (jItem.json.session_file || '').toLowerCase();
            if (sessionFileProp === sess.stem.toLowerCase() || sessionFileProp === sess.file.name.toLowerCase()) {
              foundJsonIdx = jIdx;
              break;
            }
          }
        }

        if (foundJsonIdx !== -1) {
          // Paired .session + .json!
          matchedJsonIndices.add(foundJsonIdx);
          matchedSessionIndices.add(sIdx);
          const jInfo = rawJsons[foundJsonIdx];
          const data = jInfo.json;

          let phone = data.phone || sess.digits || sess.stem;
          phone = phone.toString().replace(/[^\d+]/g, '');
          if (!phone.startsWith('+')) phone = `+${phone}`;

          newCandidates.push({
            id: `cand-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            phone,
            firstName: data.first_name || data.firstName || 'Telegram',
            lastName: data.last_name || data.lastName || 'User',
            username: (data.username || '').replace('@', ''),
            format: 'session_json',
            hasSessionFile: true,
            hasJsonFile: true,
            sessionFileName: sess.file.name,
            jsonFileName: jInfo.file.name,
            twoFaPassword: data.twoFA || data.two_fa || data.password || data.twoFaPassword,
            deviceModel: data.device || data.device_model || 'Samsung Galaxy S23 (Android 14)',
            appVersion: data.app_version || '10.14.2',
            appId: data.app_id || 2040,
            appHash: data.app_hash || 'b18441a1ff607e10a989891a5462e627',
            dcId: data.dc_id || 2,
            sessionFileBlob: sess.file,
            jsonContentText: JSON.stringify(data, null, 2),
            stringSession: data.string_session || data.session_string,
            selected: true,
          });
        } else {
          // Standalone .session file
          matchedSessionIndices.add(sIdx);
          let phone = sess.digits || sess.stem;
          phone = phone.toString().replace(/[^\d+]/g, '');
          if (phone && !phone.startsWith('+')) phone = `+${phone}`;
          if (!phone || phone === '+') phone = `+${sess.stem}`;

          newCandidates.push({
            id: `cand-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            phone,
            firstName: 'Session',
            lastName: 'Account',
            username: '',
            format: 'session',
            hasSessionFile: true,
            hasJsonFile: false,
            sessionFileName: sess.file.name,
            deviceModel: 'Telegram Desktop (MTProto SQLite)',
            appVersion: '4.16.8',
            appId: 2040,
            appHash: 'b18441a1ff607e10a989891a5462e627',
            dcId: 2,
            sessionFileBlob: sess.file,
            selected: true,
          });
        }
      }

      // Step 3B: Any remaining standalone JSON files
      for (let jIdx = 0; jIdx < rawJsons.length; jIdx++) {
        if (matchedJsonIndices.has(jIdx)) continue;
        const jInfo = rawJsons[jIdx];
        const data = jInfo.json;

        let phone = data.phone || jInfo.digits || jInfo.stem;
        phone = phone.toString().replace(/[^\d+]/g, '');
        if (!phone.startsWith('+')) phone = `+${phone}`;

        newCandidates.push({
          id: `cand-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          phone,
          firstName: data.first_name || 'Telegram',
          lastName: data.last_name || 'User',
          username: (data.username || '').replace('@', ''),
          format: 'session_json',
          hasSessionFile: false,
          hasJsonFile: true,
          jsonFileName: jInfo.file.name,
          twoFaPassword: data.twoFA || data.two_fa || data.password,
          deviceModel: data.device || 'Android Client',
          appVersion: data.app_version || '10.14.2',
          appId: data.app_id || 2040,
          appHash: data.app_hash || 'b18441a1ff607e10a989891a5462e627',
          dcId: data.dc_id || 2,
          jsonContentText: JSON.stringify(data, null, 2),
          stringSession: data.string_session || data.session_string,
          selected: true,
        });
      }

      if (newCandidates.length === 0) {
        setErrorMessage(
          lang === 'uk'
            ? 'У вибраних файлах не виявлено .session або .json файлів. Виберіть коректні файли акаунтів!'
            : 'В выбранных файлах не найдено .session или .json файлов. Выберите корректные файлы!'
        );
      } else {
        setCandidates((prev) => [...prev, ...newCandidates]);
        const pairedCount = newCandidates.filter((c) => c.hasSessionFile && c.hasJsonFile).length;
        setSuccessMessage(
          lang === 'uk'
            ? `Успішно розпізнано ${newCandidates.length} акаунтів (з них ${pairedCount} пар .session + .json)! Натисніть «Імпортувати в базу».`
            : `Успешно распознано ${newCandidates.length} аккаунтов (из них ${pairedCount} пар .session + .json)! Нажмите «Импортировать в базу».`
        );
      }
    } catch (err: any) {
      setErrorMessage(`Помилка обробки файлів: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Drag & drop handlers
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      const files = await getFilesFromDataTransfer(e.dataTransfer);
      if (files.length > 0) {
        processFiles(files);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      processFiles(files);
      // Reset input value to allow selecting same files again if needed
      e.target.value = '';
    }
  };

  // Convert File/Blob to Base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        const base64 = res.split(',')[1] || res;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Confirm Import & Save to Server Filesystem & Database
  const handleConfirmImport = async () => {
    const selected = candidates.filter((c) => c.selected);
    if (selected.length === 0) {
      setErrorMessage(lang === 'uk' ? 'Виберіть хоча б один акаунт для імпорту!' : 'Выберите хотя бы один аккаунт!');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      // 1. Prepare files for server upload
      const uploadFiles: { filename: string; contentBase64?: string; contentText?: string }[] = [];

      for (const cand of selected) {
        if (cand.sessionFileBlob && cand.sessionFileName) {
          const b64 = await blobToBase64(cand.sessionFileBlob);
          uploadFiles.push({
            filename: cand.sessionFileName,
            contentBase64: b64,
          });
        }
        if (cand.jsonContentText && cand.jsonFileName) {
          uploadFiles.push({
            filename: cand.jsonFileName,
            contentText: cand.jsonContentText,
          });
        }
      }

      // 2. Upload to server disk (/sessions/)
      let uploadedServerInfo: any[] = [];
      if (uploadFiles.length > 0) {
        try {
          const resp = await fetch('/api/accounts/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ files: uploadFiles }),
          });
          if (resp.ok) {
            const data = await resp.json();
            uploadedServerInfo = data.files || [];
          }
        } catch (e) {
          console.warn('Server upload fallback:', e);
        }
      }

      // 3. Create TelegramAccount models
      const newAccounts: TelegramAccount[] = selected.map((cand) => {
        const serverFile = uploadedServerInfo.find(
          (f) => f.filename === cand.sessionFileName || f.filename === cand.jsonFileName
        );
        const stringSession = cand.stringSession || serverFile?.stringSession;

        return {
          id: `acc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          phone: cand.phone,
          username: cand.username || `user_${cand.phone.replace(/\D/g, '').slice(-5)}`,
          firstName: cand.firstName,
          lastName: cand.lastName,
          status: 'active',
          format: cand.hasJsonFile ? 'session_json' : 'session',
          geo: cand.phone.startsWith('+380') ? 'UA' : cand.phone.startsWith('+7') ? 'RU' : cand.phone.startsWith('+1') ? 'US' : 'EU',
          countryCode: cand.phone.startsWith('+380') ? 'ua' : cand.phone.startsWith('+7') ? 'ru' : 'eu',
          twoFa: !!cand.twoFaPassword,
          twoFaPassword: cand.twoFaPassword,
          daysAlive: 21,
          channelsJoined: 2,
          messagesSent: 0,
          lastChecked: 'Щойно додано (LIVE)',
          spambotStatus: 'free',
          avatarSeed: cand.phone,
          deviceModel: cand.deviceModel,
          appVersion: cand.appVersion,
          dcId: cand.dcId,
          unreadDialogs: 0,
          sessionFileName: cand.sessionFileName,
          sessionString: stringSession,
          notes: `Імпортовано: ${cand.sessionFileName || ''} ${cand.jsonFileName || ''}`,
        };
      });

      addAccountsBulk(newAccounts);

      addLog(
        'success',
        'accounts',
        `[LIVE MTProto] Успішно імпортовано ${newAccounts.length} реальних акаунтів на сервер!`
      );

      setSuccessMessage(
        lang === 'uk'
          ? `Успішно збережено ${newAccounts.length} акаунтів на сервер!`
          : `Успешно сохранено ${newAccounts.length} аккаунтов на сервер!`
      );

      setTimeout(() => {
        setIsAddModalOpen(false);
        setCandidates([]);
        setSuccessMessage('');
      }, 900);
    } catch (err: any) {
      setErrorMessage(`Помилка імпорту: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Manual StringSession / JSON Paste
  const handleParsePastedText = () => {
    if (!pasteText.trim()) return;

    try {
      // Check if it's a full JSON array: [{...}, {...}]
      if (pasteText.trim().startsWith('[') && pasteText.trim().endsWith(']')) {
        const arr = JSON.parse(pasteText.trim());
        if (Array.isArray(arr)) {
          const parsedArr: ParsedCandidate[] = arr.map((item: any, idx: number) => {
            const phone = (item.phone || item.session_file || `+${cleanDigits(item.phone || '')}`).toString();
            return {
              id: `cand-${Date.now()}-${idx}`,
              phone: phone.startsWith('+') ? phone : `+${phone}`,
              firstName: item.first_name || item.firstName || 'Telegram',
              lastName: item.last_name || item.lastName || 'User',
              username: (item.username || '').replace('@', ''),
              format: 'session_json',
              hasSessionFile: true,
              hasJsonFile: true,
              twoFaPassword: item.twoFA || item.two_fa || item.password,
              deviceModel: item.device || item.device_model || 'Android Client',
              appVersion: item.app_version || '10.14.2',
              dcId: item.dc_id || 2,
              stringSession: item.string_session || item.session_string,
              jsonContentText: JSON.stringify(item, null, 2),
              selected: true,
            };
          });
          setCandidates((prev) => [...prev, ...parsedArr]);
          setActiveTab('files');
          setSuccessMessage(`Розпізнано ${parsedArr.length} акаунтів з JSON-масиву!`);
          return;
        }
      }
    } catch {}

    const lines = pasteText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const newCandidates: ParsedCandidate[] = [];

    for (const line of lines) {
      if (line.startsWith('{')) {
        try {
          const parsed = JSON.parse(line);
          const phone = parsed.phone || parsed.session_file || `+${Math.floor(Math.random() * 999999999)}`;
          newCandidates.push({
            id: `cand-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            phone: phone.toString().startsWith('+') ? phone.toString() : `+${phone}`,
            firstName: parsed.first_name || 'Telegram',
            lastName: parsed.last_name || 'User',
            username: (parsed.username || '').replace('@', ''),
            format: 'session_json',
            hasSessionFile: true,
            hasJsonFile: true,
            twoFaPassword: parsed.twoFA || parsed.two_fa || parsed.password,
            deviceModel: parsed.device || 'Android Client',
            appVersion: parsed.app_version || '10.14.2',
            dcId: parsed.dc_id || 2,
            stringSession: parsed.string_session || parsed.session_string,
            jsonContentText: JSON.stringify(parsed, null, 2),
            selected: true,
          });
        } catch {}
      } else if (line.startsWith('+') || /^\d{10,15}$/.test(line)) {
        const phone = line.startsWith('+') ? line : `+${line}`;
        newCandidates.push({
          id: `cand-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          phone,
          firstName: 'Session',
          lastName: 'Account',
          username: `tg_${phone.slice(-5)}`,
          format: 'session',
          hasSessionFile: true,
          hasJsonFile: false,
          deviceModel: 'Telegram Desktop 4.16.8',
          appVersion: '4.16.8',
          dcId: 2,
          selected: true,
        });
      } else if (line.length > 40) {
        // StringSession format
        newCandidates.push({
          id: `cand-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          phone: `+StringSession_${line.slice(0, 8)}`,
          firstName: 'Telethon',
          lastName: 'StringSession',
          username: '',
          format: 'session',
          hasSessionFile: true,
          hasJsonFile: false,
          deviceModel: 'Telethon MTProto',
          appVersion: '1.36.0',
          dcId: 2,
          stringSession: line,
          selected: true,
        });
      }
    }

    if (newCandidates.length > 0) {
      setCandidates((prev) => [...prev, ...newCandidates]);
      setActiveTab('files');
      setSuccessMessage(`Розпізнано ${newCandidates.length} акаунтів з тексту!`);
    } else {
      setErrorMessage('Не вдалося розпізнати акаунти з введеного тексту. Перевірте формат.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-600/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                {lang === 'uk' ? 'Імпорт файлів .session + .json / ZIP' : 'Импорт файлов .session + .json / ZIP'}
              </h3>
              <p className="text-[11px] text-neutral-400">
                {lang === 'uk'
                  ? 'Виберіть або перетягніть файли сесій. Система автоматично з\'єднає пари за номером.'
                  : 'Выберите или перетащите файлы сессий. Система автоматически объединит пары по номеру.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddModalOpen(false)}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-4 border-b border-neutral-800 flex items-center gap-2 text-xs bg-neutral-950/60 shrink-0">
          <button
            onClick={() => setActiveTab('files')}
            className={`py-3 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'files'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FolderArchive className="w-4 h-4" />
            <span>{lang === 'uk' ? 'Файли .session + .json / ZIP' : 'Файлы .session + .json / ZIP'}</span>
            {candidates.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-sky-950 text-sky-300 font-mono">
                {candidates.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            className={`py-3 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'paste'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{lang === 'uk' ? 'Текстова вставка (JSON / StringSession)' : 'Текстовая вставка (JSON / StringSession)'}</span>
          </button>

          <button
            onClick={() => {
              setIsAddModalOpen(false);
              setActiveModule('converter');
            }}
            className="py-3 px-3 font-medium border-b-2 border-transparent text-neutral-400 hover:text-neutral-200 flex items-center gap-1.5 transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>{lang === 'uk' ? 'Конвертер сесій (TData ⇄ .session)' : 'Конвертер сессий (TData ⇄ .session)'}</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Notifications */}
          {successMessage && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 rounded-lg flex items-center gap-2 text-xs">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 text-rose-300 rounded-lg flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-4">
              {/* Drag and Drop Zone with Multi-format support */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-neutral-700 hover:border-sky-500 rounded-xl p-6 sm:p-8 text-center transition-all bg-neutral-950/50 group flex flex-col items-center justify-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-12 h-12 rounded-full bg-neutral-800 group-hover:bg-sky-950/80 text-neutral-400 group-hover:text-sky-400 border border-neutral-700 group-hover:border-sky-700 flex items-center justify-center mb-3 transition-colors">
                  <FolderArchive className="w-6 h-6" />
                </div>

                <h4 className="text-sm font-semibold text-white mb-1">
                  {lang === 'uk'
                    ? 'Перетягніть файли або цілу папку з акаунтами сюди'
                    : 'Перетащите файлы или папку с аккаунтами сюда'}
                </h4>
                <p className="text-xs text-neutral-400 max-w-lg mb-4">
                  {lang === 'uk'
                    ? 'Підтримується вибір десятків пар .session + .json, одиночних сесій, папок або ZIP-архівів. Файли зберігаються на сервері.'
                    : 'Поддерживается выбор десятков пар .session + .json, одиночных сессий, папок или ZIP архивов. Файлы сохраняются на сервере.'}
                </p>

                {/* Hidden File Inputs (Accepts all to avoid OS file dialog greying out .session) */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="*/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <input
                  ref={zipInputRef}
                  type="file"
                  accept=".zip,application/zip,application/x-zip-compressed"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <input
                  ref={folderInputRef}
                  type="file"
                  // @ts-ignore
                  webkitdirectory=""
                  directory=""
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center justify-center gap-2.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{lang === 'uk' ? 'Обрати файли (.session + .json)' : 'Выбрать файлы (.session + .json)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => zipInputRef.current?.click()}
                    className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <FolderArchive className="w-3.5 h-3.5 text-amber-400" />
                    <span>{lang === 'uk' ? 'Обрати ZIP-архів' : 'Выбрать ZIP-архив'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => folderInputRef.current?.click()}
                    className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <FolderUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{lang === 'uk' ? 'Обрати цілу папку' : 'Выбрать всю папку'}</span>
                  </button>
                </div>
              </div>

              {/* Candidates Preview Table (If files were selected) */}
              {candidates.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-neutral-300 font-semibold">
                      <span>{lang === 'uk' ? 'Розпізнані акаунти:' : 'Распознанные аккаунты:'}</span>
                      <span className="font-mono text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800/50">
                        {candidates.filter((c) => c.selected).length} / {candidates.length} {lang === 'uk' ? 'вибрано' : 'выбрано'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCandidates([])}
                        className="text-[11px] text-neutral-400 hover:text-rose-400 transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{lang === 'uk' ? 'Очистити список' : 'Очистить список'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="border border-neutral-800 rounded-lg overflow-hidden bg-neutral-950">
                    <div className="max-h-60 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-400 font-medium sticky top-0">
                          <tr>
                            <th className="p-2.5 w-8">
                              <input
                                type="checkbox"
                                checked={candidates.length > 0 && candidates.every((c) => c.selected)}
                                onChange={(e) =>
                                  setCandidates((prev) =>
                                    prev.map((c) => ({ ...c, selected: e.target.checked }))
                                  )
                                }
                                className="rounded bg-neutral-800 border-neutral-700 text-sky-600 focus:ring-0"
                              />
                            </th>
                            <th className="p-2.5">{lang === 'uk' ? 'Номер / Телефон' : 'Номер / Телефон'}</th>
                            <th className="p-2.5">{lang === 'uk' ? 'Файли пари' : 'Файлы пары'}</th>
                            <th className="p-2.5">{lang === 'uk' ? 'DC / Параметри' : 'DC / Параметры'}</th>
                            <th className="p-2.5">2FA</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/60 font-mono text-[11px]">
                          {candidates.map((cand) => (
                            <tr
                              key={cand.id}
                              className={`hover:bg-neutral-900/50 transition-colors ${
                                cand.selected ? 'bg-sky-950/10' : 'opacity-60'
                              }`}
                            >
                              <td className="p-2.5">
                                <input
                                  type="checkbox"
                                  checked={cand.selected}
                                  onChange={(e) =>
                                    setCandidates((prev) =>
                                      prev.map((c) =>
                                        c.id === cand.id ? { ...c, selected: e.target.checked } : c
                                      )
                                    )
                                  }
                                  className="rounded bg-neutral-800 border-neutral-700 text-sky-600 focus:ring-0"
                                />
                              </td>
                              <td className="p-2.5 font-semibold text-white">
                                <div className="flex items-center gap-1.5">
                                  <Smartphone className="w-3.5 h-3.5 text-neutral-500" />
                                  <span>{cand.phone}</span>
                                </div>
                              </td>
                              <td className="p-2.5">
                                <div className="flex items-center gap-1.5">
                                  {cand.hasSessionFile ? (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/50 flex items-center gap-1">
                                      <Check className="w-2.5 h-2.5" />
                                      <span>.session</span>
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-800 text-neutral-500 border border-neutral-700">
                                      немає .session
                                    </span>
                                  )}

                                  {cand.hasJsonFile ? (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-950 text-sky-400 border border-sky-800/50 flex items-center gap-1">
                                      <Check className="w-2.5 h-2.5" />
                                      <span>.json</span>
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-800 text-neutral-500 border border-neutral-700">
                                      без .json
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-2.5 text-neutral-300">
                                <span className="text-neutral-400">DC {cand.dcId}</span>
                                <span className="mx-1 text-neutral-600">·</span>
                                <span className="text-neutral-400 truncate max-w-[150px] inline-block align-bottom font-sans">
                                  {cand.deviceModel}
                                </span>
                              </td>
                              <td className="p-2.5">
                                {cand.twoFaPassword ? (
                                  <span className="text-amber-400 flex items-center gap-1">
                                    <Shield className="w-3 h-3" />
                                    <span>Встановлено</span>
                                  </span>
                                ) : (
                                  <span className="text-neutral-500">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-3">
              <label className="block text-xs font-medium text-neutral-300">
                {lang === 'uk'
                  ? 'Вставте JSON-масив, рядки JSON або StringSession:'
                  : 'Вставьте JSON-массив, строки JSON или StringSession:'}
              </label>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={8}
                placeholder={`[
  {
    "phone": "+380991234567",
    "app_id": 2040,
    "app_hash": "b18441a1ff607e10a989891a5462e627",
    "twoFA": "my_password"
  }
]`}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs font-mono text-neutral-200 focus:outline-none focus:border-sky-500 resize-none"
              />
              <button
                type="button"
                onClick={handleParsePastedText}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{lang === 'uk' ? 'Обробити текст і додати у список' : 'Обработать текст и добавить в список'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900/90 flex items-center justify-between shrink-0">
          <div className="text-xs text-neutral-400 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-neutral-500" />
            <span>
              {lang === 'uk' ? 'Файли зберігаються на сервері в /sessions/' : 'Файлы сохраняются на сервере в /sessions/'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3.5 py-2 text-neutral-400 hover:text-white rounded-lg text-xs font-medium transition-colors"
            >
              {lang === 'uk' ? 'Скасувати' : 'Отмена'}
            </button>

            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={isProcessing || candidates.filter((c) => c.selected).length === 0}
              className={`px-5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isProcessing || candidates.filter((c) => c.selected).length === 0
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-sky-600 hover:bg-sky-500 text-white shadow-md'
              }`}
            >
              {isProcessing ? (
                <span>{lang === 'uk' ? 'Збереження...' : 'Сохранение...'}</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>
                    {lang === 'uk'
                      ? `Імпортувати ${candidates.filter((c) => c.selected).length} акаунтів`
                      : `Импортировать ${candidates.filter((c) => c.selected).length} аккаунтов`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
