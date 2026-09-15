import { describe, expect, it } from 'vitest';
import {
  authorizedApps,
  buildGrantOperation,
  buildRevokeOperation,
  hasGrant,
} from './grant';
import type { Account } from './hive';

function account(overrides: Partial<Account> = {}): Account {
  const auth = (account_auths: [string, number][] = []) => ({
    weight_threshold: 1,
    account_auths,
    key_auths: [] as [string, number][],
  });
  return {
    name: 'alice',
    memo_key: 'STM1memo',
    owner: auth(),
    active: auth(),
    posting: auth(),
    json_metadata: '{}',
    posting_json_metadata: '',
    ...overrides,
  };
}

describe('hasGrant (weight-aware)', () => {
  it('true only when the entry meets the threshold', () => {
    const posting = {
      weight_threshold: 1,
      account_auths: [['ecency.app', 1]] as [string, number][],
      key_auths: [],
    };
    expect(hasGrant(posting, 'ecency.app')).toBe(true);
    expect(hasGrant(posting, 'peakd.app')).toBe(false);
  });

  it('false when present but under the threshold', () => {
    const posting = {
      weight_threshold: 2,
      account_auths: [['ecency.app', 1]] as [string, number][],
      key_auths: [],
    };
    expect(hasGrant(posting, 'ecency.app')).toBe(false);
  });
});

describe('buildGrantOperation', () => {
  it('adds the app at the posting threshold, sorted', () => {
    const acc = account({
      posting: {
        weight_threshold: 1,
        account_auths: [['zzz.app', 1]],
        key_auths: [],
      },
    });
    const op = buildGrantOperation(acc, 'ecency.app');
    expect(op?.[0]).toBe('account_update');
    const posting = (
      op?.[1] as { posting: { account_auths: [string, number][] } }
    ).posting;
    expect(posting.account_auths).toEqual([
      ['ecency.app', 1],
      ['zzz.app', 1],
    ]);
  });

  it('returns null when the grant already exists', () => {
    const acc = account({
      posting: {
        weight_threshold: 1,
        account_auths: [['ecency.app', 1]],
        key_auths: [],
      },
    });
    expect(buildGrantOperation(acc, 'ecency.app')).toBeNull();
  });

  it('replaces an under-weight stale entry rather than duplicating', () => {
    const acc = account({
      posting: {
        weight_threshold: 2,
        account_auths: [['ecency.app', 1]],
        key_auths: [],
      },
    });
    const op = buildGrantOperation(acc, 'ecency.app');
    const posting = (
      op?.[1] as { posting: { account_auths: [string, number][] } }
    ).posting;
    expect(posting.account_auths).toEqual([['ecency.app', 2]]);
  });
});

describe('buildRevokeOperation', () => {
  it('removes the app from posting', () => {
    const acc = account({
      posting: {
        weight_threshold: 1,
        account_auths: [
          ['ecency.app', 1],
          ['keep.app', 1],
        ],
        key_auths: [],
      },
    });
    const op = buildRevokeOperation(acc, 'ecency.app');
    const posting = (
      op?.[1] as { posting: { account_auths: [string, number][] } }
    ).posting;
    expect(posting.account_auths).toEqual([['keep.app', 1]]);
    expect((op?.[1] as Record<string, unknown>).active).toBeUndefined();
  });

  it('removes from both posting and active when present in both', () => {
    const acc = account({
      posting: {
        weight_threshold: 1,
        account_auths: [['x', 1]],
        key_auths: [],
      },
      active: { weight_threshold: 1, account_auths: [['x', 1]], key_auths: [] },
    });
    const op = buildRevokeOperation(acc, 'x');
    expect(
      (op?.[1] as { posting: { account_auths: unknown[] } }).posting
        .account_auths,
    ).toEqual([]);
    expect(
      (op?.[1] as { active: { account_auths: unknown[] } }).active
        .account_auths,
    ).toEqual([]);
  });

  it('returns null when the app is authorized nowhere', () => {
    expect(buildRevokeOperation(account(), 'nobody')).toBeNull();
  });
});

describe('authorizedApps', () => {
  it('lists posting account_auths names', () => {
    const acc = account({
      posting: {
        weight_threshold: 1,
        account_auths: [
          ['a', 1],
          ['b', 1],
        ],
        key_auths: [],
      },
    });
    expect(authorizedApps(acc)).toEqual(['a', 'b']);
  });
});
