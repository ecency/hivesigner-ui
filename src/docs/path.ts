import { LANGUAGES, type Language } from '@/i18n/languages';
import { type DocSlug, isDocSlug } from './pages';

/** A language as a docs URL spells it: its code in lower case. */
const BY_URL = new Map<string, Language>(
  LANGUAGES.filter((l) => l.code !== 'en').map((l) => [
    l.code.toLowerCase(),
    l.code,
  ]),
);

/**
 * The page and language a docs path names, or null for a path that is not a
 * docs page. /docs and /docs/<slug> are English; /docs/<lang> and
 * /docs/<lang>/<slug> are that language.
 */
export function parseDocPath(
  pathname: string,
): { lang: Language; slug: DocSlug } | null {
  const [root, ...rest] = pathname.split('/').filter(Boolean);
  if (root !== 'docs') return null;
  const lang = BY_URL.get(rest[0] ?? '');
  const [page, ...extra] = lang ? rest.slice(1) : rest;
  // /docs/index would be a second address for /docs.
  if (extra.length > 0 || page === 'index') return null;
  const slug = page ?? 'index';
  return isDocSlug(slug) ? { lang: lang ?? 'en', slug } : null;
}
