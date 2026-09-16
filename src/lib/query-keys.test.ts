import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ALL_KEY_BUILDERS } from './query-keys';

/**
 * Two shapes must never share a cache key.
 *
 * The app directory and the OAuth consent screen both cached "the app's
 * profile" for the same account under `['app-profile', name]`, but with
 * different shapes - only the consent one carries `redirectUris`. Visiting
 * /apps seeded the key, and returning to an OAuth request then handed the
 * wrong object to `profile.redirectUris.includes(...)`: "Something went wrong!"
 * instead of a consent screen. Reproduced in Chromium, and neither the
 * typecheck nor any test saw it, because React Query keys are untyped strings.
 */
describe('query keys', () => {
  const NAME = 'ecency.app';

  it('no two builders produce the same key for the same account', () => {
    const seen = new Map<string, string>();
    for (const [label, build] of Object.entries(ALL_KEY_BUILDERS)) {
      // Every builder takes 0 or 1 argument; an account name covers both the
      // single-name and the batch case.
      const key = JSON.stringify(
        (build as (arg?: unknown) => readonly unknown[])(
          label === 'directoryProfileBatchKey' ? [NAME] : NAME,
        ),
      );
      const clash = seen.get(key);
      expect(clash, `${label} and ${clash} both build ${key}`).toBeUndefined();
      seen.set(key, label);
    }
    expect(seen.size).toBe(Object.keys(ALL_KEY_BUILDERS).length);
  });

  it('distinguishes the directory profile from the OAuth app profile', () => {
    expect(ALL_KEY_BUILDERS.directoryProfileKey(NAME)).not.toEqual(
      ALL_KEY_BUILDERS.oauthAppProfileKey(NAME),
    );
  });
});

/**
 * And nothing may hand-write a cache key again: the builders only help if they
 * are the single way these caches are addressed.
 */
describe('cache keys are not hand-written', () => {
  const SRC = resolve(process.cwd(), 'src');
  const BUILDERS = Object.keys(ALL_KEY_BUILDERS);

  // TEST FILES ARE INCLUDED. Review pointed out that excluding them exempted
  // the exact failure this guard exists for: oauth2.authorize.test.tsx
  // dispatched its useQuery mock on a hardcoded 'app-profile', so renaming the
  // real key sent the profile query down the account branch and handed the
  // component the wrong object. A stale key in a mock is as dangerous as one in
  // a component, because it makes the suite agree with the bug.
  function files(dir: string): string[] {
    const out: string[] = [];
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry);
      if (statSync(p).isDirectory()) {
        if (entry === 'locales') continue;
        out.push(...files(p));
      } else if (/\.tsx?$/.test(entry)) {
        out.push(p);
      }
    }
    return out;
  }

  /**
   * A key must be a CALL to one of the builders.
   *
   * The first version of this only matched an array literal written directly
   * after `queryKey:`, so `const key = ['a', b]; useQuery({ queryKey: key })`
   * walked straight past it. Requiring the shape `queryKey: someBuilder(` means
   * a literal, a variable and a call to anything else are all rejected, which
   * is the whole space.
   */
  const ALLOWED = new RegExp(`^(?:${BUILDERS.join('|')})\\(`);

  // `{ queryKey: unknown[] }` in a mock's parameter list is a TYPE, not a key.
  const TYPE_ANNOTATION = /^(?:readonly\s+)?(?:unknown|string|any|QueryKey)\b/;

  it('every queryKey and setQueryData uses a builder from lib/query-keys', () => {
    const offenders: string[] = [];
    for (const file of files(SRC)) {
      // The builders themselves, and THIS file, whose comments and regexes
      // necessarily contain the patterns being searched for.
      if (/query-keys\.(test\.)?tsx?$/.test(file)) continue;
      const src = readFileSync(file, 'utf8');
      const where = (index: number) =>
        `${file.replace(`${SRC}/`, '')}:${src.slice(0, index).split('\n').length}`;

      for (const m of src.matchAll(/queryKey:\s*([^,\n]+)/g)) {
        const value = m[1].trim();
        if (!ALLOWED.test(value) && !TYPE_ANNOTATION.test(value)) {
          offenders.push(`${where(m.index ?? 0)} queryKey: ${value}`);
        }
      }
      // A mock that DISPATCHES on a key literal is the same hazard wearing a
      // different hat, and it is what actually happened: the oauth mock
      // compared `opts.queryKey[0] === 'app-profile'`, so renaming the real key
      // silently routed the profile query down the account branch. Comparing
      // against a builder is fine; comparing against a literal is not.
      for (const m of src.matchAll(
        /queryKey\[\d+\]\s*===\s*(['"][^'"]+['"])/g,
      )) {
        offenders.push(
          `${where(m.index ?? 0)} compares queryKey against the literal ${m[1]}`,
        );
      }

      for (const m of src.matchAll(/setQueryData\(\s*([^,\n]+)/g)) {
        if (!ALLOWED.test(m[1].trim())) {
          offenders.push(`${where(m.index ?? 0)} setQueryData(${m[1].trim()}`);
        }
      }
    }
    expect(
      offenders,
      `build these through lib/query-keys instead:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  /**
   * And the register may not accumulate keys for caches that no longer exist.
   *
   * The collision test above passes happily on a dead builder, so three of them
   * outlived the code that used them: `topAppsKey` and `allAppsKey` addressed
   * the chain-read directory this app no longer has, and
   * `directoryProfileBatchKey` addressed the profile batching that went with it.
   * Dead keys are not harmless here. They are the vocabulary someone reaches for
   * when adding a cache, so a stale one invites a second shape under a name that
   * once meant something else, which is the crash this whole file exists for.
   */
  it('every builder in ALL_KEY_BUILDERS is actually used', () => {
    const used = new Set<string>();
    for (const file of files(SRC)) {
      if (/query-keys\.(test\.)?tsx?$/.test(file)) continue;
      const src = readFileSync(file, 'utf8');
      for (const name of BUILDERS) {
        if (new RegExp(`\\b${name}\\s*\\(`).test(src)) used.add(name);
      }
    }
    const dead = BUILDERS.filter((name) => !used.has(name));
    expect(
      dead,
      `these key builders address nothing; delete them from lib/query-keys:\n${dead.join('\n')}`,
    ).toEqual([]);
  });
});
