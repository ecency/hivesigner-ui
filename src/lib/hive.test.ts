import { describe, expect, it } from 'vitest';
import type { Account } from './hive';
import {
  deriveKeysFromMasterPassword,
  keyRoleForAccount,
  publicKeyFromWif,
  recoverMessageSigner,
  resolveCredential,
  signMessage,
  verifyMessage,
} from './hive';

// Vectors from @hiveio/dhive (throwaway login hivesignertest/password123).
const POSTING_WIF = '5KT3LKgkovUYzQVSX3WpEGZ4rdazyotpi6piwvdFMxx9eiv8gRL';
const POSTING_PUB = 'STM4tb8Quiasc1qFoxqAkA72zug5bTUbZxAFBzDV43LXoBBRZdXkS';

// An account whose posting key_auths hold POSTING_PUB.
function account(): Account {
  const auth = (keys: [string, number][] = []) => ({
    weight_threshold: 1,
    account_auths: [] as [string, number][],
    key_auths: keys,
  });
  return {
    name: 'hivesignertest',
    memo_key: 'STM7mem0000000000000000000000000000000000000000000000',
    owner: auth(),
    active: auth(),
    posting: auth([[POSTING_PUB, 1]]),
    json_metadata: '',
    posting_json_metadata: '',
  };
}

describe('key derivation (SDK, cross-checked with dhive)', () => {
  it('derives the dhive public key from a WIF', () => {
    expect(publicKeyFromWif(POSTING_WIF)).toBe(POSTING_PUB);
  });

  it('returns null for an invalid WIF', () => {
    expect(publicKeyFromWif('not-a-key')).toBeNull();
  });

  it('derives the posting key from a master password matching fromLogin', () => {
    const keys = deriveKeysFromMasterPassword('hivesignertest', 'password123');
    expect(publicKeyFromWif(keys.posting!)).toBe(POSTING_PUB);
    expect(keys.owner && keys.active && keys.posting && keys.memo).toBeTruthy();
  });
});

describe('credential validation against an account', () => {
  it('identifies the role of a key that is on the account', () => {
    expect(keyRoleForAccount(account(), POSTING_WIF)).toBe('posting');
  });

  it('rejects a valid WIF that is not on the account', () => {
    // A different random-but-valid key derived from another login.
    const other = deriveKeysFromMasterPassword('someoneelse', 'pw').active!;
    expect(keyRoleForAccount(account(), other)).toBeNull();
  });

  it('resolves a single posting WIF to its role', () => {
    expect(resolveCredential(account(), POSTING_WIF)).toEqual({
      posting: POSTING_WIF,
    });
  });

  it('resolves a master password to only the roles on the account', () => {
    const resolved = resolveCredential(account(), 'password123');
    // The fixture only lists the posting key, so only posting is kept.
    expect(resolved).not.toBeNull();
    expect(publicKeyFromWif(resolved!.posting!)).toBe(POSTING_PUB);
    expect(resolved!.active).toBeUndefined();
  });

  it('returns null when nothing matches', () => {
    expect(resolveCredential(account(), 'wrong-password')).toBeNull();
  });
});

describe('message signing (SDK)', () => {
  it('signs and recovers back to the signer', () => {
    const sig = signMessage('hello hive', POSTING_WIF);
    expect(sig).toHaveLength(130);
    expect(recoverMessageSigner('hello hive', sig)).toBe(POSTING_PUB);
  });

  it('verifies a signature against the signing account', () => {
    const sig = signMessage('hello hive', POSTING_WIF);
    expect(verifyMessage('hello hive', sig, account())).toBe(true);
  });

  it('fails verification for a tampered message', () => {
    const sig = signMessage('hello hive', POSTING_WIF);
    expect(verifyMessage('hello HIVE', sig, account())).toBe(false);
  });
});
