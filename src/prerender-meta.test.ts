import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PUBLIC_PAGES } from './lib/page-meta';

// The build writes one HTML per public page and a canonical-free fallback.
// This runs the same rewrite over the real template.
const { rewriteShell } = await import('../scripts/prerender-meta.mjs');
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
});
