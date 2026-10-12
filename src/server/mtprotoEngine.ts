import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';
import crypto from 'crypto';
import { execSync } from 'child_process';
import bigInt from 'big-integer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_PATH = path.resolve(__dirname, '../../data/store.json');
const SESSIONS_DIR = path.resolve(__dirname, '../../sessions');

// Default official Telegram Desktop API credentials
export const DEFAULT_TG_API_ID = 2040;
export const DEFAULT_TG_API_HASH = 'b18441a1ff607e10a989891a5462e627';

export interface PersistentStore {
  operatingMode: 'live';
  accounts: any[];
  proxies: any[];
  tasks: any[];
  settings: {
    apiId: string;
    apiHash: string;
    smsApiKey: string;
    smsService: string;
    maxDmsPerAccount: number;
    delayBetweenActions: number;
    floodWaitCooldown: number;
    autoRotateProxy: boolean;
  };
  logs: any[];
}

const DEFAULT_STORE: PersistentStore = {
  operatingMode: 'live',
  accounts: [],
  proxies: [],
  tasks: [],
  settings: {
    apiId: '2040',
    apiHash: 'b18441a1ff607e10a989891a5462e627',
    smsApiKey: '',
    smsService: 'sms-activate',
    maxDmsPerAccount: 35,
    delayBetweenActions: 25,
    floodWaitCooldown: 300,
    autoRotateProxy: true,
  },
  logs: [
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      level: 'success',
      module: 'system',
      message: 'UmolkTG LIVE MTProto Engine ініціалізовано. Режим реальної роботи активний.',
    },
  ],
};

// Load or initialize store from disk
export function loadStore(): PersistentStore {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_STORE, ...parsed, operatingMode: 'live' };
    }
  } catch (err) {
    console.error('[Store] Failed to read store.json, using defaults:', err);
  }
  saveStore(DEFAULT_STORE);
  return { ...DEFAULT_STORE };
}

// Persist store to disk
export function saveStore(store: PersistentStore): void {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    store.operatingMode = 'live';
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Store] Failed to save store.json:', err);
  }
}

// In-memory cache of TelegramClient instances
const clientCache = new Map<string, TelegramClient>();

/**
 * Extract StringSession from a .session file on disk using session_parser.py
 */
export function extractStringSessionFromDisk(sessionFilePath: string): string | null {
  try {
    if (!fs.existsSync(sessionFilePath)) return null;
    const parserScript = path.resolve(__dirname, '../../engine/session_parser.py');
    if (!fs.existsSync(parserScript)) return null;

    const out = execSync(`python3 "${parserScript}" "${sessionFilePath}"`, {
      encoding: 'utf-8',
      timeout: 5000,
    });
    const parsed = JSON.parse(out.trim());
    if (parsed.valid && parsed.stringSession) {
      return parsed.stringSession;
    }
  } catch (e) {
    console.warn(`[MTProto] Could not extract session from ${sessionFilePath}:`, e);
  }
  return null;
}

export async function getClientForAccount(
  account: any,
  customApiId?: number,
  customApiHash?: string
): Promise<TelegramClient> {
  const cacheKey = account.id || account.phone;
  if (clientCache.has(cacheKey)) {
    const cached = clientCache.get(cacheKey)!;
    if (cached.connected) {
      return cached;
    }
  }

  const apiId = customApiId || DEFAULT_TG_API_ID;
  const apiHash = customApiHash || DEFAULT_TG_API_HASH;
  let sessionString = account.sessionString || account.authKey || '';

  // If no in-memory string session, check if there's a file in sessions/
  if (!sessionString && fs.existsSync(SESSIONS_DIR)) {
    const cleanDigits = (account.phone || '').replace(/\D/g, '');
    const candidateFiles = [
      account.sessionFileName && path.join(SESSIONS_DIR, account.sessionFileName),
      cleanDigits && path.join(SESSIONS_DIR, `${cleanDigits}.session`),
      account.phone && path.join(SESSIONS_DIR, `${account.phone}.session`),
    ].filter(Boolean) as string[];

    for (const fpath of candidateFiles) {
      if (fs.existsSync(fpath)) {
        const extracted = extractStringSessionFromDisk(fpath);
        if (extracted) {
          sessionString = extracted;
          account.sessionString = extracted;
          break;
        }
      }
    }
  }

  const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
    connectionRetries: 3,
    autoReconnect: true,
    useWSS: false,
  });

  try {
    await client.connect();
    clientCache.set(cacheKey, client);
  } catch (err) {
    console.warn(`[MTProto] Could not connect client for ${account.phone}:`, err);
  }

  return client;
}

