import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_PATH = path.resolve(__dirname, '../../data/store.json');

// Default official Telegram Desktop API credentials
export const DEFAULT_TG_API_ID = 2040;
export const DEFAULT_TG_API_HASH = 'b18441a1ff607e10a989891a5462e627';

export interface PersistentStore {
  operatingMode: 'live' | 'simulation';
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
      return { ...DEFAULT_STORE, ...parsed };
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
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Store] Failed to save store.json:', err);
  }
}

// In-memory cache of TelegramClient instances
const clientCache = new Map<string, TelegramClient>();

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
  const sessionString = account.sessionString || account.authKey || '';

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

// 5. Real Proxy Connection Tester (TCP ping to Telegram DC)
export async function testProxyLatency(host: string, port: number): Promise<{ alive: boolean; latencyMs: number; error?: string }> {
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
