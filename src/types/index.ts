export type Language = 'ru' | 'en';

export type AccountStatus = 'active' | 'spamblock' | 'banned' | 'warming' | 'cooldown' | 'proxy_error';

export type AccountFormat = 'tdata' | 'session_json' | 'pyrogram' | 'session';

export interface TelegramAccount {
  id: string;
  phone: string;
  username: string;
  firstName: string;
  lastName: string;
  status: AccountStatus;
  format: AccountFormat;
  geo: string;
  countryCode: string;
  twoFa: boolean;
  twoFaPassword?: string;
  daysAlive: number;
  channelsJoined: number;
  messagesSent: number;
  proxyId?: string;
  proxyIp?: string;
  lastChecked: string;
  spambotStatus: 'free' | 'limited' | 'permanent_block';
  spambotExpires?: string;
  avatarSeed: string;
  deviceModel: string;
  appVersion: string;
  dcId: number;
  unreadDialogs: number;
  notes?: string;
  selected?: boolean;
}

export interface ProxyItem {
  id: string;
  title: string;
  host: string;
  port: number;
  type: 'socks5' | 'http' | 'https' | 'mobile_rotating';
  auth: boolean;
  username?: string;
  password?: string;
  rotationUrl?: string;
  lastRotation?: string;
  geo: string;
  ping: number; // in ms
  status: 'alive' | 'dead' | 'slow';
  assignedAccountsCount: number;
  lastChecked: string;
}

export type TaskType = 'sender_dm' | 'sender_chat' | 'inviter' | 'parser' | 'warmup' | 'cloner' | 'checker' | 'dialer';

export type TaskStatus = 'running' | 'paused' | 'completed' | 'failed' | 'scheduled';

export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'declined' | 'busy';

export interface CallRecord {
  id: string;
  contact: string;
  accountId: string;
  accountPhone: string;
  status: CallStatus;
  durationSec: number;
  timestamp: string;
  notes?: string;
  outcome?: 'answered' | 'declined' | 'busy' | 'no_answer' | 'voicemail';
}

export interface RvcConfig {
  enabled: boolean;
  serverUrl: string;
  apiKey: string;
  selectedModel: string;
  pitchShift: number; // -12 to +12
  f0Method: 'rmvpe' | 'crepe' | 'harvest' | 'pm';
  indexRate: number;
  bufferSizeMs: number;
  monitorSelf: boolean;
}

export interface AutomationTask {
  id: string;
  name: string;
  type: TaskType;
  status: TaskStatus;
  progressCurrent: number;
  progressTotal: number;
  successCount: number;
  failedCount: number;
  floodWaitCount: number;
  speedPerMin: number;
  accountsAssigned: number;
  startedAt: string;
  estimatedTimeLeft?: string;
  targetChat?: string;
  messagePreview?: string;
  delayRange: [number, number]; // in seconds e.g. [15, 30]
}

export type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'flood';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  module: 'accounts' | 'parser' | 'sender' | 'inviter' | 'warmup' | 'proxy' | 'system';
  message: string;
  accountPhone?: string;
  target?: string;
}

export interface ParsedUser {
  id: string;
  userId: string;
  username: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  hasAvatar: boolean;
  isPremium: boolean;
  isBot: boolean;
  lastSeen: string;
  bio?: string;
  messagesInChat?: number;
  selected?: boolean;
}

export interface SettingsConfig {
  telegramApiId: string;
  telegramApiHash: string;
  smsProvider: 'sms_activate' | 'five_sim' | 'vak_sms' | 'onlinesim';
  smsApiKey: string;
  captchaProvider: 'capmonster' | 'twocaptcha' | 'anti_captcha';
  captchaApiKey: string;
  maxThreads: number;
  globalFloodDelay: number;
  autoStopOnBans: number;
  spoofDevice: string;
  autoSpambotCheckInterval: number;
}
