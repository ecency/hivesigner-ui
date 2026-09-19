import { beforeEach, describe, expect, it } from 'vitest';
import en from '@/i18n/locales/en-US.json';
import { applyMeta, applyPageMeta, metaFor, PUBLIC_PAGES } from './page-meta';

beforeEach(() => {
  document.head.innerHTML = '';
  document.title = '';
});

describe('metaFor', () => {
  it('marks the public app pages indexable and everything else not', () => {
    for (const p of ['/', '/apps', '/about', '/signs']) {
      expect(metaFor(p).indexable, p).toBe(true);
    }
    for (const p of [
      '/sign/vote?author=a',
      '/login',
      '/login-request/ecency.app',
      '/oauth2/authorize',
      '/authorize/ecency.app',
      '/revoke/ecency.app',
      '/import',
      '/accounts',
      '/auths',
      '/profile',
      '/settings',
      '/authorized-apps',
      '/signmessage',
      '/verifymessage',
      '/something-unknown',
      // Below a public page is not a page: nginx serves the shell for it, and
      // it must not come back indexable with a canonical of its own.
      '/apps/spam',
      '/about/extra',
      '/signs/extra',
      '/developers/x/y',
    ]) {
      expect(metaFor(p).indexable, p).toBe(false);
    }
    // A trailing slash is the same page.
    expect(metaFor('/apps/').indexable).toBe(true);
  });

  it('gives each screen a title of its own', () => {
    expect(metaFor('/sign/vote').title).toBe('Confirm transaction');
    expect(metaFor('/apps').title).toMatch(/apps/i);
    expect(metaFor('/').title).toMatch(/^Hivesigner/);
  });
});

describe('applyPageMeta', () => {
  it('sets the title, description, canonical and share tags for a public page', () => {
    applyPageMeta('/apps', 'https://hivesigner.com');
    expect(document.title).toBe('Apps that use Hivesigner · Hivesigner');
    expect(
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute('content'),
    ).toMatch(/ranked/);
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe('https://hivesigner.com/apps');
    expect(
      document
        .querySelector('meta[property="og:url"]')
        ?.getAttribute('content'),
    ).toBe('https://hivesigner.com/apps');
    expect(
      document
        .querySelector('meta[property="og:title"]')
        ?.getAttribute('content'),
    ).toBe('Apps that use Hivesigner · Hivesigner');
    expect(document.querySelector('meta[name="robots"]')).toBeNull();
  });

  it('marks a per-user page noindex with no canonical, and does not double the site name', () => {
    applyPageMeta('/', 'https://hivesigner.com');
    expect(document.title).toBe(
      'Hivesigner - Sign in to Hive apps without sharing your keys',
    );
    applyPageMeta(
      '/sign/transfer?to=alice&amount=1%20HIVE',
      'https://hivesigner.com',
    );
    expect(document.title).toBe('Confirm transaction · Hivesigner');
    expect(
      document.querySelector('meta[name="robots"]')?.getAttribute('content'),
    ).toBe('noindex, nofollow');
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  });

  it('updates in place on navigation instead of piling up tags', () => {
    applyPageMeta('/apps', 'https://hivesigner.com');
    applyPageMeta('/about', 'https://hivesigner.com');
    applyPageMeta('/settings', 'https://hivesigner.com');
    applyPageMeta('/signs', 'https://hivesigner.com');
    expect(document.querySelectorAll('meta[name="description"]')).toHaveLength(
      1,
    );
    expect(document.querySelectorAll('meta[property="og:title"]')).toHaveLength(
      1,
    );
    expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe('https://hivesigner.com/signs');
    expect(document.querySelector('meta[name="robots"]')).toBeNull();
  });
});

describe('titles in the reader language', () => {
  const english = (key: string) => {
    let node: unknown = en;
    for (const part of key.split('.'))
      node = (node as Record<string, unknown>)[part];
    return node as string;
  };

  it('keeps the English titles, which the prerendered pages use, equal to the dictionary', () => {
    const paths = [
      '/',
      '/apps',
      '/about',
      '/signs',
      '/sign/vote',
      '/login',
      '/login-request/x',
      '/oauth2/authorize',
      '/authorize/x',
      '/revoke/x',
      '/import',
      '/accounts',
      '/auths',
      '/profile',
      '/settings',
      '/authorized-apps',
      '/signmessage',
      '/verifymessage',
    ];
    for (const path of paths) {
      const meta = metaFor(path);
      expect(meta.titleKey, path).toMatch(/^meta\./);
      expect(meta.title, path).toBe(english(meta.titleKey ?? ''));
    }
    expect(PUBLIC_PAGES['/'].title.startsWith('Hivesigner')).toBe(true);
  });

  it('translates the tab title and nothing a crawler reads', () => {
    const translate = (key: string) => `«${key}»`;
    const meta = applyPageMeta('/apps', 'https://hivesigner.com', translate);
    expect(document.title).toBe('«meta.apps» · Hivesigner');
    expect(meta.description).toBe(PUBLIC_PAGES['/apps'].description);
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe('https://hivesigner.com/apps');
    applyPageMeta('/sign/transfer', 'https://hivesigner.com', translate);
    expect(document.title).toBe('«meta.sign» · Hivesigner');
  });

  it('names an unknown screen by the site, never by an inherited property', () => {
    const translate = (key: string) => `«${key}»`;
    for (const path of [
      '/nowhere',
      '/constructor',
      '/toString',
      '/__proto__',
    ]) {
      const meta = metaFor(path, translate);
      expect(meta.title, path).toBe('Hivesigner');
      expect(meta.titleKey, path).toBeUndefined();
    }
  });
});

describe('language alternates', () => {
  it("keeps the prerendered page's other languages on that page only", () => {
    // The document was loaded on / (jsdom's address), with alternates.
    document.head.innerHTML =
      '<link rel="alternate" hreflang="en" href="https://hivesigner.com/docs"><link rel="alternate" hreflang="x-default" href="https://hivesigner.com/docs">';
    const meta = { title: 'T', description: 'D', canonical: null };
    applyMeta('/', meta);
    expect(document.querySelectorAll('link[hreflang]')).toHaveLength(2);
    applyMeta('/docs/tokens', meta);
    expect(document.querySelectorAll('link[hreflang]')).toHaveLength(0);
  });
});
