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
 * And nothing may hand-write a profile key again: the builders only help if
 * they are the single way these caches are addressed.
 */
describe('cache keys are not hand-written', () => {
  const SRC = resolve(process.cwd(), 'src');

  function files(dir: string): string[] {
    const out: string[] = [];
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry);
      if (statSync(p).isDirectory()) {
        if (entry === 'locales') continue;
        out.push(...files(p));
      } else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
        out.push(p);
      }
    }
    return out;
  }

  it('every queryKey comes from lib/query-keys', () => {
    const offenders: string[] = [];
    for (const file of files(SRC)) {
      if (file.endsWith('query-keys.ts')) continue;
      const src = readFileSync(file, 'utf8');
      // A queryKey whose value starts with an inline array literal.
      for (const m of src.matchAll(/queryKey:\s*\[/g)) {
        const line = src.slice(0, m.index).split('\n').length;
        offenders.push(`${file.replace(`${SRC}/`, '')}:${line}`);
      }
      // setQueryData with an inline array is the same hazard: that is exactly
      // how the wrong shape got into the consent screen's cache.
      for (const m of src.matchAll(/setQueryData\(\s*\[/g)) {
        const line = src.slice(0, m.index).split('\n').length;
        offenders.push(`${file.replace(`${SRC}/`, '')}:${line} (setQueryData)`);
      }
    }
    expect(
      offenders,
      `build these through lib/query-keys instead:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});
