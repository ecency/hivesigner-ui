import { PrivateKey, Transaction } from '@ecency/sdk/hive';
import { describe, expect, it } from 'vitest';
import type { Operation } from './hive-uri';
import { resolveSigner, signOperations } from './sign-tx';

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

describe('signing a /sign/tx request (preserved header)', () => {
  // A preserved header supplies ref_block/expiration, so this path needs no
  // chain read and the real SDK can sign it in a unit test.
  const header = {
    ref_block_num: 1234,
    ref_block_prefix: 987654321,
    expiration: '2035-01-01T00:00:00',
    extensions: [] as unknown[],
  };
  const ops: Operation[] = [
    [
      'vote',
      { voter: '__signer', author: 'alice', permlink: 'p', weight: 10000 },
    ],
  ];
  const wif = PrivateKey.fromLogin(
    'hivesignertest',
    'password123',
    'posting',
  ).toString();

  /** The tx id of the same operations under a clean, extension-free header. */
  function expectedTxId(): string {
    const tx = new Transaction({
      transaction: {
        ...header,
        operations: resolveSigner(ops, 'alice'),
      } as never,
    });
    return tx.digest().txId;
  }

  it('signs the DISPLAYED operations, not the raw ones the caller sent', async () => {
    const out = await signOperations(
      resolveSigner(ops, 'alice'),
      wif,
      'alice',
      {
        ...header,
        // The caller's own (unprocessed) operations differ from the displayed set.
        operations: [
          [
            'vote',
            { voter: '__signer', author: 'attacker', permlink: 'x', weight: 1 },
          ],
        ],
      } as never,
    );
    expect(out.id).toBe(expectedTxId());
    expect(out.signature).toBeTruthy();
  });

  it('never signs caller-supplied transaction extensions', async () => {
    // extensions ARE part of the signed digest, so if they survived, the tx id
    // would differ from the clean-header id.
    const out = await signOperations(
      resolveSigner(ops, 'alice'),
      wif,
      'alice',
      {
        ...header,
        extensions: ['attacker-controlled-bytes'],
        operations: ops,
      } as never,
    );
    expect(out.id).toBe(expectedTxId());
  });

  it('returns the signature THIS key added, not a co-signer already on the tx', async () => {
    const other = 'deadbeef'.repeat(16);
    const out = await signOperations(
      resolveSigner(ops, 'alice'),
      wif,
      'alice',
      {
        ...header,
        signatures: [other],
        operations: ops,
      } as never,
    );
    expect(out.signature).toBeTruthy();
    expect(out.signature).not.toBe(other);
  });
});
