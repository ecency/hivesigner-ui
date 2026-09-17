import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getStoredLanguage, setLanguage } from './prefs';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('language preference', () => {
  it('is empty until a language is picked, then round-trips it', () => {
    expect(getStoredLanguage()).toBeNull();
    setLanguage('zh-TW');
    expect(getStoredLanguage()).toBe('zh-TW');
  });

  it('ignores a stored value the app does not ship', () => {
    localStorage.setItem('hs_lang', 'xx');
    expect(getStoredLanguage()).toBeNull();
    localStorage.setItem('hs_lang', 'constructor');
    expect(getStoredLanguage()).toBeNull();
  });

  it('keeps a pick stored by the previous app version', () => {
    localStorage.setItem('hs_lang', 'ru');
    expect(getStoredLanguage()).toBe('ru');
  });

  it('survives blocked storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => setLanguage('ru')).not.toThrow();
    expect(getStoredLanguage()).toBeNull();
  });
});
