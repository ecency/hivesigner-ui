import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  document.documentElement.lang = 'en';
});
afterEach(async () => {
  const { default: i18n } = await import('./index');
  await i18n.changeLanguage('en');
});

describe('document language', () => {
  it('is applied for the language chosen at init, not only after a change', async () => {
    localStorage.setItem('hs_lang', 'ru');
    const { default: i18n } = await import('./index');
    expect(i18n.language).toBe('ru');
    expect(document.documentElement.lang).toBe('ru');
  });

  it('follows every later change', async () => {
    const { default: i18n } = await import('./index');
    await i18n.changeLanguage('ru');
    expect(document.documentElement.lang).toBe('ru');
    await i18n.changeLanguage('en');
    expect(document.documentElement.lang).toBe('en');
  });
});