// 1. Real Account MTProto Validation
export async function checkAccountMTProto(account: any, apiId?: number, apiHash?: string) {
  try {
    const client = await getClientForAccount(account, apiId, apiHash);
    const isAuthorized = await client.isUserAuthorized();

    if (!isAuthorized) {
      return {
        valid: false,
        status: 'unauthorized',
        message: 'Сесія не авторизована або прострочена в Telegram MTProto',
      };
    }

    const me = (await client.getMe()) as Api.User;
    return {
      valid: true,
      status: 'active',
      userId: me.id?.toString(),
      firstName: me.firstName,
      lastName: me.lastName,
      username: me.username,
      phone: me.phone,
      isPremium: !!me.premium,
      dcId: client.session.dcId || 2,
    };
  } catch (err: any) {
    return {
      valid: false,
      status: 'error',
      message: err.message || 'Помилка підключення MTProto',
    };
  }
}

// 2. Real SpamBot Check via official @SpamBot
export async function checkSpambotReal(account: any, apiId?: number, apiHash?: string) {
  try {
    const client = await getClientForAccount(account, apiId, apiHash);
    const isAuthorized = await client.isUserAuthorized();

    if (!isAuthorized) {
      return {
        status: 'error',
        message: 'Акаунт не авторизований',
      };
    }

    // Send /start to SpamBot
    await client.sendMessage('SpamBot', { message: '/start' });

    // Wait 1.5 seconds for response
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const messages = await client.getMessages('SpamBot', { limit: 1 });
    const replyText = messages[0]?.message || '';

    let spambotStatus: 'free' | 'limited' | 'permanent_block' = 'free';
    if (replyText.includes('свободен') || replyText.includes('free') || replyText.includes('Good news')) {
      spambotStatus = 'free';
    } else if (replyText.includes('ограничен') || replyText.includes('limit') || replyText.includes('Unfortunately')) {
      spambotStatus = 'limited';
    } else if (replyText.includes('заблокирован') || replyText.includes('banned')) {
      spambotStatus = 'permanent_block';
    }

    return {
      status: 'success',
      spambotStatus,
      rawReply: replyText,
    };
  } catch (err: any) {
    return {
      status: 'error',
      message: err.message || 'Помилка звернення до SpamBot',
    };
  }
}

// 3. Real Chat / Group Audience Parser
export async function parseChatAudience(
  account: any,
  targetChat: string,
  limit: number = 100,
  filters: {
    onlyWithUsername?: boolean;
    excludeBots?: boolean;
    onlyPremium?: boolean;
  } = {},
  apiId?: number,
  apiHash?: string
) {
  try {
    const client = await getClientForAccount(account, apiId, apiHash);
    const isAuthorized = await client.isUserAuthorized();

    if (!isAuthorized) {
      throw new Error(`Акаунт ${account.phone} не авторизований для парсингу`);
    }

    // Clean target chat handle
    const cleanTarget = targetChat.replace('https://t.me/', '').replace('@', '').trim();
    const entity = await client.getEntity(cleanTarget);

    const participants = await client.getParticipants(entity, {
      limit: Math.min(limit, 1000),
    });

    const parsedUsers = participants
      .map((p: any) => ({
        id: p.id?.toString(),
        username: p.username || '',
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        phone: p.phone || '',
        isBot: !!p.bot,
        isPremium: !!p.premium,
      }))
      .filter((u) => {
        if (filters.excludeBots && u.isBot) return false;
        if (filters.onlyWithUsername && !u.username) return false;
        if (filters.onlyPremium && !u.isPremium) return false;
        return true;
      });

    return {
      success: true,
      targetChat: cleanTarget,
      totalFound: participants.length,
      filteredCount: parsedUsers.length,
      users: parsedUsers,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Помилка парсингу чату через MTProto',
      users: [],
    };
  }
}

// 4. Real Message Sender
export async function sendDirectMessage(
  account: any,
  recipient: string,
  messageText: string,
  apiId?: number,
  apiHash?: string
) {
  try {
    const client = await getClientForAccount(account, apiId, apiHash);
    const isAuthorized = await client.isUserAuthorized();

    if (!isAuthorized) {
      throw new Error(`Акаунт ${account.phone} не авторизований`);
    }

    const cleanRecipient = recipient.replace('https://t.me/', '').trim();
    const result = await client.sendMessage(cleanRecipient, {
      message: messageText,
    });

    return {
      success: true,
      recipient: cleanRecipient,
      messageId: result.id,
      timestamp: Date.now(),
    };
  } catch (err: any) {
    return {
      success: false,
      recipient,
      error: err.message || 'Помилка надсилання повідомлення',
    };
  }
}

