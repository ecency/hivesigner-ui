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
  description: string;
  /** Indexable public page: gets a canonical; everything else is noindex. */
  indexable: boolean;
}

const SITE = 'Hivesigner';
const DEFAULT_DESCRIPTION =
  'Hivesigner keeps your Hive keys on your own device, shows you exactly what a transaction does before you sign it, and lets apps ask for only the permission they need.';

/** The five public pages, by EXACT path. `/apps/anything` is not a page. */
export const PUBLIC_PAGES: Record<string, PageMeta> = {
  '/': {
    title: `${SITE} - Sign in to Hive apps without sharing your keys`,
    description: DEFAULT_DESCRIPTION,
    indexable: true,
  },
  '/apps': {
    title: 'Apps that use Hivesigner',
    description:
      'Apps that broadcast to Hive through Hivesigner, ranked by how many people use them.',
    indexable: true,
  },
  '/developers': {
    title: 'Developers',
    description:
      'Add Hive sign-in to your app with OAuth2, and let people grant posting access without ever handing over a key.',
    indexable: true,
  },
  '/about': {
    title: 'About',
    description: DEFAULT_DESCRIPTION,
    indexable: true,
  },
  '/signs': {
    title: 'Signer',
    description:
      'Build a Hive transaction, review it in plain language and sign it with keys that never leave your device.',
    indexable: true,
  },
};

/** Titles for the per-user screens. Absent segments fall back to the site name. */
const PRIVATE_TITLES: Record<string, string> = {
  sign: 'Confirm transaction',
  login: 'Authorize an app',
  'login-request': 'Authorize an app',
  oauth2: 'Authorize an app',
  authorize: 'Authorize an app',
  revoke: 'Revoke an app',
  import: 'Add an account',
  accounts: 'Accounts',
  auths: 'Authorities',
  profile: 'Profile',
  settings: 'Settings',
  'authorized-apps': 'Authorized apps',
  signmessage: 'Sign a message',
  verifymessage: 'Verify a message',
};

/** A path with one leading slash and no trailing one, `/` for the root. */
export function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

/** The full tab title: the site name is appended unless the title is the site's own. */
export function fullTitle(meta: PageMeta): string {
  return meta.title.startsWith(SITE) ? meta.title : `${meta.title} · ${SITE}`;
}

export function metaFor(pathname: string): PageMeta {
  const path = normalizePath(pathname);
  const pub = PUBLIC_PAGES[path];
  if (pub) return pub;
  const segment = path.split('/').filter(Boolean)[0] ?? '';
  return {
    title: PRIVATE_TITLES[segment] ?? SITE,
    description: DEFAULT_DESCRIPTION,
    indexable: false,
  };
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

/** Apply the metadata for a path to the document. Idempotent. */
export function applyPageMeta(pathname: string, siteUrl: string): PageMeta {
  const meta = metaFor(pathname);
  const title = fullTitle(meta);
  document.title = title;
  upsertMeta('name', 'description', meta.description);
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', meta.description);
  upsertMeta('name', 'twitter:title', title);
  upsertMeta('name', 'twitter:description', meta.description);
  if (meta.indexable) {
    const canonical = `${siteUrl}${normalizePath(pathname)}`;
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
  return meta;
}
