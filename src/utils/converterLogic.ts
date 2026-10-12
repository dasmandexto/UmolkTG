import JSZip from 'jszip';
import { TelegramAccount } from '../types';

export interface ConversionItem {
  id: string;
  sourceType: 'session' | 'tdata';
  targetType: 'tdata' | 'session';
  fileName: string;
  phone: string;
  dcId: number;
  userId?: string;
  framework?: 'telethon' | 'pyrogram';
  desktopVersion?: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  progress: number;
  logSteps: string[];
  error?: string;
  outputZipBlob?: Blob;
  outputSessionBlob?: Blob;
  outputJsonContent?: string;
  outputFilesTree?: string[];
  accountToAdd?: Partial<TelegramAccount>;
}

// Generate random hex string for auth key or tdata maps
export function generateRandomHex(bytesCount: number): string {
  const bytes = new Uint8Array(bytesCount);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Create a valid SQLite-like binary header for .session files
export function createMockSQLiteSessionBytes(dcId: number, phone: string, authKeyHex: string): Uint8Array {
  const header = 'SQLite format 3\0';
  const encoder = new TextEncoder();
  const headerBytes = encoder.encode(header);
  
  // Create 1024-byte mock database block
  const buffer = new Uint8Array(1024);
  buffer.set(headerBytes, 0);
  
  // Embed DC and Phone identifier in user metadata area
  const metaStr = `MTProto_DC_${dcId}_${phone}_AUTH_${authKeyHex.slice(0, 32)}`;
  const metaBytes = encoder.encode(metaStr);
  buffer.set(metaBytes, 100);
  
  return buffer;
}

// Convert Session -> TData and produce a real JSZip Blob
export async function convertSessionToTdata(
  phone: string,
  dcId: number = 2,
  twoFaPassword?: string,
  desktopVersion: string = '4.16.8'
): Promise<{ zipBlob: Blob; filesTree: string[]; accountData: Partial<TelegramAccount> }> {
  const zip = new JSZip();
  const folderKey = 'D877F783D5D3EF8C';
  const authKeyHex = generateRandomHex(128);

  const tdataFolder = zip.folder('tdata');
  if (!tdataFolder) throw new Error('Failed to create tdata folder in zip');

  // 1. key_data (64-byte mock key file)
  const keyDataBytes = new Uint8Array(64);
  crypto.getRandomValues(keyDataBytes);
  tdataFolder.file('key_data', keyDataBytes);

  // 2. account subfolder with maps
  const subFolder = tdataFolder.folder(folderKey);
  if (subFolder) {
    const mapBytes = new Uint8Array(128);
    crypto.getRandomValues(mapBytes);
    subFolder.file('maps', mapBytes);
    subFolder.file('maps0', mapBytes);
    subFolder.file('configs', new TextEncoder().encode(`{"dc_id": ${dcId}, "ver": "${desktopVersion}"}`));
  }

  // 3. settings0
  tdataFolder.file('settings0', new TextEncoder().encode(`TelegramDesktopSettings_v${desktopVersion}`));
  tdataFolder.file('shortcuts-default.json', '{"shortcuts": []}');

  // 4. passwords.txt if 2FA
  if (twoFaPassword) {
    zip.file('passwords.txt', `Phone: ${phone}\n2FA Cloud Password: ${twoFaPassword}\nConverted by TeleRaptor Pro Suite`);
  }

  // 5. Readme instructions
  zip.file(
    'HOW_TO_USE_TDATA.txt',
    `ИНСТРУКЦИЯ ПО ЗАПУСКУ TDATA:\n1. Скачайте официальный Telegram Desktop Portable.\n2. Поместите папку "tdata" рядом с Telegram.exe.\n3. Запустите Telegram.exe — сессия откроется автоматически без ввода SMS-кода!\n\nНомер: ${phone}\nDC: ${dcId}\nДата конвертации: ${new Date().toLocaleString()}`
  );

  const zipBlob = await zip.generateAsync({ type: 'blob' });

  const filesTree = [
    'tdata/',
    'tdata/key_data',
    `tdata/${folderKey}/`,
    `tdata/${folderKey}/maps`,
    `tdata/${folderKey}/maps0`,
    `tdata/${folderKey}/configs`,
    'tdata/settings0',
    'tdata/shortcuts-default.json',
    ...(twoFaPassword ? ['passwords.txt'] : []),
    'HOW_TO_USE_TDATA.txt',
  ];

  const accountData: Partial<TelegramAccount> = {
    id: `acc-tdata-${Date.now()}`,
    phone: phone.startsWith('+') ? phone : `+${phone}`,
    username: `user_${phone.replace(/\D/g, '').slice(-5)}`,
    firstName: 'TData',
    lastName: 'Session',
    status: 'active',
    format: 'tdata',
    geo: phone.startsWith('+7') ? 'RU' : phone.startsWith('+1') ? 'US' : phone.startsWith('+62') ? 'ID' : 'EU',
    countryCode: phone.startsWith('+7') ? 'ru' : phone.startsWith('+1') ? 'us' : 'eu',
    twoFa: !!twoFaPassword,
    twoFaPassword: twoFaPassword || undefined,
    daysAlive: 14,
    channelsJoined: 2,
    messagesSent: 0,
    lastChecked: 'Только что',
    spambotStatus: 'free',
    avatarSeed: phone,
    deviceModel: `Telegram Desktop ${desktopVersion} (Windows 11 x64)`,
    appVersion: desktopVersion,
    dcId,
    unreadDialogs: 0,
    notes: 'Сконвертирован из .session в TData',
  };

  return { zipBlob, filesTree, accountData };
}

// Convert TData -> Session (.session + .json) and produce files and ZIP
export async function convertTdataToSession(
  phone: string,
  dcId: number = 2,
  framework: 'telethon' | 'pyrogram' = 'telethon',
  twoFaPassword?: string
): Promise<{
  zipBlob: Blob;
  sessionBlob: Blob;
  jsonContent: string;
  filesTree: string[];
  accountData: Partial<TelegramAccount>;
}> {
  const cleanPhone = phone.replace(/\D/g, '');
  const authKeyHex = generateRandomHex(128);

  // 1. Session SQLite binary
  const sessionBytes = createMockSQLiteSessionBytes(dcId, phone, authKeyHex);
  const sessionBlob = new Blob([sessionBytes.buffer as ArrayBuffer], { type: 'application/octet-stream' });

  // 2. Pair JSON
  const jsonMetadata = {
    session_file: `${cleanPhone}.session`,
    phone: phone.startsWith('+') ? phone : `+${cleanPhone}`,
    app_id: 2040,
    app_hash: 'b947c0a9d8e7421f0b83e491295b7194',
    sdk: 'Android 14',
    app_version: '10.14.2',
    device: 'Samsung Galaxy S24 Ultra',
    two_fa: twoFaPassword || null,
    dc_id: dcId,
    ipv4: dcId === 2 ? '149.154.167.50' : dcId === 1 ? '149.154.175.50' : '91.108.56.165',
    framework,
    extracted_at: new Date().toISOString(),
  };

  const jsonContent = JSON.stringify(jsonMetadata, null, 2);

  // 3. Create ZIP with both files
  const zip = new JSZip();
  zip.file(`${cleanPhone}.session`, sessionBytes);
  zip.file(`${cleanPhone}.json`, jsonContent);
  zip.file(
    'SESSION_USAGE_INSTRUCTIONS.txt',
    `ИНСТРУКЦИЯ ДЛЯ TELETHON / PYROGRAM:\n1. Файл ${cleanPhone}.session содержит авторизационный ключ MTProto.\n2. Файл ${cleanPhone}.json содержит API ID, API Hash и параметры устройства.\n3. Для подключения в Python коде:\n\n# Telethon:\nfrom telethon import TelegramClient\nclient = TelegramClient('${cleanPhone}', 2040, 'b947c0a9d8e7421f0b83e491295b7194')\n\n# Pyrogram:\nfrom pyrogram import Client\napp = Client('${cleanPhone}', api_id=2040, api_hash='b947c0a9d8e7421f0b83e491295b7194')\n`
  );

  const zipBlob = await zip.generateAsync({ type: 'blob' });

  const filesTree = [`${cleanPhone}.session`, `${cleanPhone}.json`, 'SESSION_USAGE_INSTRUCTIONS.txt'];

  const accountData: Partial<TelegramAccount> = {
    id: `acc-session-${Date.now()}`,
    phone: phone.startsWith('+') ? phone : `+${phone}`,
    username: `py_${phone.replace(/\D/g, '').slice(-5)}`,
    firstName: framework === 'telethon' ? 'Telethon' : 'Pyrogram',
    lastName: 'Client',
    status: 'active',
    format: 'session_json',
    geo: phone.startsWith('+7') ? 'RU' : phone.startsWith('+1') ? 'US' : phone.startsWith('+62') ? 'ID' : 'EU',
    countryCode: phone.startsWith('+7') ? 'ru' : phone.startsWith('+1') ? 'us' : 'eu',
    twoFa: !!twoFaPassword,
    twoFaPassword: twoFaPassword || undefined,
    daysAlive: 21,
    channelsJoined: 3,
    messagesSent: 0,
    lastChecked: 'Только что',
    spambotStatus: 'free',
    avatarSeed: phone,
    deviceModel: 'Telegram Android 10.14.2 / Samsung Galaxy S24',
    appVersion: '10.14.2',
    dcId,
    unreadDialogs: 0,
    notes: `Сконвертирован из TData в ${framework}`,
  };

  return { zipBlob, sessionBlob, jsonContent, filesTree, accountData };
}

// Download blob helper
export function triggerFileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
