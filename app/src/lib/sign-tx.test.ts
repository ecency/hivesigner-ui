import { describe, expect, it } from 'vitest';
import type { Operation } from './hive-uri';
import { resolveSigner } from './sign-tx';

describe('resolveSigner', () => {
  it('replaces __signer with the account name in a vote', () => {
    const ops: Operation[] = [
      ['vote', { voter: '__signer', author: 'a', permlink: 'p', weight: 1 }],
    ];
    expect(resolveSigner(ops, 'alice')).toEqual([
      ['vote', { voter: 'alice', author: 'a', permlink: 'p', weight: 1 }],
    ]);
  });

  it('replaces __signer in a transfer from-field, leaving other fields alone', () => {
    const ops: Operation[] = [
      [
        'transfer',
        {
          from: '__signer',
          to: 'bob',
          amount: '1.000 HIVE',
          memo: 'to __signer? no',
        },
      ],
    ];
    // Only an exact "__signer" string is replaced, not a substring inside another value.
    expect(resolveSigner(ops, 'alice')).toEqual([
      [
        'transfer',
        {
          from: 'alice',
          to: 'bob',
          amount: '1.000 HIVE',
          memo: 'to __signer? no',
        },
      ],
    ]);
  });

  it('recurses into nested arrays and objects', () => {
    const ops: Operation[] = [
      [
        'custom_json',
        { required_posting_auths: ['__signer'], id: 'x', json: '{}' },
      ],
    ];
    expect(resolveSigner(ops, 'alice')[0][1].required_posting_auths).toEqual([
      'alice',
    ]);
  });

  it('leaves operations without a placeholder unchanged', () => {
    const ops: Operation[] = [
      ['vote', { voter: 'someone', author: 'a', permlink: 'p', weight: 1 }],
    ];
    expect(resolveSigner(ops, 'alice')).toEqual(ops);
  });
});
