import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PUBLIC_PAGES } from './lib/page-meta';

// The build writes one HTML per public page and a canonical-free fallback.
// This runs the same rewrite over the real template.
const {
  rewriteShell,
  readDocs,
  docPageHtml,
  buildSitemap,
  docMarkdown,
  docsLlms,
} = await import('../scripts/prerender-meta.mjs');
const shell = readFileSync(
  join(process.cwd(), 'template.html'),
  'utf8',
).replaceAll('<%= siteUrl %>', 'https://hivesigner.com');

describe('prerender-meta', () => {
  it('gives each public page its own title, description, canonical and share URL', () => {
    const html = rewriteShell(
      shell,
      PUBLIC_PAGES['/apps'],
      'https://hivesigner.com/apps',
    );
    expect(html).toContain(
      '<title>Apps that use Hivesigner · Hivesigner</title>',
    );
    expect(html).toContain(
      '<link rel="canonical" href="https://hivesigner.com/apps"',
    );
    expect(html).toContain(
      '<meta property="og:url" content="https://hivesigner.com/apps"',
    );
    expect(html).toContain(
      '<meta property="og:title" content="Apps that use Hivesigner · Hivesigner"',
    );
    expect(html).toMatch(
      /<meta name="description" content="Apps that broadcast/,
    );
    // Nothing of the homepage's canonical remains.
    expect(html).not.toContain('href="https://hivesigner.com/"');
  });

  it('writes a fallback shell with no canonical, no share URL and a noindex hint', () => {
    const html = rewriteShell(
      shell,
      { title: 'Hivesigner', description: 'x', indexable: false },
      null,
    );
    expect(html).not.toContain('rel="canonical"');
    expect(html).not.toContain('property="og:url"');
    expect(html).toContain(
      '<meta name="robots" content="noindex, nofollow" />',
    );
    expect(html).toContain('<title>Hivesigner</title>');
  });

  it('escapes metadata into attributes', () => {
    const html = rewriteShell(
      shell,
      { title: 'A "quoted" <b>', description: 'x & y', indexable: true },
      'https://hivesigner.com/x',
    );
    expect(html).toContain(
      'content="A &quot;quoted&quot; &lt;b> · Hivesigner"',
    );
    expect(html).toContain('content="x &amp; y"');
  });

  it('writes values as they are, even ones a replacement string would read as patterns', () => {
    const html = rewriteShell(
      shell,
      { title: "a $' $& $$ b", description: '$` c', indexable: true },
      'https://hivesigner.com/$&',
    );
    expect(html).toContain("<title>a $' $&amp; $$ b · Hivesigner</title>");
    expect(html).toContain('<meta name="description" content="$` c"');
    expect(html).toContain(
      'href="https://hivesigner.com/$&amp;"'.replace('&amp;', '&'),
    );
    expect(html.match(/<\/html>/g)).toHaveLength(1);
    expect(html.match(/<title>/g)).toHaveLength(1);
  });
});

