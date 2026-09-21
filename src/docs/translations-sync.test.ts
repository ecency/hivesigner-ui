import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { syncDocTranslations } from '../../scripts/docs-translations.mjs';

// What the sync keeps after a Crowdin download. Crowdin fills an unapproved
// string with the English source, so a language arrives listing pages it has
// not translated, and the app would show those as a translation instead of the
// English page with its note.

const ENGLISH_A = '# A\n\nThe English page.\n';
const ENGLISH_B = '# B\n\nAnother English page.\n';

function repo(): string {
  const root = mkdtempSync(join(tmpdir(), 'docs-sync-'));
  const en = join(root, 'src', 'docs', 'en');
  mkdirSync(en, { recursive: true });
  writeFileSync(
    join(en, 'pages.json'),
    JSON.stringify({ sections: {}, pages: { a: 'A', b: 'B' } }),
  );
  writeFileSync(join(en, 'a.md'), ENGLISH_A);
  writeFileSync(join(en, 'b.md'), ENGLISH_B);
  writeFileSync(
    join(root, 'src', 'docs', 'content.ts'),
    "export const DOC_LANGUAGES: readonly Language[] = ['en'];\n",
  );
  return root;
}

function language(
  root: string,
  lang: string,
  pages: Record<string, string>,
  files: Record<string, string>,
) {
  const dir = join(root, 'src', 'docs', lang);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'pages.json'),
    JSON.stringify({ sections: {}, pages }),
  );
  for (const [name, body] of Object.entries(files))
    writeFileSync(join(dir, `${name}.md`), body);
}

const docs = (root: string, ...rest: string[]) =>
  join(root, 'src', 'docs', ...rest);

describe('the docs translation sync', () => {
  it('keeps the pages a language really translated', () => {
    const root = repo();
    language(
      root,
      'de',
      { a: 'A auf Deutsch', b: 'B' },
      { a: '# A\n\nDie deutsche Seite.\n', b: ENGLISH_B },
    );
    expect(syncDocTranslations(root)).toEqual(['de']);
    const index = JSON.parse(
      readFileSync(docs(root, 'de', 'pages.json'), 'utf8'),
    );
    expect(index.pages).toEqual({ a: 'A auf Deutsch' });
    // The English copy under a German name would read as a translation.
    expect(existsSync(docs(root, 'de', 'b.md'))).toBe(false);
    expect(existsSync(docs(root, 'de', 'a.md'))).toBe(true);
  });

  it('drops a page listed with no file, which would throw on import', () => {
    const root = repo();
    language(root, 'fr', { a: 'A', b: 'B' }, { a: '# A\n\nLa page.\n' });
    expect(syncDocTranslations(root)).toEqual(['fr']);
    const index = JSON.parse(
      readFileSync(docs(root, 'fr', 'pages.json'), 'utf8'),
    );
    expect(Object.keys(index.pages)).toEqual(['a']);
  });

  it('removes a language that translated nothing', () => {
    const root = repo();
    language(root, 'es', { a: 'A', b: 'B' }, { a: ENGLISH_A, b: ENGLISH_B });
    expect(syncDocTranslations(root)).toEqual([]);
    expect(existsSync(docs(root, 'es'))).toBe(false);
  });

  it('removes a folder the app has no language for', () => {
    const root = repo();
    language(root, 'xx', { a: 'A' }, { a: '# A\n\nAnywhere.\n' });
    expect(syncDocTranslations(root)).toEqual([]);
    expect(existsSync(docs(root, 'xx'))).toBe(false);
  });

  it('removes a file the index does not list', () => {
    const root = repo();
    language(
      root,
      'ru',
      { a: 'A по-русски' },
      { a: '# A\n\nСтраница.\n', b: '# B\n\nЛишняя.\n' },
    );
    expect(syncDocTranslations(root)).toEqual(['ru']);
    expect(existsSync(docs(root, 'ru', 'b.md'))).toBe(false);
  });

  it('writes the registry in the order the app lists its languages', () => {
    const root = repo();
    language(root, 'ru', { a: 'A' }, { a: '# A\n\nСтраница.\n' });
    language(root, 'de', { a: 'A' }, { a: '# A\n\nSeite.\n' });
    expect(syncDocTranslations(root)).toEqual(['de', 'ru']);
    expect(readFileSync(docs(root, 'content.ts'), 'utf8')).toContain(
      "DOC_LANGUAGES: readonly Language[] = ['en', 'de', 'ru'];",
    );
  });
});
