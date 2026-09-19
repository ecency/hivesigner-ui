// After `rsbuild build`: write one HTML file per PUBLIC page with that page's
// own title, description, canonical and share URL, and a fallback shell for
// every other path with no canonical and a noindex hint. Docs pages also carry
// their content, their other languages and a Markdown copy, and the sitemap
// is written from the same tables.
//
// Crawlers and link unfurlers read the HTML nginx returns and run nothing.
// With a single shell every route carried the HOMEPAGE canonical, so a crawler
// fetching /apps was told it was a copy of /, and the sitemap's five URLs
// consolidated into one. nginx's `try_files $uri $uri/index.html /app.html`
// resolves /apps to dist/apps/index.html, and anything else to app.html.
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import {
  DOC_SECTIONS,
  DOC_SLUGS,
  docHref,
  localizeDocLinks,
} from '../src/docs/pages.ts';
import { LANGUAGES } from '../src/i18n/languages.ts';
import { fullTitle, PUBLIC_PAGES } from '../src/lib/page-meta.ts';
import { renderDoc } from './docs-markdown.mjs';

const escapeAttr = (s) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// Every value goes in through a replacer FUNCTION: in a replacement string
// `$'`, `$&` and `$$` are patterns, so a title or a page that contains one
// (translations included) would splice pieces of the document into itself.
const setAttr = (html, pattern, value) =>
  html.replace(pattern, (_all, before, after) => `${before}${value}${after}`);

