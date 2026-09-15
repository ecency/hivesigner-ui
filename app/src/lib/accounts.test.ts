import { beforeEach, describe, expect, it } from 'vitest';
import {
  _resetKeyCache,
  accountIsEncrypted,
  addAccount,
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

  it('migrates a legacy triplesec account to v1 on first unlock', async () => {
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
    // Stored field is now the v1 envelope, no longer triplesec.
    const stored = JSON.parse(localStorage.getItem('vuex__accounts') ?? '{}');
    expect(stored.accountsKeychains.legacy.password.startsWith('{')).toBe(true);
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
