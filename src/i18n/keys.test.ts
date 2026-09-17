import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OPERATIONS } from '@/lib/operations';
import { LANGUAGES } from './languages';
import en from './locales/en-US.json';

/**
 * Every t('...') and <Trans i18nKey="..."> in the source must resolve.
 *
 * A key that does not exist renders as the LITERAL KEY on the page. That is
 * what `revoke.revoke_explain_no_account` did: the string was added to the
 * `authorize` block by mistake while the component read it from `revoke`, and
 * the logged-out revoke screen shipped showing "revoke.revoke_explain_no_account"
 * to the user. Nothing caught it - not the typecheck, not the tests, not the
 * build - because a missing key is a runtime fallback, not an error.
 */

const SRC = resolve(process.cwd(), 'src');

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      if (entry === 'locales') continue;
      out.push(...sourceFiles(p));
    } else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
      out.push(p);
    }
  }
  return out;
}

function lookup(key: string): unknown {
  let node: unknown = en;
  for (const part of key.split('.')) {
    if (!node || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

/** i18next resolves a `count` lookup through _one/_other suffixes. */
function resolves(key: string): boolean {
  if (typeof lookup(key) === 'string') return true;
  return ['_one', '_other', '_zero', '_few', '_many'].some(
    (suffix) => typeof lookup(key + suffix) === 'string',
  );
}

const files = sourceFiles(SRC);

// Any dotted literal whose FIRST segment is a top-level dictionary block.
//
// Not `t\(\s*'...'`: the first version of this guard anchored to the call and
// so never looked inside
//
//   t(mode === 'grant' ? 'authorize.x' : 'revoke.y', ...)
//
// which is exactly where the bug it exists to catch was living. Matching the
// shape of a key rather than the shape of the call finds them wherever they sit
// - in a ternary, a lookup table, or a variable.
const BLOCKS = new Set(Object.keys(en));
const DOTTED = /['"]([a-z0-9_]+(?:\.[a-z0-9_]+)+)['"]/gi;

describe('translation keys', () => {
  it('found call sites to check', () => {
    expect(files.length).toBeGreaterThan(20);
  });

  // An account's @ belongs to the value, which runs in its own direction; an
  // @ in the dictionary lands on the wrong side on a right-to-left page.
  it('no English string puts an @ before a placeholder', () => {
    const glued = leaves(en as Tree).filter(([, text]) => /@\{/.test(text));
    expect(glued.map(([key]) => key)).toEqual([]);
  });

  it('every translation key used in the source exists in en-US', () => {
    const missing: string[] = [];
    let checked = 0;
    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      for (const m of src.matchAll(DOTTED)) {
        const key = m[1];
        if (!BLOCKS.has(key.split('.')[0])) continue;
        checked++;
        if (!resolves(key)) {
          missing.push(`${file.replace(`${SRC}/`, '')}: ${key}`);
        }
      }
    }
    // A regex that matched nothing would pass this test vacuously forever.
    expect(checked).toBeGreaterThan(40);
    expect(missing, `missing keys:\n${missing.join('\n')}`).toEqual([]);
  });

  // The keys built from a variable, listed by hand because a regex cannot
  // follow them.
  it('the computed keys exist', () => {
    for (const key of COMPUTED) {
      expect(resolves(key), key).toBe(true);
    }
  });

  // A string nothing shows is a string translators still translate, in every
  // language, for as long as it stays. The Nuxt app left 126 of them.
  it('every string in en-US is used', () => {
    const used = new Set(COMPUTED);
    for (const file of files) {
      for (const m of readFileSync(file, 'utf8').matchAll(DOTTED)) {
        used.add(m[1]);
      }
    }
    const unused = leaves(en).filter(
      ([key]) => !used.has(key) && !used.has(key.replace(PLURAL, '')),
    );
    expect(unused.map(([key]) => key)).toEqual([]);
  });
});

const PLURAL = /_(zero|one|two|few|many|other)$/;

/** Keys the source builds from a variable (see the usages named). */
const COMPUTED = [
  // ThemeToggle, settings: t(`theme.${theme}`)
  ...['system', 'light', 'dark'].map((v) => `theme.${v}`),
  // sign, signs: t(`authority.${authority}`)
  // signmessage, verifymessage, auths: authorityName()
  ...['posting', 'active', 'owner', 'memo', 'unknown'].map(
    (v) => `authority.${v}`,
  ),
  // sign: `sign.signed_with_${authority}`, `sign.missing_${authority}_key`
  ...['posting', 'active', 'owner'].flatMap((v) => [
    `sign.signed_with_${v}`,
    `sign.missing_${v}_key`,
  ]),
  // operation-summary: operationName(), fieldLabel()
  ...Object.keys(OPERATIONS).map((name) => `op_name.${name}`),
  ...Object.keys(en.op_field).map((field) => `op_field.${field}`),
  // page-meta: `meta.${key}`
  ...Object.keys(en.meta).map((key) => `meta.${key}`),
];

type Tree = { [key: string]: string | Tree };

/** [dotted key, string] for every string in a dictionary. */
function leaves(tree: Tree, prefix = ''): [string, string][] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string'
      ? [[`${prefix}${key}`, value] as [string, string]]
      : leaves(value, `${prefix}${key}.`),
  );
}

const placeholders = (text: string) =>
  [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const tags = (text: string) =>
  [...text.matchAll(/<\/?(\w+)\s*\/?>/g)].map((m) => m[0]).sort();

// Every shipped dictionary against the English source. Crowdin writes these
// files; a sync that dropped a string, renamed a placeholder or lost a plural
// form a language needs fails here rather than on someone's screen.
describe.each(
  LANGUAGES.filter((l) => l.code !== 'en').map((l) => [l.code, l.file]),
)('the %s dictionary', (code, file) => {
  const dictionary = JSON.parse(
    readFileSync(resolve(SRC, 'i18n/locales', `${file}.json`), 'utf8'),
  ) as Tree;
  const translated = new Map(leaves(dictionary));
  const source = leaves(en as Tree);
  // The forms a count on these screens can take, with the counts each covers.
  // French, Spanish, Italian and Portuguese also have a `many` for round
  // millions, which neither Crowdin nor a count of apps or accounts reaches.
  const rules = new Intl.PluralRules(code);
  const covered = new Map<string, number>();
  for (let n = 0; n <= 1000; n++) {
    const category = rules.select(n);
    covered.set(category, (covered.get(category) ?? 0) + 1);
  }
  const categories = [...covered.keys()];

  it('has every string, with the same placeholders and markup', () => {
    const problems: string[] = [];
    for (const [key, text] of source) {
      if (PLURAL.test(key)) continue;
      const own = translated.get(key);
      if (typeof own !== 'string' || !own.trim()) {
        problems.push(`${key}: missing`);
        continue;
      }
      if (placeholders(own).join() !== placeholders(text).join())
        problems.push(`${key}: placeholders ${placeholders(own)}`);
      if (tags(own).join() !== tags(text).join())
        problems.push(`${key}: markup ${tags(own)}`);
      // i18next reads anything between braces as a variable and leaves one it
      // does not know as text: `{{amount}}` or `{ {amount}` would drop the
      // value. Only well-formed `{name}` may carry a brace.
      if (/[{}]/.test(own.replace(/\{\w+\}/g, '')))
        problems.push(`${key}: stray brace`);
      if (/@\{/.test(own))
        problems.push(`${key}: @ before a placeholder (the value carries it)`);
    }
    expect(problems).toEqual([]);
  });

  it('has the plural forms the language needs', () => {
    const problems: string[] = [];
    const bases = new Set(
      source
        .filter(([key]) => PLURAL.test(key))
        .map(([key]) => key.replace(PLURAL, '')),
    );
    for (const base of bases) {
      const wanted = placeholders(en_other(base));
      for (const category of categories) {
        const key = `${base}_${category}`;
        const own = translated.get(key);
        if (typeof own !== 'string' || !own.trim()) {
          problems.push(`${key}: missing`);
          continue;
        }
        const names = placeholders(own);
        // A form that covers more than one count must say which: Russian
        // `one` is also 21, 31 and 41. One that covers a single count (Arabic
        // `two`) may leave the number out. Never twice, never another value.
        const needed = (covered.get(category) ?? 0) > 1 ? wanted : [];
        const extra = names.filter((name) => !wanted.includes(name));
        const twice = names.length !== new Set(names).size;
        const lost = needed.some((name) => !names.includes(name));
        if (extra.length || twice || lost)
          problems.push(`${key}: placeholders {${names}}`);
        if (/[{}]/.test(own.replace(/\{\w+\}/g, '')))
          problems.push(`${key}: stray brace`);
      }
    }
    expect(problems).toEqual([]);
  });

  // A Crowdin export fills every string it has no approved translation for
  // with the English source. A language that is mostly English again is a
  // broken sync, not a translation.
  it('is translated rather than English again', () => {
    const same = source.filter(
      ([key, text]) => translated.get(key) === text,
    ).length;
    expect(same / source.length).toBeLessThan(0.15);
  });

  it('has nothing the English source does not', () => {
    const known = new Set(source.map(([key]) => key.replace(PLURAL, '')));
    const extra = [...translated.keys()].filter(
      (key) => !known.has(key.replace(PLURAL, '')),
    );
    expect(extra).toEqual([]);
  });
});

function en_other(base: string): string {
  const text = lookup(`${base}_other`);
  return typeof text === 'string' ? text : '';
}
