import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import operations from '@/data/operations.json';
import { isLanguage } from '@/i18n/languages';
import { DOC_LANGUAGES, loadDocIndex, type RenderedDoc } from './content';
import { DOC_SECTIONS, DOC_SLUGS, type DocIndex, isDocSlug } from './pages';

// Every docs page in every language, rendered as the build renders them.
const { renderDoc } = await import('../../scripts/docs-markdown.mjs');

const DIR = join(process.cwd(), 'src', 'docs');
const folders = readdirSync(DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name);

type Page = RenderedDoc & { source: string };
const docs = new Map(
  folders.map((lang) => {
    const index: DocIndex = JSON.parse(
      readFileSync(join(DIR, lang, 'pages.json'), 'utf8'),
    );
    const pages = new Map<string, Page>();
    for (const slug of Object.keys(index.pages)) {
      const file = join(DIR, lang, `${slug}.md`);
      const source = readFileSync(file, 'utf8');
      pages.set(slug, { source, ...renderDoc(source, { lang, file }) });
    }
    return [lang, { index, pages }] as const;
  }),
);
const english = docs.get('en');
if (!english) throw new Error('src/docs/en is missing');

/** The page a language shows for a slug: its own, or the English one. */
const shown = (lang: string, slug: string) =>
  docs.get(lang)?.pages.get(slug) ?? english.pages.get(slug);

/** The prose of a page, without its code. */
const prose = (source: string) => source.replace(/```[\s\S]*?```/g, '');

describe('docs content', () => {
  it('knows every language that has docs, by the codes the app uses', () => {
    expect([...DOC_LANGUAGES].sort()).toEqual([...folders].sort());
    // Not a Crowdin locale such as de-DE: the app reads /docs/<code>/.
    for (const folder of folders) expect(isLanguage(folder), folder).toBe(true);
  });

  it('has nothing of its own for a language without docs', async () => {
    const missing = ['ja', 'de', 'fr'].find((l) => !folders.includes(l));
    expect(await loadDocIndex(missing ?? 'ja')).toEqual({
      sections: {},
      pages: {},
    });
  });

  it('has every page and section in English', () => {
    expect(Object.keys(english.index.pages).sort()).toEqual(
      [...DOC_SLUGS].sort(),
    );
    expect(Object.keys(english.index.sections).sort()).toEqual(
      DOC_SECTIONS.map((s) => s.key).sort(),
    );
  });

  it('has a file for each page a language lists, and no other', () => {
    for (const [lang, { index }] of docs) {
      const files = readdirSync(join(DIR, lang))
        .filter((f) => f.endsWith('.md'))
        .map((f) => f.slice(0, -3))
        .sort();
      expect(files, lang).toEqual(Object.keys(index.pages).sort());
      for (const slug of files) expect(isDocSlug(slug), slug).toBe(true);
    }
  });

  it('links only to pages and headings that exist', () => {
    const broken: string[] = [];
    for (const [lang, { pages }] of docs)
      for (const [slug, page] of pages)
        for (const href of page.links) {
          const where = `${lang}/${slug}: ${href}`;
          if (/^(https?:|mailto:)/.test(href)) continue;
          const own = /^#([a-z0-9-]+)$/.exec(href);
          const docsLink =
            /^\/docs(?:\/([a-z0-9-]+))?\/?(?:#([a-z0-9-]+))?$/.exec(href);
          if (own) {
            if (!page.headings.some((h) => h.id === own[1])) broken.push(where);
          } else if (docsLink) {
            const target = shown(lang, docsLink[1] ?? 'index');
            if (!target) broken.push(where);
            else if (
              docsLink[2] &&
              !target.headings.some((h) => h.id === docsLink[2])
            )
              broken.push(where);
          } else broken.push(`${where} (not a docs page or a full URL)`);
        }
    expect(broken).toEqual([]);
  });

  it('keeps the headings, code and links of the English page in a translation', () => {
    const drift: string[] = [];
    const code = (page: Page) =>
      (page.source.match(/```[\s\S]*?```/g) ?? []).join('\n');
    for (const [lang, { pages }] of docs) {
      if (lang === 'en') continue;
      for (const [slug, page] of pages) {
        const source = english.pages.get(slug);
        if (!source) continue;
        const where = `${lang}/${slug}`;
        if (
          page.headings.map((h) => `${h.level}${h.id}`).join() !==
          source.headings.map((h) => `${h.level}${h.id}`).join()
        )
          drift.push(`${where}: headings`);
        if (code(page) !== code(source)) drift.push(`${where}: code`);
        if ([...page.links].sort().join() !== [...source.links].sort().join())
          drift.push(`${where}: links`);
      }
    }
    expect(drift).toEqual([]);
  });

  it('writes English without dashes or a comma before "and"', () => {
    const problems: string[] = [];
    for (const [slug, page] of english.pages) {
      const text = prose(page.source);
      if (/[–—]/.test(text)) problems.push(`${slug}: dash`);
      for (const m of text.matchAll(/[^\n]{0,30}, and [^\n]{0,20}/g))
        problems.push(`${slug}: "${m[0]}"`);
    }
    for (const [slug, info] of Object.entries(english.index.pages))
      if (/[–—]|, and /.test(info.title + info.description))
        problems.push(`pages.json ${slug}`);
    expect(problems).toEqual([]);
  });

  it('lists every operation a sign link can carry, in the schema order', () => {
    const source = english.pages.get('sign-links')?.source ?? '';
    const section = source.slice(source.indexOf('{#supported-operations}'));
    const names = Object.keys(operations);
    const listed = [...section.matchAll(/`([a-z0-9_]+)`/g)]
      .map((m) => m[1])
      .filter((name) => names.includes(name));
    // Each one, in order, in the page's list.
    expect([...new Set(listed)]).toEqual(names);
  });
});
