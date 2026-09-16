import { beforeEach, describe, expect, it } from 'vitest';
import { applyPageMeta, metaFor } from './page-meta';

beforeEach(() => {
  document.head.innerHTML = '';
  document.title = '';
});

describe('metaFor', () => {
  it('marks the five public pages indexable and everything else not', () => {
    for (const p of ['/', '/apps', '/developers', '/about', '/signs']) {
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
    applyPageMeta('/developers', 'https://hivesigner.com');
    expect(document.querySelectorAll('meta[name="description"]')).toHaveLength(
      1,
    );
    expect(document.querySelectorAll('meta[property="og:title"]')).toHaveLength(
      1,
    );
    expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe('https://hivesigner.com/developers');
    expect(document.querySelector('meta[name="robots"]')).toBeNull();
  });
});