/** The shell with one page's metadata in place of the landing page's. */
export function rewriteShell(html, meta, url) {
  const title = escapeAttr(fullTitle(meta));
  const description = escapeAttr(meta.description);
  let out = html.replace(
    /<title>[^<]*<\/title>/,
    () => `<title>${title}</title>`,
  );
  out = setAttr(
    out,
    /(<meta name="description" content=")[^"]*(")/,
    description,
  );
  out = setAttr(out, /(<meta property="og:title" content=")[^"]*(")/, title);
  out = setAttr(out, /(<meta name="twitter:title" content=")[^"]*(")/, title);
  out = setAttr(
    out,
    /(<meta property="og:description" content=")[^"]*(")/,
    description,
  );
  out = setAttr(
    out,
    /(<meta name="twitter:description" content=")[^"]*(")/,
    description,
  );
  if (url) {
    out = setAttr(out, /(<link rel="canonical" href=")[^"]*(")/, url);
    out = setAttr(out, /(<meta property="og:url" content=")[^"]*(")/, url);
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

const escapeText = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The `lang` a language's pages declare, and whether it runs right to left. */
function langInfo(code) {
  const info = LANGUAGES.find((l) => l.code === code);
  if (!info) throw new Error(`src/docs/${code}: not a language the app ships`);
  return { tag: info.htmlLang ?? info.code, rtl: !!info.rtl };
}

/**
 * Every docs page there is, by language: English has them all, another
 * language the pages its pages.json lists. `docsDir` is src/docs.
 */
export function readDocs(docsDir) {
  const languages = readdirSync(docsDir, { withFileTypes: true })
    .filter(
      (e) => e.isDirectory() && existsSync(join(docsDir, e.name, 'pages.json')),
    )
    .map((e) => e.name)
    .sort((a, b) => (a === 'en' ? -1 : b === 'en' ? 1 : a.localeCompare(b)));
  // A folder named any other way (a Crowdin locale such as de-DE) would be
  // published under an address the app does not read.
  for (const lang of languages) langInfo(lang);
  return languages.map((lang) => {
    const index = JSON.parse(
      readFileSync(join(docsDir, lang, 'pages.json'), 'utf8'),
    );
    const pages = DOC_SLUGS.filter((slug) =>
      Object.hasOwn(index.pages, slug),
    ).map((slug) => {
      const file = join(docsDir, lang, `${slug}.md`);
      const source = readFileSync(file, 'utf8');
      return { slug, source, ...renderDoc(source, { lang, file }) };
    });
    return { lang, index, pages };
  });
}

/** Which languages have each page, for the hreflang links. */
function translationsOf(docs) {
  const map = new Map();
  for (const { lang, pages } of docs)
    for (const { slug } of pages)
      map.set(slug, [...(map.get(slug) ?? []), lang]);
  return map;
}

/**
 * A docs page's HTML: the shell with the page's metadata, its language, the
 * same page in the other languages, and its content for readers that run no
 * scripts (the app replaces it; see [data-prerendered] in globals.css).
 *
 * `fallback`: the English page under another language's address, for a page
 * that language has not translated. Links stay in that language; it is not
 * indexed there and names no other addresses.
 */
export function docPageHtml(
  shell,
  { lang, index, page, languages, siteUrl, fallback = false },
) {
  // The language's own titles, English for the pages it has not translated.
  const titles = index.pages;
  const info = fallback ? page.info : titles[page.slug];
  const url = fallback ? null : `${siteUrl}${docHref(page.slug, lang)}`;
  const { tag, rtl } = langInfo(fallback ? 'en' : lang);
  const alternates = fallback
    ? []
    : [
        ...languages.map(
          (l) =>
            `<link rel="alternate" hreflang="${langInfo(l).tag}" href="${siteUrl}${docHref(page.slug, l)}" />`,
        ),
        `<link rel="alternate" hreflang="x-default" href="${siteUrl}${docHref(page.slug)}" />`,
      ];
  const nav = DOC_SECTIONS.flatMap((section) => section.pages)
    .filter((slug) => Object.hasOwn(titles, slug))
    .map(
      (slug) =>
        `<li><a href="${docHref(slug, lang)}">${escapeText(titles[slug].title)}</a></li>`,
    )
    .join('');
  const body = `<div data-prerendered class="mx-auto w-full max-w-5xl px-4 sm:px-6"><article lang="${tag}" dir="${rtl ? 'rtl' : 'ltr'}"><h1>${escapeText(info.title)}</h1><div class="docs-prose">${fallback ? localizeDocLinks(page.html, lang) : page.html}</div></article><nav><ul><li><a href="${docHref('index', lang)}">${escapeText(titles.index.title)}</a></li>${nav}</ul></nav></div>`;
  return rewriteShell(
    shell,
    { title: info.title, description: info.description, indexable: !fallback },
    url,
  )
    .replace(
      /<html lang="[^"]*">/,
      () => `<html lang="${tag}" dir="${rtl ? 'rtl' : 'ltr'}">`,
    )
    .replace('</head>', () =>
      alternates.length
        ? `    ${alternates.join('\n    ')}\n  </head>`
        : '</head>',
    )
    .replace('<div id="root"></div>', () => `<div id="root">${body}</div>`);
}

/** The sitemap: the public app pages, then every docs page in every language
    it has, each listing the others. */
export function buildSitemap(siteUrl, docs) {
  const translations = translationsOf(docs);
  const entry = (path, alternates = []) =>
    `  <url><loc>${siteUrl}${path}</loc>${alternates.join('')}</url>`;
  const urls = Object.keys(PUBLIC_PAGES).map((path) => entry(path));
  for (const { lang, pages } of docs)
    for (const { slug } of pages) {
      const langs = translations.get(slug);
      urls.push(
        entry(
          docHref(slug, lang),
          langs.length > 1
            ? [
                ...langs.map(
                  (l) =>
                    `<xhtml:link rel="alternate" hreflang="${langInfo(l).tag}" href="${siteUrl}${docHref(slug, l)}"/>`,
                ),
                `<xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}${docHref(slug)}"/>`,
              ]
            : [],
        ),
      );
    }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
}

/** A page as Markdown for tools that read docs (llms.txt links to these):
    its title on top, the heading ids left out and every link absolute, as
    the file is read on its own. Links to other docs pages stay in `lang`. */
export function docMarkdown(title, source, siteUrl, lang = 'en') {
  const body = source
    .replace(/^(#{2,3} .*?)[ \t]*\{#[a-z0-9-]+\}[ \t]*$/gm, '$1')
    .replace(
      /\]\(\/docs(?:\/([a-z0-9-]+))?\/?(#[a-z0-9-]+)?\)/g,
      (_all, slug, hash) =>
        `](${siteUrl}${docHref(slug ?? 'index', lang)}${hash ?? ''})`,
    )
    .replace(/\]\(\//g, () => `](${siteUrl}/`);
  return `# ${title}\n\n${body}`;
}

/** /docs/llms.txt: the English pages, by section, as Markdown links. */
export function docsLlms(siteUrl, index) {
  const line = (slug) =>
    `- [${index.pages[slug].title}](${siteUrl}${slug === 'index' ? '/docs/index' : docHref(slug)}.md): ${index.pages[slug].description}`;
  return [
    `# ${index.pages.index.title}`,
    '',
    `> ${index.pages.index.description}`,
    '',
    line('index'),
    ...DOC_SECTIONS.flatMap((section) => [
      '',
      `## ${index.sections[section.key]}`,
      '',
      ...section.pages.map(line),
    ]),
    '',
  ].join('\n');
}

/**
 * Every docs page's HTML, and the Markdown copy of each page a language has,
 * under `dist`. A language's untranslated pages get the English page under
 * its address. Returns how many pages have their own HTML.
 */
export function writeDocPages(dist, docs, shell, siteUrl) {
  let count = 0;
  const translations = translationsOf(docs);
  const english = docs.find((d) => d.lang === 'en');
  for (const { lang, index, pages } of docs) {
    for (const page of pages) {
      const path = docHref(page.slug, lang);
      const file = join(dist, path.slice(1), 'index.html');
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(
        file,
        docPageHtml(shell, {
          lang,
          index: {
            ...index,
            pages: { ...english.index.pages, ...index.pages },
          },
          page,
          languages: translations.get(page.slug),
          siteUrl,
        }),
      );
      const copy = join(
        dist,
        `${page.slug === 'index' ? `${path}/index` : path}.md`.slice(1),
      );
      writeFileSync(
        copy,
        docMarkdown(index.pages[page.slug].title, page.source, siteUrl, lang),
      );
      count += 1;
    }
    if (lang === 'en') continue;
    // The pages this language has not translated: the English page under its
    // address, as the app shows it, so every link in its pages has content.
    for (const page of english.pages) {
      if (pages.some((p) => p.slug === page.slug)) continue;
      const file = join(dist, docHref(page.slug, lang).slice(1), 'index.html');
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(
        file,
        docPageHtml(shell, {
          lang,
          index: {
            ...index,
            pages: { ...english.index.pages, ...index.pages },
          },
          page: { ...page, info: english.index.pages[page.slug] },
          languages: [],
          siteUrl,
          fallback: true,
        }),
      );
    }
  }
  return count;
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

  const docs = readDocs(join(dirname(import.meta.dirname), 'src', 'docs'));
  written += writeDocPages(dist, docs, shell, siteUrl);
  const english = docs.find((d) => d.lang === 'en');
  writeFileSync(
    join(dist, 'docs', 'llms.txt'),
    docsLlms(siteUrl, english.index),
  );
  writeFileSync(join(dist, 'sitemap.xml'), buildSitemap(siteUrl, docs));

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
    `[prerender-meta] ${written} page(s), their Markdown copies, the sitemap and app.html written for ${siteUrl}`,
  );
}
