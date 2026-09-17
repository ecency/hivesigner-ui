import { describe, expect, it } from 'vitest';
import {
  detectLanguage,
  isLanguage,
  LANGUAGES,
  languageInfo,
  matchLanguage,
} from './languages';

describe('matchLanguage', () => {
  it('matches on the base language, whatever the region', () => {
    expect(matchLanguage('es-419')).toBe('es');
    expect(matchLanguage('pt-PT')).toBe('pt');
    expect(matchLanguage('pt_BR')).toBe('pt');
    expect(matchLanguage('DE-at')).toBe('de');
    expect(matchLanguage('sr-Cyrl-RS')).toBe('sr');
    expect(matchLanguage('fa')).toBe('fa');
  });

  it('chooses Chinese by script', () => {
    expect(matchLanguage('zh')).toBe('zh-CN');
    expect(matchLanguage('zh-CN')).toBe('zh-CN');
    expect(matchLanguage('zh-SG')).toBe('zh-CN');
    expect(matchLanguage('zh-TW')).toBe('zh-TW');
    expect(matchLanguage('zh-HK')).toBe('zh-TW');
    expect(matchLanguage('zh-Hant')).toBe('zh-TW');
    expect(matchLanguage('zh-Hans-HK')).toBe('zh-CN');
  });

  it('knows the retired code for Indonesian', () => {
    expect(matchLanguage('in-ID')).toBe('id');
  });

  it('matches nothing the app does not ship', () => {
    for (const tag of [
      'sv',
      'he-IL',
      'nb',
      '',
      '-',
      'toString',
      'constructor',
      '__proto__',
    ]) {
      expect(matchLanguage(tag), tag).toBeNull();
    }
  });
});

describe('detectLanguage', () => {
  it('takes the first preference the app ships, in the order given', () => {
    expect(detectLanguage(['sv-SE', 'ko-KR', 'en'])).toBe('ko');
    expect(detectLanguage(['en-US', 'es'])).toBe('en');
  });

  it('is English when nothing matches or there is no list', () => {
    expect(detectLanguage(['sv', 'nb'])).toBe('en');
    expect(detectLanguage([])).toBe('en');
    expect(detectLanguage([undefined as unknown as string])).toBe('en');
  });
});

describe('the language list', () => {
  it('has unique codes and files, English first', () => {
    const codes = LANGUAGES.map((l) => l.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(new Set(LANGUAGES.map((l) => l.file)).size).toBe(codes.length);
    expect(codes[0]).toBe('en');
    expect(codes).toHaveLength(25);
  });

  it('marks exactly Arabic and Persian as right to left', () => {
    expect(LANGUAGES.filter((l) => 'rtl' in l).map((l) => l.code)).toEqual([
      'ar',
      'fa',
    ]);
  });

  it('answers English for a code it does not know', () => {
    expect(languageInfo('xx').code).toBe('en');
    expect(isLanguage('en')).toBe(true);
    expect(isLanguage('EN')).toBe(false);
  });
});
