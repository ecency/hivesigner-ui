import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import en from './locales/en-US.js';

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

  // The two places that build a key from a variable, listed by hand because a
  // regex cannot follow them.
  it('the computed theme keys exist', () => {
    for (const theme of ['system', 'light', 'dark']) {
      expect(resolves(`theme.${theme}`), `theme.${theme}`).toBe(true);
    }
  });
});
