import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getLanguage, setLanguage } from './prefs';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('language preference', () => {
  it('defaults to English and round-trips a supported choice', () => {
    expect(getLanguage()).toBe('en');
    setLanguage('ru');
    expect(getLanguage()).toBe('ru');
  });

  it('ignores an unsupported stored value', () => {
    localStorage.setItem('hs_lang', 'xx');
    expect(getLanguage()).toBe('en');
  });

  it('survives blocked storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => setLanguage('ru')).not.toThrow();
    expect(getLanguage()).toBe('en');
  });
});
