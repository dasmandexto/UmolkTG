import { describe, it, expect } from 'vitest';
import { translations } from '../utils/localization';

describe('Localization & Branding (RU, EN, UK)', () => {
  it('should have ru, en, and uk language dictionaries', () => {
    expect(translations).toHaveProperty('ru');
    expect(translations).toHaveProperty('en');
    expect(translations).toHaveProperty('uk');
  });

  it('should have UmolkTG as appName in ru, en, and uk', () => {
    expect(translations.ru.appName).toBe('UmolkTG');
    expect(translations.en.appName).toBe('UmolkTG');
    expect(translations.uk.appName).toBe('UmolkTG');
  });

  it('should contain all essential navigation and status keys in ru, en, and uk', () => {
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
      'navMenu',
      'activeThreads',
      'proxiesAlive',
      'liveSpeed',
      'statsTotalAccounts',
      'statsActiveReady',
    ];

    const langs = ['ru', 'en', 'uk'] as const;

    for (const lang of langs) {
      for (const key of requiredKeys) {
        expect(translations[lang]).toHaveProperty(key);
        expect(typeof translations[lang][key]).toBe('string');
        expect((translations[lang][key] as string).length).toBeGreaterThan(0);
      }
    }
  });

  it('should have 100% matching key sets between ru, en, and uk', () => {
    const ruKeys = Object.keys(translations.ru).sort();
    const enKeys = Object.keys(translations.en).sort();
    const ukKeys = Object.keys(translations.uk).sort();
    
    // Check missing in en or uk compared to ru
    const missingInEn = ruKeys.filter((k) => !enKeys.includes(k));
    const missingInUk = ruKeys.filter((k) => !ukKeys.includes(k));
    
    // Check missing in ru
    const missingInRuFromEn = enKeys.filter((k) => !ruKeys.includes(k));
    const missingInRuFromUk = ukKeys.filter((k) => !ruKeys.includes(k));

    expect(missingInEn).toEqual([]);
    expect(missingInUk).toEqual([]);
    expect(missingInRuFromEn).toEqual([]);
    expect(missingInRuFromUk).toEqual([]);
  });
});
