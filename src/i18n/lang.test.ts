import { afterEach, describe, expect, it } from 'vitest';
import i18n from './index';

afterEach(async () => {
  await i18n.changeLanguage('en');
});

describe('document language', () => {
  it('follows the active dictionary', async () => {
    await i18n.changeLanguage('ru');
    expect(document.documentElement.lang).toBe('ru');
    await i18n.changeLanguage('en');
    expect(document.documentElement.lang).toBe('en');
  });
});
