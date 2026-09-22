// Put the English code blocks back into a translation.
//
// The docs test compares a translation's fenced blocks with the English
// page byte for byte, and the developer pages carry 56 of them. Retyping
// those by hand across 24 languages is 1,344 chances to mistype a field
// name. So a translation is written with @@1@@, @@2@@ ... alone on a line
// where each block goes, in the order the English page has them, and this
// fills them in from the source:
//
//   node scripts/docs-fences.mjs <lang> [slug]
//
// Without a slug it does every page of that language that still has a
// marker. It refuses to write a page that leaves a block unused, so a
// dropped code sample is caught here rather than by the test.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FENCE = /^```[^\n]*\n[\s\S]*?^```$/gm;
const MARKER = /^@@(\d+)@@$/gm;
const docs = join(process.cwd(), 'src', 'docs');

/** The fenced blocks of a page, in order, as they are written. */
export const fences = (text) => text.match(FENCE) ?? [];

/** Fill a translation's markers from the English page. Returns how many. */
export function spliceFences(lang, slug) {
  const source = fences(readFileSync(join(docs, 'en', `${slug}.md`), 'utf8'));
  const path = join(docs, lang, `${slug}.md`);
  const used = new Set();
  const filled = readFileSync(path, 'utf8').replace(MARKER, (_, n) => {
    const i = Number(n);
    if (i < 1 || i > source.length) {
      throw new Error(
        `${lang}/${slug}: @@${i}@@, but the English page has ${source.length} block(s)`,
      );
    }
    used.add(i);
    return source[i - 1];
  });
  const missing = source.map((_, i) => i + 1).filter((i) => !used.has(i));
  if (missing.length > 0) {
    throw new Error(
      `${lang}/${slug}: these blocks are in the English page and nowhere here: ${missing.join(', ')}`,
    );
  }
  writeFileSync(path, filled);
  return source.length;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [lang, slug] = process.argv.slice(2);
  if (!lang) throw new Error('usage: docs-fences.mjs <lang> [slug]');
  const slugs = slug
    ? [slug]
    : readdirSync(join(docs, lang))
        .filter(
          (f) =>
            f.endsWith('.md') &&
            /^@@\d+@@$/m.test(readFileSync(join(docs, lang, f), 'utf8')),
        )
        .map((f) => f.slice(0, -3));
  for (const each of slugs) {
    console.log(`${lang}/${each}: ${spliceFences(lang, each)} block(s)`);
  }
  if (slugs.length === 0) console.log(`${lang}: no page is waiting for blocks`);
}
