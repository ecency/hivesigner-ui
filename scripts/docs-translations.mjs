// What a Crowdin download leaves behind, made into something the app can show.
//
// Crowdin exports approved translations and fills everything else with the
// English source, so a language comes back with a `pages.json` listing every
// page while only some of them were translated, with English Markdown under a
// translated name, and sometimes with a page listed that has no file at all.
// Shown as they are, those pages would look translated and the reader would
// never see the note that says the page is only in English. A listed page with
// no file is worse: the import throws.
//
// So after every download this keeps, for each language, only the pages that
// are really translated, and then writes DOC_LANGUAGES from the folders that
// still have one. The docs tests check the result: the registry against the
// folders, a file for every listed page, and each translation's headings, code
// and links against the English page.

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGUAGES } from '../src/i18n/languages.ts';

const CODES = LANGUAGES.map((l) => l.code);

const read = (file) => readFileSync(file, 'utf8');
const drop = (path) => rmSync(path, { recursive: true, force: true });

/**
 * Prune every translated docs folder under `root` and rewrite DOC_LANGUAGES.
 * Returns the languages that kept at least one page, in the app's own order.
 */
export function syncDocTranslations(root = process.cwd(), log = () => {}) {
  const docs = join(root, 'src', 'docs');
  const english = JSON.parse(read(join(docs, 'en', 'pages.json')));
  const slugs = Object.keys(english.pages ?? {});
  const source = new Map(
    slugs.map((slug) => [slug, read(join(docs, 'en', `${slug}.md`))]),
  );

  const kept = [];
  for (const entry of readdirSync(docs, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === 'en') continue;
    const lang = entry.name;
    const folder = join(docs, lang);

    // A folder the app has no language for would publish a URL nobody can
    // reach, and `readDocs` throws on it.
    if (!CODES.includes(lang)) {
      log(`${lang}: not a language the app ships, removed`);
      drop(folder);
      continue;
    }

    const indexFile = join(folder, 'pages.json');
    if (!existsSync(indexFile)) {
      log(`${lang}: no pages.json, removed`);
      drop(folder);
      continue;
    }

    const index = JSON.parse(read(indexFile));
    const pages = {};
    for (const [slug, title] of Object.entries(index.pages ?? {})) {
      const file = join(folder, `${slug}.md`);
      if (!source.has(slug)) {
        log(`${lang}/${slug}: not an English page any more, dropped`);
        drop(file);
        continue;
      }
      if (!existsSync(file)) {
        log(`${lang}/${slug}: listed with no file, dropped`);
        continue;
      }
      if (read(file) === source.get(slug)) {
        log(`${lang}/${slug}: still the English page, dropped`);
        drop(file);
        continue;
      }
      pages[slug] = title;
    }

    // A file the index does not list is a page the app never loads, and the
    // docs tests refuse the pair.
    for (const file of readdirSync(folder)) {
      if (file.endsWith('.md') && !Object.hasOwn(pages, file.slice(0, -3))) {
        log(`${lang}/${file}: not listed, removed`);
        drop(join(folder, file));
      }
    }

    if (Object.keys(pages).length === 0) {
      log(`${lang}: nothing translated yet, removed`);
      drop(folder);
      continue;
    }

    index.pages = pages;
    writeFileSync(indexFile, `${JSON.stringify(index, null, 2)}\n`);
    kept.push(lang);
  }

  kept.sort((a, b) => CODES.indexOf(a) - CODES.indexOf(b));
  writeRegistry(join(docs, 'content.ts'), kept);
  return kept;
}

/** DOC_LANGUAGES, rewritten from the folders that are left. */
function writeRegistry(file, kept) {
  const list = ['en', ...kept].map((code) => `'${code}'`).join(', ');
  const source = read(file);
  const next = source.replace(
    /export const DOC_LANGUAGES: readonly Language\[\] = \[[^\]]*\];/,
    `export const DOC_LANGUAGES: readonly Language[] = [${list}];`,
  );
  if (next === source && !source.includes(`= [${list}];`)) {
    throw new Error('DOC_LANGUAGES not found in src/docs/content.ts');
  }
  if (next === source) return;
  writeFileSync(file, next);
  // The line grows past what Biome keeps on one, and `lint:ci` runs before a
  // deploy. Formatting it here keeps the sync's own pull request green.
  try {
    execFileSync('pnpm', ['exec', 'biome', 'format', '--write', file], {
      stdio: 'ignore',
    });
  } catch {
    // Biome is a development dependency; without it the file is still valid.
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const kept = syncDocTranslations(process.cwd(), (line) => console.log(line));
  console.log(
    kept.length > 0
      ? `Docs translated into: ${kept.join(', ')}`
      : 'No translated docs yet.',
  );
}
