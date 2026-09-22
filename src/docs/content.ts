import type { Language } from '@/i18n/languages';
import english from './en/pages.json';
import type { DocIndex, DocSlug } from './pages';

/** A docs page as the build renders it (scripts/docs-markdown.mjs). */
export interface RenderedDoc {
  html: string;
  headings: { level: 2 | 3; id: string; text: string }[];
  /** The links as written, before they were made local. */
  links: string[];
}

/** The languages with a docs folder of their own, `src/docs/<code>/`, by
    the app's own codes. The docs tests check this list against the folders. */
export const DOC_LANGUAGES: readonly Language[] = ['en', 'es'];

/** Whether `lang` has docs of its own. */
export const hasDocs = (lang: string, languages = DOC_LANGUAGES) =>
  (languages as readonly string[]).includes(lang);

/** A language's own page titles and descriptions, for the pages it has
    translated: none for a language with no docs yet. */
export async function loadDocIndex(lang: string): Promise<DocIndex> {
  if (lang === 'en') return english;
  if (!hasDocs(lang)) return { sections: {}, pages: {} };
  const { default: own } = (await import(`./${lang}/pages.json`)) as {
    default: DocIndex;
  };
  return own;
}

/** Whether `lang` has its own copy of the page. */
export const hasPage = (index: DocIndex, slug: DocSlug) =>
  Object.hasOwn(index.pages, slug);

/** The page in `lang`. Only asked for a page its index lists. */
export async function loadDocPage(
  lang: string,
  slug: DocSlug,
): Promise<RenderedDoc> {
  const { default: page } = await import(`./${lang}/${slug}.md`);
  return page;
}

// Typed from the file itself: a page missing from it fails the typecheck.
export const englishIndex = english;
