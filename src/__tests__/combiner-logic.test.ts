import { describe, it, expect } from 'vitest';
import {
  initialAccounts,
  initialProxies,
  initialTasks,
  initialLogs,
  sampleParsedUsers,
  defaultSettings,
} from '../data/mockData';

describe('UmolkTG Data Models & Core State', () => {
  it('should have initial telegram accounts with valid properties', () => {
    expect(initialAccounts.length).toBeGreaterThan(0);
    const validStatuses = ['active', 'spamblock', 'banned', 'warming', 'cooldown', 'proxy_error'];
    const validFormats = ['tdata', 'session_json', 'pyrogram'];

    for (const acc of initialAccounts) {
      expect(acc).toHaveProperty('id');
      expect(acc).toHaveProperty('phone');
      expect(acc).toHaveProperty('status');
      expect(validStatuses).toContain(acc.status);
      expect(acc.phone.length).toBeGreaterThan(5);
      expect(validFormats).toContain(acc.format);
      expect(typeof acc.daysAlive).toBe('number');
      expect(typeof acc.messagesSent).toBe('number');
    }
  });

  it('should have properly configured proxies with valid protocols', () => {
    expect(initialProxies.length).toBeGreaterThan(0);
    const validTypes = ['socks5', 'http', 'https', 'mobile_rotating'];
    const validStatuses = ['alive', 'dead', 'slow'];

    for (const proxy of initialProxies) {
      expect(proxy).toHaveProperty('id');
      expect(proxy).toHaveProperty('host');
      expect(proxy).toHaveProperty('port');
      expect(validTypes).toContain(proxy.type);
      expect(validStatuses).toContain(proxy.status);
      expect(proxy.assignedAccountsCount).toBeGreaterThanOrEqual(0);
      expect(typeof proxy.ping).toBe('number');
    }
  });

  it('should have automation tasks with valid types and counters', () => {
    expect(initialTasks.length).toBeGreaterThan(0);
    const validTypes = ['sender_dm', 'sender_chat', 'inviter', 'parser', 'warmup', 'cloner', 'checker', 'dialer'];
    const validStatuses = ['running', 'paused', 'completed', 'failed', 'scheduled'];

    for (const task of initialTasks) {
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('name');
      expect(validTypes).toContain(task.type);
      expect(validStatuses).toContain(task.status);
      expect(task.progressCurrent).toBeLessThanOrEqual(task.progressTotal);
      expect(task.accountsAssigned).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have valid parsed users for targeting', () => {
    expect(sampleParsedUsers.length).toBeGreaterThan(0);
    for (const user of sampleParsedUsers) {
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('userId');
      expect(user).toHaveProperty('username');
      expect(user.username.length).toBeGreaterThan(0);
      expect(typeof user.hasAvatar).toBe('boolean');
      expect(typeof user.isPremium).toBe('boolean');
      expect(typeof user.isBot).toBe('boolean');
    }
  });

  it('should have valid default combiner settings', () => {
    expect(defaultSettings).toHaveProperty('telegramApiId');
    expect(defaultSettings).toHaveProperty('telegramApiHash');
    expect(defaultSettings).toHaveProperty('smsProvider');
    expect(defaultSettings).toHaveProperty('maxThreads');
    expect(defaultSettings).toHaveProperty('globalFloodDelay');
    expect(defaultSettings).toHaveProperty('autoStopOnBans');
    expect(defaultSettings.maxThreads).toBeGreaterThan(0);
    expect(defaultSettings.globalFloodDelay).toBeGreaterThanOrEqual(0);
  });

  it('should have initial log entries with correct modules and levels', () => {
    expect(initialLogs.length).toBeGreaterThan(0);
    const validLevels = ['info', 'success', 'warn', 'error', 'flood'];
    const validModules = ['accounts', 'parser', 'sender', 'inviter', 'warmup', 'proxy', 'system'];

    for (const log of initialLogs) {
      expect(log).toHaveProperty('id');
      expect(log).toHaveProperty('timestamp');
      expect(log).toHaveProperty('level');
      expect(log).toHaveProperty('module');
      expect(log).toHaveProperty('message');
      expect(validLevels).toContain(log.level);
      expect(validModules).toContain(log.module);
      expect(log.message.length).toBeGreaterThan(0);
    }
  });
});
