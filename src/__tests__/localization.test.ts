import { describe, it, expect } from 'vitest';
import { translations } from '../utils/localization';

describe('Localization & Branding', () => {
  it('should have both ru and en language dictionaries', () => {
    expect(translations).toHaveProperty('ru');
    expect(translations).toHaveProperty('en');
  });

  it('should have UmolkTG as appName in both ru and en', () => {
    expect(translations.ru.appName).toBe('UmolkTG');
    expect(translations.en.appName).toBe('UmolkTG');
  });

  it('should contain all essential navigation and status keys in ru and en', () => {
    const requiredKeys: (keyof typeof translations.ru)[] = [
      'appName',
      'tagline',
      'navOverview',
      'navAccounts',
      'navParser',
      'navSender',
      'navInviter',
      'navWarmup',
      'navConverter',
      'navDialer',
      'navProxies',
      'navTasks',
      'navLogs',
      'navSettings',
      'activeThreads',
      'proxiesAlive',
      'liveSpeed',
      'statsTotalAccounts',
      'statsActiveReady',
    ];

    for (const key of requiredKeys) {
      expect(translations.ru).toHaveProperty(key);
      expect(translations.en).toHaveProperty(key);
      expect(typeof translations.ru[key]).toBe('string');
      expect(typeof translations.en[key]).toBe('string');
      expect((translations.ru[key] as string).length).toBeGreaterThan(0);
      expect((translations.en[key] as string).length).toBeGreaterThan(0);
    }
  });

  it('should have matching key sets between ru and en', () => {
    const ruKeys = Object.keys(translations.ru).sort();
    const enKeys = Object.keys(translations.en).sort();
    
    // Check missing in en
    const missingInEn = ruKeys.filter((k) => !enKeys.includes(k));
    // Check missing in ru
    const missingInRu = enKeys.filter((k) => !ruKeys.includes(k));

    expect(missingInEn).toEqual([]);
    expect(missingInRu).toEqual([]);
  });
});
