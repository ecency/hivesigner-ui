import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  _resetKeyCache,
  accountIsEncrypted,
  addAccount,
  autoUnlockPlaintext,
  getKeys,
  getState,
  hasAccounts,
  isUnlocked,
  lockAccount,
  removeAccount,
  selectAccount,
  unlockAccount,
} from './accounts';

const TRIPLESEC_FIELD =
  '1c94d7de00000004aa5ea5bd0d06be50653efbb3e9fd71df45cfb875de86c27fed408e589c8021846f6f11848e2dfa3599ea2ce8a203a4b5415699854d7f82ed3db6b790d679086d20d3f4289144035b4804a52e9df15d88df43046eee75b9559e56c1bfc55b3be62412486034ae10e3b398d03093d4f1c34422454ab4fce4a1ad9241507aabdb364808b5ff3b871b1071a7ab41a290eda273fc4f5cf26524ef64386ecbe50e73b1555a10d60fbfbdc59297cc3e2682d8040d0e8a5c856b98c4a530a3d848622582f7d5942fa6374b8c9825d5727ad8e9af3108d04e00307b847a5cac78389f355548b30451fac4165323deacebd134872c99c1015605440ef4f1';

beforeEach(() => {
  localStorage.clear();
  _resetKeyCache();
});

describe('adding and reading accounts', () => {
  it('adds a plaintext (no-passcode) account and leaves it unlocked', async () => {
    await addAccount('alice', { posting: '5Kposting' });
    expect(hasAccounts()).toBe(true);
    expect(getState().selectedAccount).toBe('alice');
    expect(isUnlocked('alice')).toBe(true);
    expect(getKeys('alice')).toEqual({ posting: '5Kposting' });
    expect(accountIsEncrypted('alice')).toBe(false);
  });

  it('adds a passcode-protected account (encrypted at rest)', async () => {
    await addAccount('bob', { active: '5Kactive' }, 'pass');
    expect(accountIsEncrypted('bob')).toBe(true);
    // Its key is in memory this session but the stored field is encrypted.
    expect(getKeys('bob')).toEqual({ active: '5Kactive' });
  });

  it('does not persist plaintext keys for an encrypted account', async () => {
    await addAccount('bob', { active: '5Kactive' }, 'pass');
    const raw = localStorage.getItem('vuex__accounts') ?? '';
    expect(raw).not.toContain('5Kactive');
  });

  it('merges keys when a second key is imported for the same account', async () => {
    await addAccount('alice', { posting: '5Kposting' }, 'pass');
    // Import the active key later; posting must survive.
    await addAccount('alice', { active: '5Kactive' }, 'pass');
    expect(getKeys('alice')).toEqual({
      posting: '5Kposting',
      active: '5Kactive',
    });
    // And it persists: re-unlock reads both back.
    _resetKeyCache();
    expect(await unlockAccount('alice', 'pass')).toEqual({
      posting: '5Kposting',
      active: '5Kactive',
    });
  });

  it('merges from STORED keys when importing into a locked encrypted account', async () => {
    await addAccount('alice', { posting: '5Kposting' }, 'pass');
    _resetKeyCache(); // simulate reload: locked, keyCache empty
    await addAccount('alice', { active: '5Kactive' }, 'pass');
    expect(getKeys('alice')).toEqual({
      posting: '5Kposting',
      active: '5Kactive',
    });
  });

  it('refuses to downgrade an encrypted account to plaintext (no passcode)', async () => {
    await addAccount('alice', { posting: '5Kposting' }, 'pass');
    _resetKeyCache();
    await expect(addAccount('alice', { active: '5Kactive' })).rejects.toThrow(
      /protected/,
    );
    expect(accountIsEncrypted('alice')).toBe(true);
  });
});

describe('autoUnlockPlaintext', () => {
  it('loads plaintext accounts into memory but leaves encrypted ones locked', async () => {
    await addAccount('plain', { posting: '5Kp' });
    await addAccount('enc', { active: '5Ka' }, 'pass');
    // Simulate a reload: memory cleared, storage intact.
    _resetKeyCache();
    expect(isUnlocked('plain')).toBe(false);
    await autoUnlockPlaintext();
    expect(isUnlocked('plain')).toBe(true);
    expect(getKeys('plain')).toEqual({ posting: '5Kp' });
    expect(isUnlocked('enc')).toBe(false); // still needs its passcode
  });
});

