import { describe, expect, it } from 'vitest';
import { docHref, localizeDocLinks } from './pages';
import { parseDocPath } from './path';

describe('docs paths', () => {
  it('reads English at /docs and every other language under its code', () => {
    expect(parseDocPath('/docs')).toEqual({ lang: 'en', slug: 'index' });
    expect(parseDocPath('/docs/')).toEqual({ lang: 'en', slug: 'index' });
    expect(parseDocPath('/docs/oauth2')).toEqual({
      lang: 'en',
      slug: 'oauth2',
    });
    expect(parseDocPath('/docs/de')).toEqual({ lang: 'de', slug: 'index' });
    expect(parseDocPath('/docs/zh-tw/oauth2')).toEqual({
      lang: 'zh-TW',
      slug: 'oauth2',
    });
    // Indonesian's code is also a plausible page name; it is the language.
    expect(parseDocPath('/docs/id/faq')).toEqual({ lang: 'id', slug: 'faq' });
  });

  it('names no page for anything else', () => {
    for (const path of [
      '/',
      '/documents',
      '/docs/nope',
      '/docs/en/oauth2',
      '/docs/zh-TW/oauth2',
      '/docs/de/nope',
      '/docs/de/oauth2/x',
      '/docs/oauth2/x',
      '/docs/index',
      '/docs/de/index',
      '/docs/h/guides/get-started',
    ])
      expect(parseDocPath(path), path).toBeNull();
  });

  it('builds the paths it reads', () => {
    for (const [slug, lang] of [
      ['index', 'en'],
      ['oauth2', 'en'],
      ['index', 'zh-CN'],
      ['faq', 'pt'],
    ] as const)
      expect(parseDocPath(docHref(slug, lang))).toEqual({ lang, slug });
  });

  it('moves the links of an English page shown in another language to that language', () => {
    const html =
      '<a href="/docs">h</a><a href="/docs/oauth2#scopes">o</a><a href="/docs/tokens">t</a><a href="/authorized-apps">a</a><a href="https://x.example/docs/y">x</a><code>href=&quot;/docs&quot;</code>';
    expect(localizeDocLinks(html, 'zh-CN')).toBe(
      '<a href="/docs/zh-cn">h</a><a href="/docs/zh-cn/oauth2#scopes">o</a><a href="/docs/zh-cn/tokens">t</a><a href="/authorized-apps">a</a><a href="https://x.example/docs/y">x</a><code>href=&quot;/docs&quot;</code>',
    );
    expect(localizeDocLinks(html, 'en')).toBe(html);
    // Only page names are moved: a language's own home is not one.
    expect(localizeDocLinks('<a href="/docs/de">x</a>', 'de')).toBe(
      '<a href="/docs/de">x</a>',
    );
  });
});
