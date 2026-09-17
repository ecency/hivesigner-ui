import * as Sentry from '@sentry/browser';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { isChunkLoadError } from '@/lib/chunk-reload';
import { getStoredLanguage, setLanguage } from '@/lib/prefs';
import {
  browserLanguages,
  detectLanguage,
  LANGUAGE_CODES,
  type Language,
  languageInfo,
} from './languages';
import { english, loaders } from './locales';

// Starts in English, the only dictionary in the bundle, and moves to the
// user's language once its dictionary has loaded (see `startLanguage`).
//
// The dictionaries use single-brace {item} placeholders (Vue i18n style, kept
// from the previous app), so i18next's interpolation is configured to match.
i18n.use(initReactI18next).init({
  resources: { en: { translation: english } },
  lng: 'en',
  fallbackLng: 'en',
  supportedLngs: [...LANGUAGE_CODES],
  // `zh-TW` is a dictionary of its own; never look for a plain `zh`.
  load: 'currentOnly',
  interpolation: {
    escapeValue: false,
    prefix: '{',
    suffix: '}',
  },
});

// The document follows the dictionary: `lang` for screen readers, fonts and
// hyphenation, `dir` so Arabic and Persian lay out right to left.
const syncDocument = (lng: string) => {
  try {
    const info = languageInfo(lng);
    document.documentElement.lang = info.htmlLang ?? info.code;
    document.documentElement.dir = info.rtl ? 'rtl' : 'ltr';
  } catch {
    // no document (tests without DOM)
  }
};
syncDocument(i18n.language);
i18n.on('languageChanged', syncDocument);

/** Fetch a language's dictionary if it is not here yet. */
export async function loadLanguage(lang: Language): Promise<void> {
  if (lang === 'en' || i18n.hasResourceBundle(lang, 'translation')) return;
  const { default: dictionary } = await loaders[lang]();
  i18n.addResourceBundle(lang, 'translation', dictionary);
}

// Only the newest request may change the language: a slow dictionary must not
// override a language picked while it was loading.
let latest = 0;

const reported = new Set<string>();

/** Tell error monitoring, once per language per page load, that one failed. */
function reportFailure(lang: Language, error: unknown): void {
  if (reported.has(lang)) return;
  reported.add(lang);
  queueMicrotask(() => {
    try {
      Sentry.captureMessage(`language_load_failed: ${lang}`, {
        level: 'warning',
        fingerprint: ['language_load_failed'],
        tags: { chunk: String(isChunkLoadError(error)) },
      });
    } catch {
      // Reporting must never break the page it reports on.
    }
  });
}

/**
 * Show the app in `lang`. `remember` is for a language the user picked: it is
 * stored once it is showing. Resolves false when the language could not be
 * loaded (the page stays as it was, nothing is stored) or a newer request
 * took over.
 */
export async function switchLanguage(
  lang: Language,
  { remember = false }: { remember?: boolean } = {},
): Promise<boolean> {
  const request = ++latest;
  deferred = null;
  try {
    await loadLanguage(lang);
  } catch (error) {
    reportFailure(lang, error);
    return false;
  }
  if (request !== latest) return false;
  if (remember) setLanguage(lang);
  await i18n.changeLanguage(lang);
  return true;
}

// Screens where the user reads a request before approving it. A language that
// arrives after such a screen is showing waits for the next page, rather than
// rewriting (and for Arabic and Persian, mirroring) what is being read.
const APPROVAL = /^\/(sign|oauth2|authorize|revoke|login|login-request)(\/|$)/;

let deferred: { lang: Language; path: string } | null = null;

/** Apply a language that was held back, once the user is on another page. */
export function applyDeferredLanguage(pathname: string): void {
  if (!deferred || deferred.path === pathname) return;
  const { lang } = deferred;
  deferred = null;
  void i18n.changeLanguage(lang);
}

/**
 * Start the app in its language: the user's pick, else the browser's, else
 * English. Settles once that language is showing, or after `waitMs`, so the
 * first screen can render; a language that loads later still applies (see
 * APPROVAL). A pick whose file cannot be loaded falls back to the browser's
 * language rather than straight to English.
 */
export function startLanguage(
  waitMs: number,
  pathname: () => string = () => window.location.pathname,
): Promise<void> {
  const candidates = [
    ...new Set([getStoredLanguage(), detectLanguage(browserLanguages())]),
  ].filter((lang): lang is Exclude<Language, 'en'> => !!lang && lang !== 'en');
  if (candidates.length === 0) return Promise.resolve();
  const request = ++latest;
  let rendered = false;
  const shown = (async () => {
    for (const lang of candidates) {
      try {
        await loadLanguage(lang);
      } catch (error) {
        reportFailure(lang, error);
        continue;
      }
      if (request !== latest) return;
      const path = pathname();
      if (rendered && APPROVAL.test(path)) {
        deferred = { lang, path };
        return;
      }
      await i18n.changeLanguage(lang);
      return;
    }
  })();
  const waited = new Promise<void>((resolve) => setTimeout(resolve, waitMs));
  return Promise.race([shown, waited]).then(() => {
    rendered = true;
  });
}

export default i18n;