describe('unlocking', () => {
  it('unlocks an encrypted account with the right passcode and locks/relocks', async () => {
    await addAccount('bob', { active: '5Kactive' }, 'pass');
    lockAccount('bob');
    expect(isUnlocked('bob')).toBe(false);
    const keys = await unlockAccount('bob', 'pass');
    expect(keys).toEqual({ active: '5Kactive' });
    expect(isUnlocked('bob')).toBe(true);
  });

  it('rejects a wrong passcode', async () => {
    await addAccount('bob', { active: '5Kactive' }, 'pass');
    lockAccount('bob');
    await expect(unlockAccount('bob', 'wrong')).rejects.toThrow();
    expect(isUnlocked('bob')).toBe(false);
  });

  it('keeps a legacy triplesec account readable by the old app on unlock (rollback window)', async () => {
    // Seed a legacy triplesec account directly, as an old-app localStorage would.
    localStorage.setItem(
      'vuex__accounts',
      JSON.stringify({
        accountsKeychains: { legacy: { password: TRIPLESEC_FIELD } },
        selectedAccount: 'legacy',
      }),
    );
    expect(accountIsEncrypted('legacy')).toBe(true);
    const keys = await unlockAccount('legacy', 'unlock-passcode-123');
    expect(keys).toEqual({
      posting: '5KT3LKgkovUYzQVSX3WpEGZ4rdazyotpi6piwvdFMxx9eiv8gRL',
    });
    // The stored field is UNCHANGED: the Nuxt app cannot read a v1 envelope,
    // and a rollback to it must not lock this user out. The upgrade is behind
    // UPGRADE_TRIPLESEC_ON_UNLOCK, off for the cutover window.
    const stored = JSON.parse(localStorage.getItem('vuex__accounts') ?? '{}');
    expect(stored.accountsKeychains.legacy.password).toBe(TRIPLESEC_FIELD);
    // And it still unlocks with the same passcode afterwards.
    _resetKeyCache();
    expect(await unlockAccount('legacy', 'unlock-passcode-123')).toEqual(keys);
  });
});

describe('selecting and removing', () => {
  it('switches the selected account without dropping the others', async () => {
    await addAccount('alice', { posting: '5Ka' });
    await addAccount('bob', { posting: '5Kb' }, 'pass');
    selectAccount('bob');
    expect(getState().selectedAccount).toBe('bob');
    // Adding bob did not log alice out.
    expect(isUnlocked('alice')).toBe(true);
    expect(getState().usernames.sort()).toEqual(['alice', 'bob']);
  });

  it('removes an account and reselects another', async () => {
    await addAccount('alice', { posting: '5Ka' });
    await addAccount('bob', { posting: '5Kb' });
    removeAccount('alice');
    expect(getState().usernames).toEqual(['bob']);
    expect(getState().selectedAccount).toBe('bob');
    expect(isUnlocked('alice')).toBe(false);
  });
});

describe('adding a key to an encrypted account (key-loss guards)', () => {
  it('a WRONG passcode throws and leaves the stored keys intact', async () => {
    await addAccount('carol', { posting: '5Kposting' }, 'right');
    _resetKeyCache(); // simulate a reload: only the encrypted record remains

    await expect(
      addAccount('carol', { active: '5Kactive' }, 'wrong'),
    ).rejects.toThrow();

    // The record must still open with the ORIGINAL passcode and still hold the
    // original key. Catching the error and re-saving used to overwrite it.
    const keys = await unlockAccount('carol', 'right');
    expect(keys).toEqual({ posting: '5Kposting' });
    expect(accountIsEncrypted('carol')).toBe(true);
  });

  it('the RIGHT passcode merges the new key into the stored ones', async () => {
    await addAccount('dave', { posting: '5Kposting' }, 'pw');
    _resetKeyCache();
    await addAccount('dave', { active: '5Kactive' }, 'pw');
    expect(await unlockAccount('dave', 'pw')).toEqual({
      posting: '5Kposting',
      active: '5Kactive',
    });
  });

  it('refuses to add without a passcode rather than downgrading to plaintext', async () => {
    await addAccount('erin', { posting: '5Kposting' }, 'pw');
    _resetKeyCache();
    await expect(addAccount('erin', { active: '5Kactive' })).rejects.toThrow();
    expect(accountIsEncrypted('erin')).toBe(true);
  });
});

describe('when localStorage refuses to persist', () => {
  it('leaves the account listed, unlocked AND selectable so its keys are usable', async () => {
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('blocked');
      });
    try {
      await addAccount('alice', { posting: '5Kposting' });
      const s = getState();
      expect(s.usernames).toContain('alice');
      expect(s.unlocked).toContain('alice');
      // Without a volatile selection this was null, so every signing consumer
      // (which reads selectedAccount) could not use the keys just imported.
      expect(s.selectedAccount).toBe('alice');
      expect(getKeys('alice')).toEqual({ posting: '5Kposting' });
    } finally {
      setItem.mockRestore();
    }
  });

  it('can still switch between two in-memory accounts', async () => {
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('blocked');
      });
    try {
      await addAccount('alice', { posting: '5Ka' });
      await addAccount('bob', { posting: '5Kb' });
      expect(getState().selectedAccount).toBe('alice');
      selectAccount('bob');
      expect(getState().selectedAccount).toBe('bob');
    } finally {
      setItem.mockRestore();
    }
  });
});

