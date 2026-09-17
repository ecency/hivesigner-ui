// The languages the app ships, and how a browser's preference picks one.
//
// Kept free of i18next so `lib/prefs` can use it without importing the
// dictionaries. `file` is the dictionary's name in `locales/` and the locale
// Crowdin writes it under; `code` is what i18next, storage and the language
// menu use.

export interface LanguageInfo {
  code: string;
  file: string;
  /** The language's own name for itself, as the menu shows it. */
  name: string;
  /** The `lang` attribute, when it should say more than `code`. */
  htmlLang?: string;
  rtl?: true;
}

export const LANGUAGES = [
  { code: 'en', file: 'en-US', name: 'English' },
  { code: 'ar', file: 'ar-SA', name: 'العربية', rtl: true },
  { code: 'bg', file: 'bg-BG', name: 'Български' },
  { code: 'bn', file: 'bn-BD', name: 'বাংলা' },
  { code: 'de', file: 'de-DE', name: 'Deutsch' },
  { code: 'es', file: 'es-ES', name: 'Español' },
  { code: 'fa', file: 'fa-IR', name: 'فارسی', rtl: true },
  { code: 'fr', file: 'fr-FR', name: 'Français' },
  { code: 'hi', file: 'hi-IN', name: 'हिन्दी' },
  { code: 'id', file: 'id-ID', name: 'Bahasa Indonesia' },
  { code: 'it', file: 'it-IT', name: 'Italiano' },
  { code: 'ja', file: 'ja-JP', name: '日本語' },
  { code: 'ko', file: 'ko-KR', name: '한국어' },
  { code: 'nl', file: 'nl-NL', name: 'Nederlands' },
  { code: 'pl', file: 'pl-PL', name: 'Polski' },
  { code: 'pt', file: 'pt-BR', name: 'Português' },
  { code: 'ru', file: 'ru-RU', name: 'Русский' },
  { code: 'sr', file: 'sr-CS', name: 'Srpski', htmlLang: 'sr-Latn' },
  { code: 'th', file: 'th-TH', name: 'ไทย' },
  { code: 'tr', file: 'tr-TR', name: 'Türkçe' },
  { code: 'uk', file: 'uk-UA', name: 'Українська' },
  { code: 'uz', file: 'uz-UZ', name: 'Oʻzbekcha', htmlLang: 'uz-Latn' },
  { code: 'vi', file: 'vi-VN', name: 'Tiếng Việt' },
  { code: 'zh-CN', file: 'zh-CN', name: '简体中文', htmlLang: 'zh-Hans' },
  { code: 'zh-TW', file: 'zh-TW', name: '繁體中文', htmlLang: 'zh-Hant' },
] as const satisfies readonly LanguageInfo[];

export type Language = (typeof LANGUAGES)[number]['code'];

export const LANGUAGE_CODES: readonly Language[] = LANGUAGES.map((l) => l.code);

export function isLanguage(value: unknown): value is Language {
  return (LANGUAGE_CODES as readonly unknown[]).includes(value);
}

export function languageInfo(code: string): LanguageInfo {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

// Chinese is chosen by script, not by country: Traditional for Taiwan, Hong
// Kong and Macau or an explicit Hant, Simplified otherwise.
const TRADITIONAL = new Set(['hant', 'tw', 'hk', 'mo']);
// Retired codes some systems still send.
const ALIASES: Record<string, Language> = { in: 'id' };

/** The shipped language a BCP 47 tag asks for, or null. */
export function matchLanguage(tag: string): Language | null {
  const [base = '', ...rest] = tag
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
    .split('-');
  if (base === 'zh') {
    if (rest.includes('hans')) return 'zh-CN';
    return rest.some((part) => TRADITIONAL.has(part)) ? 'zh-TW' : 'zh-CN';
  }
  if (Object.hasOwn(ALIASES, base)) return ALIASES[base];
  return isLanguage(base) ? base : null;
}

/**
 * The first language in the browser's preference list that the app ships,
 * otherwise English. The list is in the user's order, so an English speaker
 * who also reads Spanish stays in English.
 */
export function detectLanguage(preferred: readonly string[]): Language {
  for (const tag of preferred) {
    const match = typeof tag === 'string' ? matchLanguage(tag) : null;
    if (match) return match;
  }
  return 'en';
}

/** The browser's preference list, empty where there is none. */
export function browserLanguages(): readonly string[] {
  try {
    if (navigator.languages?.length) return navigator.languages;
    return navigator.language ? [navigator.language] : [];
  } catch {
    return [];
  }
}
