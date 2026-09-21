// The docs pages, in the order the navigation shows them.
//
// Each page is one Markdown file per language, `src/docs/<lang>/<slug>.md`,
// and its title and description are in that language's `pages.json`. English
// is complete; another language has the pages it has, and a page it lacks is
// shown in English. No imports on purpose: the build scripts load this file
// with Node directly (scripts/docs-markdown.mjs, scripts/prerender-meta.mjs).

export const DOC_SECTIONS = [
  { key: 'users', pages: ['accounts', 'signing-in', 'signing', 'safety'] },
  {
    key: 'developers',
    pages: [
      'how-it-works',
      'register-app',
      'oauth2',
      'tokens',
      'api',
      'sign-links',
      'message-signing',
      'sdk',
      'login-only',
      'image-uploads',
    ],
  },
  { key: 'more', pages: ['faq'] },
] as const;

export type DocSection = (typeof DOC_SECTIONS)[number]['key'];

/** Every page, the docs home first. */
export const DOC_SLUGS = [
  'index',
  ...DOC_SECTIONS.flatMap((section) => section.pages),
] as const;

export type DocSlug = (typeof DOC_SLUGS)[number];

export function isDocSlug(value: string): value is DocSlug {
  return (DOC_SLUGS as readonly string[]).includes(value);
}

/** What a language's `pages.json` holds. */
export interface DocIndex {
  sections: Partial<Record<DocSection, string>>;
  pages: Partial<Record<DocSlug, { title: string; description: string }>>;
}

/** A page's path: English at /docs/<slug>, any other language at
    /docs/<lang>/<slug>, with the language code in lower case. */
export function docHref(slug: string, lang = 'en'): string {
  const base = lang === 'en' ? '/docs' : `/docs/${lang.toLowerCase()}`;
  return slug === 'index' ? base : `${base}/${slug}`;
}

// A link to a docs page as the English build writes it: only the page names
// there are, so a language code (/docs/de) is never read as one.
const PAGE_LINK = new RegExp(
  `href="\\/docs(?:\\/(${DOC_SLUGS.filter((s) => s !== 'index').join('|')}))?(#[a-z0-9-]+)?"`,
  'g',
);

/** A page rendered for English, with its links to other docs pages moved to
    `lang`: an untranslated page shown under /docs/<lang>/ keeps the reader
    there. The build writes those links exactly as docHref does. */
export function localizeDocLinks(html: string, lang: string): string {
  if (lang === 'en') return html;
  return html.replace(
    PAGE_LINK,
    (_all, slug: string | undefined, hash: string | undefined) =>
      `href="${docHref(slug ?? 'index', lang)}${hash ?? ''}"`,
  );
}