describe('selection precedence when a write fails mid-session', () => {
  it("this session's choice wins over the stale persisted one", async () => {
    // Alice is persisted and selected. Storage then starts failing. Clicking Bob
    // must actually switch: on a signer, selectedAccount is the account you sign
    // as, so silently keeping Alice is signing as the wrong account.
    await addAccount('alice', { posting: '5Ka' });
    expect(getState().selectedAccount).toBe('alice');

    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('blocked');
      });
    try {
      await addAccount('bob', { posting: '5Kb' });
      selectAccount('bob');
      expect(getState().selectedAccount).toBe('bob');
      expect(getKeys('bob')).toEqual({ posting: '5Kb' });
    } finally {
      setItem.mockRestore();
    }
  });

  it('a fresh session still honours the persisted selection', async () => {
    await addAccount('alice', { posting: '5Ka' });
    await addAccount('bob', { posting: '5Kb' });
    selectAccount('bob');
    // Simulate a reload: volatile state gone, storage intact.
    _resetKeyCache();
    expect(getState().selectedAccount).toBe('bob');
  });
});

describe('what the Nuxt app left in storage', () => {
  it('reads plaintext sibling WIFs into memory and leaves the record as Nuxt wrote it', async () => {
    const { encodePlain } = await import('./keystore');
    const { PrivateKey } = await import('@ecency/sdk/hive');
    const POSTING = PrivateKey.fromSeed('sibling-posting').toString();
    const ACTIVE = PrivateKey.fromSeed('sibling-active').toString();
    localStorage.setItem(
      'vuex__accounts',
      JSON.stringify({
        selectedAccount: 'alice',
        accountsKeychains: {
          alice: {
            password: encodePlain({ posting: POSTING }),
            // Added later through the old /auths page: stored ONLY here.
            active: ACTIVE,
          },
        },
      }),
    );
    const before = localStorage.getItem('vuex__accounts');
    await autoUnlockPlaintext();
    expect(getKeys('alice')?.active).toBe(ACTIVE);
    expect(getKeys('alice')?.posting).toBe(POSTING);
    // Nuxt reads authority keys from the siblings: untouched during the window.
    expect(localStorage.getItem('vuex__accounts')).toBe(before);
  });

  it('adds a key to a legacy account the way the old /auths page did: as a sibling, blob unchanged', async () => {
    const { PrivateKey } = await import('@ecency/sdk/hive');
    const ACTIVE = PrivateKey.fromSeed('added-active').toString();
    localStorage.setItem(
      'vuex__accounts',
      JSON.stringify({
        selectedAccount: 'legacy',
        accountsKeychains: { legacy: { password: TRIPLESEC_FIELD } },
      }),
    );
    await addAccount('legacy', { active: ACTIVE }, 'unlock-passcode-123');
    const stored = JSON.parse(localStorage.getItem('vuex__accounts') ?? '{}');
    expect(stored.accountsKeychains.legacy.password).toBe(TRIPLESEC_FIELD);
    expect(stored.accountsKeychains.legacy.active).toBe(ACTIVE);
    expect(stored.accountsKeychains.legacy.posting).toBe(
      '5KT3LKgkovUYzQVSX3WpEGZ4rdazyotpi6piwvdFMxx9eiv8gRL',
    );
    expect(getKeys('legacy')?.active).toBe(ACTIVE);
  });

  it('reads a sibling key into memory on unlock of a triplesec account and leaves the record alone', async () => {
    const { PrivateKey } = await import('@ecency/sdk/hive');
    const ACTIVE = PrivateKey.fromSeed('sibling-active-2').toString();
    localStorage.setItem(
      'vuex__accounts',
      JSON.stringify({
        selectedAccount: 'legacy',
        accountsKeychains: {
          legacy: { password: TRIPLESEC_FIELD, active: ACTIVE },
        },
      }),
    );
    const keys = await unlockAccount('legacy', 'unlock-passcode-123');
    expect(keys.active).toBe(ACTIVE);
    expect(keys.posting).toBe(
      '5KT3LKgkovUYzQVSX3WpEGZ4rdazyotpi6piwvdFMxx9eiv8gRL',
    );
    const stored = JSON.parse(localStorage.getItem('vuex__accounts') ?? '{}');
    // Blob AND sibling untouched: after a rollback the old app reads both.
    expect(stored.accountsKeychains.legacy.password).toBe(TRIPLESEC_FIELD);
    expect(stored.accountsKeychains.legacy.active).toBe(ACTIVE);
  });

  it('deletes the old auth store, which held the last login keys in plaintext', async () => {
    const { removeLegacyAuthStore } = await import('./accounts');
    localStorage.setItem(
      'vuex__auth',
      JSON.stringify({ keys: { posting: '5K...' } }),
    );
    expect(removeLegacyAuthStore()).toBe(true);
    expect(localStorage.getItem('vuex__auth')).toBeNull();
    expect(removeLegacyAuthStore()).toBe(false);
  });
});
