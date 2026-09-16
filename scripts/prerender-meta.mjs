// After `rsbuild build`: write one HTML file per PUBLIC page with that page's
// own title, description, canonical and share URL, and a fallback shell for
// every other path with no canonical and a noindex hint.
//
// Crawlers and link unfurlers read the HTML nginx returns and run nothing.
// With a single shell every route carried the HOMEPAGE canonical, so a crawler
// fetching /apps was told it was a copy of /, and the sitemap's five URLs
// consolidated into one. nginx's `try_files $uri $uri/index.html /app.html`
// resolves /apps to dist/apps/index.html, and anything else to app.html.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fullTitle, PUBLIC_PAGES } from '../src/lib/page-meta.ts';

const escapeAttr = (s) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** The shell with one page's metadata in place of the landing page's. */
export function rewriteShell(html, meta, url) {
  const title = escapeAttr(fullTitle(meta));
  const description = escapeAttr(meta.description);
  let out = html
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(
      /(<meta name="description" content=")[^"]*(")/,
      `$1${description}$2`,
    )
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(
      /(<meta property="og:description" content=")[^"]*(")/,
      `$1${description}$2`,
    )
    .replace(
      /(<meta name="twitter:description" content=")[^"]*(")/,
      `$1${description}$2`,
    );
  if (url) {
    out = out
      .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
      .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`);
  } else {
    out = out
      .replace(/\s*<link rel="canonical" href="[^"]*"\s*\/?>/, '')
      .replace(/\s*<meta property="og:url" content="[^"]*"\s*\/?>/, '')
      .replace(
        '</title>',
        '</title>\n    <meta name="robots" content="noindex, nofollow" />',
      );
  }
  return out;
}

const isMain =
  process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isMain) {
  const dist = process.argv[2] || 'dist';
  const siteUrl = (process.env.SITE_URL || 'https://hivesigner.com').replace(
    /\/+$/,
    '',
  );
  const shell = readFileSync(join(dist, 'index.html'), 'utf8');
  let written = 0;
  for (const [path, meta] of Object.entries(PUBLIC_PAGES)) {
    const url = `${siteUrl}${path}`;
    const file =
      path === '/'
        ? join(dist, 'index.html')
        : join(dist, path.slice(1), 'index.html');
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, rewriteShell(shell, meta, url));
    written += 1;
  }
  writeFileSync(
    join(dist, 'app.html'),
    rewriteShell(
      shell,
      {
        title: 'Hivesigner',
        description: PUBLIC_PAGES['/'].description,
        indexable: false,
      },
      null,
    ),
  );
  console.log(
    `[prerender-meta] ${written} public page(s) + app.html written for ${siteUrl}`,
  );
}
