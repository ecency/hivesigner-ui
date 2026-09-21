// Per-route document metadata: title, description, robots and canonical.
//
// The shell (template.html) carries the landing page's metadata for crawlers
// and link unfurlers, which read HTML and run no scripts. This keeps the
// BROWSER's view in step as the SPA navigates: the tab title, the description a
// share sheet copies, and a canonical for the public pages. Anything that
// carries a request, a key or an account is `noindex`: those URLs are per-user
// and often contain a whole transaction.

export interface PageMeta {
  /** Tab title. The site name is appended unless it already is the site name. */
  title: string;
  /** The title's dictionary key, for the tab title in the user's language. */
  titleKey?: string;
  description: string;
  /** Indexable public page: gets a canonical; everything else is noindex. */
  indexable: boolean;
}

const SITE = 'Hivesigner';
const DEFAULT_DESCRIPTION =
  'Hivesigner keeps your Hive keys on your own device, shows you exactly what a transaction does before you sign it, and lets apps ask for only the permission they need.';

/** The public app pages, by EXACT path. `/apps/anything` is not a page.
    The docs pages set their own (docs/DocsView.tsx). */
export const PUBLIC_PAGES: Record<string, PageMeta> = {
  '/': {
    titleKey: 'meta.home',
    title: `${SITE} - Sign in to Hive apps without sharing your keys`,
    description: DEFAULT_DESCRIPTION,
    indexable: true,
  },
  '/apps': {
    titleKey: 'meta.apps',
    title: 'Apps that use Hivesigner',
    description:
      'Apps that broadcast to Hive through Hivesigner, ranked by how many people use them.',
    indexable: true,
  },
  '/about': {
    titleKey: 'meta.about',
    title: 'About',
    description: DEFAULT_DESCRIPTION,
    indexable: true,
  },
  '/signs': {
    titleKey: 'meta.signs',
    title: 'Signer',
    description:
      'Build a Hive transaction, review it in plain language and sign it with keys that never leave your device.',
    indexable: true,
  },
};

/** Titles for the per-user screens: the dictionary key under `meta` and the
 * English, which must match en-US.json (page-meta.test.ts checks). Absent
 * segments fall back to the site name. */
const PRIVATE_TITLES: Record<string, { key: string; title: string }> = {
  sign: { key: 'sign', title: 'Confirm transaction' },
  login: { key: 'authorize', title: 'Authorize an app' },
  'login-request': { key: 'authorize', title: 'Authorize an app' },
  oauth2: { key: 'authorize', title: 'Authorize an app' },
  authorize: { key: 'authorize', title: 'Authorize an app' },
  revoke: { key: 'revoke', title: 'Revoke an app' },
  import: { key: 'import', title: 'Add an account' },
  accounts: { key: 'accounts', title: 'Accounts' },
  auths: { key: 'auths', title: 'Authorities' },
  profile: { key: 'profile', title: 'Profile' },
  settings: { key: 'settings', title: 'Settings' },
  'authorized-apps': { key: 'authorized_apps', title: 'Authorized apps' },
  signmessage: { key: 'signmessage', title: 'Sign a message' },
  verifymessage: { key: 'verifymessage', title: 'Verify a message' },
};

/** Looks a dictionary key up; the app passes i18next's `t`. */
export type Translate = (key: string) => string;

/** A path with one leading slash and no trailing one, `/` for the root. */
export function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

/** The full tab title: the site name is appended unless the title is the site's own. */
export function fullTitle(meta: PageMeta): string {
  return meta.title.startsWith(SITE) ? meta.title : `${meta.title} · ${SITE}`;
}

export function metaFor(pathname: string, translate?: Translate): PageMeta {
  const path = normalizePath(pathname);
  const pub = Object.hasOwn(PUBLIC_PAGES, path) ? PUBLIC_PAGES[path] : null;
  const segment = path.split('/').filter(Boolean)[0] ?? '';
  const screen = Object.hasOwn(PRIVATE_TITLES, segment)
    ? PRIVATE_TITLES[segment]
    : null;
  const meta: PageMeta = pub ?? {
    title: screen?.title ?? SITE,
    titleKey: screen ? `meta.${screen.key}` : undefined,
    description: DEFAULT_DESCRIPTION,
    indexable: false,
  };
  // The description is left in English: it is for crawlers and link previews,
  // which read the prerendered pages, and those are English.
  if (!meta.titleKey || !translate) return meta;
  return { ...meta, title: translate(meta.titleKey) };
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"]`,
  );
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href: string | null) {
  let el = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (!href) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/** The origin this build is served from, for canonical URLs. The define is
    absent under vitest, which has no build step; the page's own origin is
    the right answer there and a fine fallback anywhere. */
export function siteOrigin(): string {
  return typeof __SITE_URL__ === 'string' && __SITE_URL__
    ? __SITE_URL__
    : window.location.origin;
}

// The page the document was loaded on. Its prerendered HTML may list the same
// page in other languages (docs pages do); those links describe that page
// only, so they go once the app moves to another one.
const firstPath =
  typeof window === 'undefined' ? '' : normalizePath(window.location.pathname);

/** Write a page's title, description and canonical into the document. A
    null canonical marks a page that is not to be indexed. Idempotent. */
export function applyMeta(
  pathname: string,
  {
    title,
    description,
    canonical,
  }: { title: string; description: string; canonical: string | null },
): void {
  document.title = title;
  upsertMeta('name', 'description', description);
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('name', 'twitter:title', title);
  upsertMeta('name', 'twitter:description', description);
  if (normalizePath(pathname) !== firstPath) {
    for (const el of document.head.querySelectorAll(
      'link[rel="alternate"][hreflang]',
    ))
      el.remove();
  }
  if (canonical) {
    upsertCanonical(canonical);
    upsertMeta('property', 'og:url', canonical);
    document.head.querySelector('meta[name="robots"]')?.remove();
  } else {
    // No canonical and no share URL for a per-user page: the shell's or the
    // previous page's og:url would otherwise still be there, naming a page
    // this is not. And tell crawlers that run scripts to stay out; robots.txt
    // says the same to the ones that do not.
    upsertCanonical(null);
    document.head.querySelector('meta[property="og:url"]')?.remove();
    upsertMeta('name', 'robots', 'noindex, nofollow');
  }
}

/** Apply the metadata for a path to the document. Idempotent. */
export function applyPageMeta(
  pathname: string,
  siteUrl: string,
  translate?: Translate,
): PageMeta {
  const meta = metaFor(pathname, translate);
  applyMeta(pathname, {
    title: fullTitle(meta),
    description: meta.description,
    canonical: meta.indexable ? `${siteUrl}${normalizePath(pathname)}` : null,
  });
  return meta;
}
