import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { _resetKeyCache, getState, migrateLegacyKeychain } from './accounts';

// Accounts saved before April 2021 sit under the original `keychain` key:
// { "<username>": "<keystore blob>" }. A Nuxt plugin moved them into
// `vuex__accounts` on every page load; deleting the Nuxt app deleted it, and
// those keys are the only copy on the user's device.
const LEGACY = 'keychain';
const CURRENT = 'vuex__accounts';

function current() {
  return JSON.parse(localStorage.getItem(CURRENT) ?? '{}');
}

describe('migrateLegacyKeychain', () => {
  beforeEach(() => {
    localStorage.clear();
    _resetKeyCache();
    vi.restoreAllMocks();
  });

  it('does nothing when there is no legacy key', () => {
    expect(migrateLegacyKeychain()).toBe(false);
    expect(localStorage.getItem(CURRENT)).toBeNull();
  });

  it('carries legacy accounts into the current store and clears the old key', () => {
    localStorage.setItem(
      LEGACY,
      JSON.stringify({ alice: 'plain-blob', bob: 'triplesec-blob' }),
    );
    expect(migrateLegacyKeychain()).toBe(true);
    expect(current().accountsKeychains).toEqual({
      alice: { password: 'plain-blob' },
      bob: { password: 'triplesec-blob' },
    });
    expect(localStorage.getItem(LEGACY)).toBeNull();
    expect(getState().usernames.sort()).toEqual(['alice', 'bob']);
  });

  it('selects an account so the migrated user can sign straight away', () => {
    localStorage.setItem(LEGACY, JSON.stringify({ alice: 'blob' }));
    migrateLegacyKeychain();
    expect(current().selectedAccount).toBe('alice');
  });

  // A five-year-old blob must never replace a keystore the user has since
  // re-encrypted: that would downgrade them to the old format, or to a passcode
  // they no longer remember.
  it('never overwrites an account already in the current store', () => {
    localStorage.setItem(
      CURRENT,
      JSON.stringify({
        accountsKeychains: { alice: { password: 'v1-current' } },
        selectedAccount: 'alice',
      }),
    );
    localStorage.setItem(
      LEGACY,
      JSON.stringify({ alice: 'ancient', bob: 'ancient-bob' }),
    );
    expect(migrateLegacyKeychain()).toBe(true);
    expect(current().accountsKeychains.alice).toEqual({
      password: 'v1-current',
    });
    expect(current().accountsKeychains.bob).toEqual({
      password: 'ancient-bob',
    });
    expect(current().selectedAccount).toBe('alice');
  });

  it('leaves unparsable legacy data alone rather than destroying it', () => {
    localStorage.setItem(LEGACY, 'not json at all');
    expect(migrateLegacyKeychain()).toBe(false);
    expect(localStorage.getItem(LEGACY)).toBe('not json at all');
  });

  it('ignores entries whose value is not a usable blob', () => {
    localStorage.setItem(
      LEGACY,
      JSON.stringify({ alice: 'blob', bob: 42, carol: '', dave: null }),
    );
    expect(migrateLegacyKeychain()).toBe(true);
    expect(Object.keys(current().accountsKeychains)).toEqual(['alice']);
  });

  it('drops a legacy key that has nothing left to give', () => {
    localStorage.setItem(
      CURRENT,
      JSON.stringify({
        accountsKeychains: { alice: { password: 'v1' } },
        selectedAccount: 'alice',
      }),
    );
    localStorage.setItem(LEGACY, JSON.stringify({ alice: 'ancient' }));
    expect(migrateLegacyKeychain()).toBe(false);
    // Already covered, so it must not keep being retried on every startup.
    expect(localStorage.getItem(LEGACY)).toBeNull();
  });

  // The plugin this replaces removed the legacy key unconditionally. In a
  // private window, or with storage full, that destroyed the ONLY copy of the
  // user's keys.
  it('keeps the legacy key when the new state cannot be written', () => {
    localStorage.setItem(LEGACY, JSON.stringify({ alice: 'blob' }));
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('quota');
      });
    expect(migrateLegacyKeychain()).toBe(false);
    setItem.mockRestore();
    expect(localStorage.getItem(LEGACY)).toBe(
      JSON.stringify({ alice: 'blob' }),
    );
  });

  it('survives storage that refuses to be read at all', () => {
    const getItem = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('blocked');
      });
    expect(() => migrateLegacyKeychain()).not.toThrow();
    getItem.mockRestore();
  });
});

describe('startup wiring', () => {
  // Being correct is not enough: it has to be CALLED, and it has to run BEFORE
  // autoUnlockPlaintext, which reads only the new key. If it ran second, a
  // migrated plaintext account would stay locked until the next reload.
  const entry = readFileSync(resolve(process.cwd(), 'src/index.tsx'), 'utf8');

  it('the entry point migrates before it auto-unlocks', () => {
    expect(entry).toMatch(/^migrateLegacyKeychain\(\);$/m);
    expect(entry.search(/^migrateLegacyKeychain\(\);$/m)).toBeLessThan(
      entry.search(/^autoUnlockPlaintext\(\);$/m),
    );
  });
});
