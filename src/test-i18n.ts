import { act } from '@testing-library/react';
import i18n from './i18n';
import type { Language } from './i18n/languages';

/**
 * Show the app in `lang` with `strings` as its dictionary, for a test that
 * needs a translation with a known shape (another word order, other plural
 * forms) rather than whatever the shipped file says today. Returns the undo.
 */
export async function installTestDictionary(
  lang: Exclude<Language, 'en'>,
  strings: object,
): Promise<() => Promise<void>> {
  i18n.addResourceBundle(lang, 'translation', strings, true, true);
  await act(() => i18n.changeLanguage(lang));
  return async () => {
    i18n.removeResourceBundle(lang, 'translation');
    await act(() => i18n.changeLanguage('en'));
  };
}