// 5. Real MTProto VoIP Call Initiator
export async function initiateTelegramCall(
  account: any,
  peer: string,
  apiId?: number,
  apiHash?: string
): Promise<{
  status: 'ringing' | 'connected' | 'failed';
  peer: string;
  peerId?: string;
  callData?: any;
  error?: string;
  errorCode?: string;
  dcId?: number;
  timestamp?: number;
}> {
  try {
    const client = await getClientForAccount(account, apiId, apiHash);
    const isAuthorized = await client.isUserAuthorized();

    if (!isAuthorized) {
      return {
        status: 'failed',
        peer,
        error: `Акаунт ${account.phone} не авторизований в Telegram MTProto`,
      };
    }

    const cleanPeer = peer.replace('https://t.me/', '').replace('@', '').trim();
    let entity: any;

    try {
      entity = await client.getEntity(cleanPeer);
    } catch (e: any) {
      return {
        status: 'failed',
        peer: cleanPeer,
        error: `Користувача ${peer} не знайдено в Telegram або некоректний контакт: ${e.message}`,
      };
    }

    if (entity.bot) {
      return {
        status: 'failed',
        peer: cleanPeer,
        error: `Неможливо зателефонувати: @${cleanPeer} є ботом. Боти не підтримують Telegram VoIP`,
      };
    }

    // Prepare Diffie-Hellman cryptographic parameters for MTProto VoIP
    const gA = crypto.randomBytes(256);
    const gAHash = crypto.createHash('sha256').update(gA).digest();
    const randomId = Math.floor(Math.random() * 100000000);

    const protocol = new Api.PhoneCallProtocol({
      minLayer: 65,
      maxLayer: 93,
      udpP2p: true,
      udpReflector: true,
      libraryVersions: ['tgcalls_1.2', 'webrtc'],
    });

    try {
      const callResult = await client.invoke(
        new Api.phone.RequestCall({
          userId: entity,
          randomId,
          gAHash,
          protocol,
        })
      );

      return {
        status: 'ringing',
        peer: cleanPeer,
        peerId: entity.id?.toString(),
        callData: {
          id: (callResult as any)?.phoneCall?.id?.toString() || `${randomId}`,
          accessHash: (callResult as any)?.phoneCall?.accessHash?.toString() || '',
        },
        dcId: client.session.dcId || 2,
        timestamp: Date.now(),
      };
    } catch (callErr: any) {
      const msg = callErr.message || '';
      if (msg.includes('USER_PRIVACY_RESTRICTED')) {
        return {
          status: 'failed',
          peer: cleanPeer,
          errorCode: 'USER_PRIVACY_RESTRICTED',
          error: `Користувач @${cleanPeer} заборонив вхідні дзвінки в налаштуваннях конфіденційності Telegram (Privacy & Security > Calls)`,
        };
      }
      if (msg.includes('PARTICIPANT_VERSION_OUTDATED')) {
        return {
          status: 'failed',
          peer: cleanPeer,
          error: `Клієнт користувача @${cleanPeer} застарілий для аудіодзвінків`,
        };
      }
      if (msg.includes('FLOOD_WAIT')) {
        return {
          status: 'failed',
          peer: cleanPeer,
          error: `Telegram FloodWait: тимчасове обмеження вихідних дзвінків (${msg})`,
        };
      }
      return {
        status: 'failed',
        peer: cleanPeer,
        error: `MTProto помилка виклику: ${msg}`,
      };
    }
  } catch (err: any) {
    return {
      status: 'failed',
      peer,
      error: err.message || 'Помилка ініціалізації виклику',
    };
  }
}

// 6. Real MTProto VoIP Call Discard
export async function discardTelegramCall(
  account: any,
  callData?: any,
  durationSec: number = 0
) {
  try {
    const client = await getClientForAccount(account);
    if (callData && callData.id && callData.accessHash) {
      await client.invoke(
        new Api.phone.DiscardCall({
          peer: new Api.InputPhoneCall({
            id: bigInt(callData.id.toString()) as any,
            accessHash: bigInt(callData.accessHash.toString()) as any,
          }),
          duration: durationSec,
          reason: new Api.PhoneCallDiscardReasonHangup(),
          connectionId: bigInt(0) as any,
        })
      );
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// 7. Real Proxy Connection Tester (TCP ping to Telegram DC)
export async function testProxyLatency(
  host: string,
  port: number
): Promise<{ alive: boolean; latencyMs: number; error?: string }> {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();
    socket.setTimeout(4000);

    socket.connect(port, host, () => {
      const latencyMs = Date.now() - start;
      socket.destroy();
      resolve({ alive: true, latencyMs });
    });

    socket.on('error', (err) => {
      socket.destroy();
      resolve({ alive: false, latencyMs: 0, error: err.message });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ alive: false, latencyMs: 0, error: 'Connection timeout' });
    });
  });
}
