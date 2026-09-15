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

  it('replaces __signer in the from-field', () => {
    const ops: Operation[] = [
      [
        'transfer',
        { from: '__signer', to: 'bob', amount: '1.000 HIVE', memo: 'x' },
      ],
    ];
    expect(resolveSigner(ops, 'alice')[0][1].from).toBe('alice');
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

  it('replaces __signer EMBEDDED in a custom_json json string (follow op)', () => {
    // A follow custom_json carries the follower inside the json STRING, not as a
    // top-level field; an exact-match replace would leave it as __signer.
    const json = JSON.stringify([
      'follow',
      { follower: '__signer', following: 'bob', what: ['blog'] },
    ]);
    const ops: Operation[] = [['custom_json', { id: 'follow', json }]];
    const out = resolveSigner(ops, 'alice')[0][1].json as string;
    expect(out).toContain('"follower":"alice"');
    expect(out).not.toContain('__signer');
  });

  it('leaves operations without a placeholder unchanged', () => {
    const ops: Operation[] = [
      ['vote', { voter: 'someone', author: 'a', permlink: 'p', weight: 1 }],
    ];
    expect(resolveSigner(ops, 'alice')).toEqual(ops);
  });
});