// Docs in two languages, German with one page: what the build writes for
// each, the sitemap and the Markdown copies.
describe('prerendered docs', () => {
  const dir = mkdtempSync(join(tmpdir(), 'docs-'));
  const page = (lang: string, name: string, text: string) =>
    writeFileSync(join(dir, lang, `${name}.md`), text);
  mkdirSync(join(dir, 'en'));
  mkdirSync(join(dir, 'de'));
  writeFileSync(
    join(dir, 'en', 'pages.json'),
    JSON.stringify({
      sections: { users: 'Using', developers: 'Building', more: 'More' },
      pages: {
        index: { title: 'Hivesigner docs', description: 'All of it.' },
        oauth2: { title: 'Sign in with OAuth2', description: 'Sign-in.' },
        tokens: { title: 'Tokens', description: 'Tokens.' },
      },
    }),
  );
  page('en', 'index', 'Start at [OAuth2](/docs/oauth2).');
  page(
    'en',
    'oauth2',
    '## Scopes {#scopes}\n\nSee [tokens](/docs/tokens#check).\n\n```text\nkeep {#this}\n```\n',
  );
  page('en', 'tokens', '## Check {#check}\n\nText.');
  writeFileSync(
    join(dir, 'de', 'pages.json'),
    JSON.stringify({
      sections: { developers: 'Entwickeln' },
      pages: {
        oauth2: {
          title: "Anmelden <img src=x onerror=alert(1)> $' mit OAuth2",
          description: 'Anmelden "hier".',
        },
      },
    }),
  );
  page(
    'de',
    'oauth2',
    '## Scopes {#scopes}\n\nSiehe [Tokens](/docs/tokens#check).',
  );
  const docs = readDocs(dir);
  const site = 'https://hivesigner.com';
  const [en, de] = docs;
  const all = (slug: string) =>
    docs
      .filter((d: { pages: { slug: string }[] }) =>
        d.pages.some((p) => p.slug === slug),
      )
      .map((d: { lang: string }) => d.lang);
  const html = (lang: 'en' | 'de', slug: string) => {
    const docsOf = lang === 'en' ? en : de;
    return docPageHtml(shell, {
      lang,
      index: {
        ...docsOf.index,
        pages: { ...en.index.pages, ...docsOf.index.pages },
      },
      page: docsOf.pages.find((p: { slug: string }) => p.slug === slug),
      languages: all(slug),
      siteUrl: site,
    });
  };

  it('reads each language with the pages it has', () => {
    expect(docs.map((d: { lang: string }) => d.lang)).toEqual(['en', 'de']);
    expect(de.pages.map((p: { slug: string }) => p.slug)).toEqual(['oauth2']);
  });

  it("writes a translated page in its language, with the others' addresses", () => {
    const out = html('de', 'oauth2');
    expect(out).toContain('<html lang="de" dir="ltr">');
    expect(out).toContain(
      '<link rel="canonical" href="https://hivesigner.com/docs/de/oauth2"',
    );
    expect(out).toContain(
      'hreflang="en" href="https://hivesigner.com/docs/oauth2"',
    );
    expect(out).toContain(
      'hreflang="de" href="https://hivesigner.com/docs/de/oauth2"',
    );
    expect(out).toContain(
      'hreflang="x-default" href="https://hivesigner.com/docs/oauth2"',
    );
    // The content, its links in German space, the nav with English titles
    // for the pages German lacks.
    expect(out).toContain('href="/docs/de/tokens#check"');
    expect(out).toContain('<li><a href="/docs/de/tokens">Tokens</a></li>');
    // A title from a translation is text, never markup, and never a pattern.
    expect(out).not.toContain('<img src=x');
    expect(out).toContain(
      "&lt;img src=x onerror=alert(1)&gt; $' mit OAuth2</h1>",
    );
    expect(out.match(/<\/html>/g)).toHaveLength(1);
  });

  it('lists only the English address of a page no other language has', () => {
    const out = html('en', 'tokens');
    expect(out).toContain('hreflang="en"');
    expect(out).not.toContain('hreflang="de"');
    expect(out).toContain('hreflang="x-default"');
  });

  it('puts every page in the sitemap, with its other languages', () => {
    const map = buildSitemap(site, docs);
    expect(map).toContain(
      '<url><loc>https://hivesigner.com/docs/de/oauth2</loc><xhtml:link rel="alternate" hreflang="en" href="https://hivesigner.com/docs/oauth2"/><xhtml:link rel="alternate" hreflang="de" href="https://hivesigner.com/docs/de/oauth2"/><xhtml:link rel="alternate" hreflang="x-default" href="https://hivesigner.com/docs/oauth2"/></url>',
    );
    expect(map).toContain(
      '<url><loc>https://hivesigner.com/docs/tokens</loc></url>',
    );
    expect(map).toContain('<url><loc>https://hivesigner.com/apps</loc></url>');
  });

  it('makes the Markdown copies readable on their own, in their language', () => {
    const [oauth2] = en.pages.filter(
      (p: { slug: string }) => p.slug === 'oauth2',
    );
    const md = docMarkdown('Sign in with OAuth2', oauth2.source, site);
    expect(md).toMatch(/^# Sign in with OAuth2\n\n## Scopes\n/);
    expect(md).toContain('(https://hivesigner.com/docs/tokens#check)');
    // A heading id goes; the same text inside code stays.
    expect(md).toContain('keep {#this}');
    const german = docMarkdown('Anmelden', de.pages[0].source, site, 'de');
    expect(german).toContain('(https://hivesigner.com/docs/de/tokens#check)');
  });

  it('lists the English pages in llms.txt, as Markdown', () => {
    const real = readDocs(join(process.cwd(), 'src', 'docs'))[0];
    const llms = docsLlms(site, real.index);
    expect(llms).toMatch(/^# Hivesigner docs\n\n> /);
    expect(llms).toContain(
      '- [Sign in with OAuth2](https://hivesigner.com/docs/oauth2.md): ',
    );
    expect(llms).toContain('(https://hivesigner.com/docs/index.md)');
  });

  it('refuses a folder that is not one of the languages the app ships', () => {
    const bad = mkdtempSync(join(tmpdir(), 'docs-'));
    mkdirSync(join(bad, 'de-DE'));
    writeFileSync(join(bad, 'de-DE', 'pages.json'), '{"pages":{}}');
    expect(() => readDocs(bad)).toThrow(/de-DE: not a language/);
    rmSync(bad, { recursive: true });
  });
});
