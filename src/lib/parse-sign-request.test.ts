import { describe, expect, it } from 'vitest';
import { encodeOp, encodeTx } from './hive-uri';
import { parseSignRequest } from './parse-sign-request';

describe('parseSignRequest — legacy /sign/<op>?params', () => {
  it('builds a vote op, applying the schema default weight', () => {
    const req = parseSignRequest(
      'vote',
      { author: 'ecency', permlink: 'x', weight: '10000' },
      1,
    );
    expect(req?.operations).toEqual([
      [
        'vote',
        { voter: '__signer', author: 'ecency', permlink: 'x', weight: 10000 },
      ],
    ]);
    expect(req?.noBroadcast).toBe(false);
  });

  it('formats a transfer amount and carries redirect_uri as the callback', () => {
    const req = parseSignRequest(
      'transfer',
      {
        to: 'bob',
        amount: '10 HIVE',
        memo: 'hi',
        redirect_uri: 'https://ecency.com/cb',
      },
      1,
    );
    expect(req?.operations[0]).toEqual([
      'transfer',
      { from: '__signer', to: 'bob', amount: '10.000 HIVE', memo: 'hi' },
    ]);
    expect(req?.callback).toBe('https://ecency.com/cb');
  });

  it('maps a camelCase path to a snake_case op name', () => {
    const req = parseSignRequest(
      'transferToVesting',
      { to: 'bob', amount: '1 HIVE' },
      1,
    );
    expect(req?.operations[0][0]).toBe('transfer_to_vesting');
  });

  it('keeps a non-Latin1 memo intact (the #96 path)', () => {
    const req = parseSignRequest(
      'transfer',
      { to: 'bob', amount: '1 HIVE', memo: 'gift — 🎁' },
      1,
    );
    expect(req?.operations[0][1].memo).toBe('gift — 🎁');
  });

  it('returns null for an unknown operation', () => {
    expect(parseSignRequest('not_an_op', { a: 'b' }, 1)).toBeNull();
  });

  it('preserves weight=0 as an unvote instead of the default upvote', () => {
    // Regression: a numeric 0 (from JSON-parsed search) would be treated as
    // empty and defaulted to 10000. With a raw string it stays 0.
    const req = parseSignRequest(
      'vote',
      { author: 'a', permlink: 'p', weight: '0' },
      1,
    );
    expect(req?.operations[0][1].weight).toBe(0);
  });

  it('flags an HP amount as rate-dependent, and a HIVE amount as not', () => {
    expect(
      parseSignRequest('transfer', { to: 'b', amount: '1 HP' }, 2)?.hpDependent,
    ).toBe(true);
    expect(
      parseSignRequest('transfer', { to: 'b', amount: '1 HIVE' }, 2)
        ?.hpDependent,
    ).toBe(false);
  });

  it('keeps a custom_json json payload as a string', () => {
    const req = parseSignRequest(
      'custom_json',
      { id: 'follow', json: JSON.stringify({ type: 'follow' }) },
      1,
    );
    expect(typeof req?.operations[0][1].json).toBe('string');
  });
});

describe('parseSignRequest — /sign/op/<b64>', () => {
  it('decodes an encoded op and its no_broadcast flag', () => {
    const uri = encodeOp(
      ['vote', { voter: 'alice', author: 'a', permlink: 'p', weight: 5000 }],
      {
        no_broadcast: true,
      },
    );
    // strip the leading hive://sign/ to get the splat + query the route receives
    const rest = uri.replace('hive://sign/', '');
    const [path, qs] = rest.split('?');
    const query = Object.fromEntries(new URLSearchParams(qs));
    const req = parseSignRequest(path, query, 1);
    expect(req?.operations[0]).toEqual([
      'vote',
      { voter: 'alice', author: 'a', permlink: 'p', weight: 5000 },
    ]);
    expect(req?.noBroadcast).toBe(true);
  });

  it('keeps an encoded weight:0 (number) as an unvote, not a full upvote', () => {
    // The op is JSON so weight is a real number 0, not a string.
    const uri = encodeOp([
      'vote',
      { voter: 'alice', author: 'a', permlink: 'p', weight: 0 },
    ]);
    const path = uri.replace('hive://sign/', '');
    const req = parseSignRequest(path, {}, 1);
    expect(req?.operations[0][1].weight).toBe(0);
  });

  it('drops a non-http(s) callback (javascript:) so it is never redirected to', () => {
    const uri = encodeOp(['vote', { author: 'a', permlink: 'p', weight: 1 }], {
      callback: 'javascript:alert(1)',
    });
    const path = uri.replace('hive://sign/', '');
    const [p, qs] = path.split('?');
    const req = parseSignRequest(
      p,
      Object.fromEntries(new URLSearchParams(qs)),
      1,
    );
    expect(req?.callback).toBeUndefined();
  });

  it('keeps an https callback', () => {
    const uri = encodeOp(['vote', { author: 'a', permlink: 'p', weight: 1 }], {
      callback: 'https://ecency.com/cb',
    });
    const path = uri.replace('hive://sign/', '');
    const [p, qs] = path.split('?');
    const req = parseSignRequest(
      p,
      Object.fromEntries(new URLSearchParams(qs)),
      1,
    );
    expect(req?.callback).toBe('https://ecency.com/cb');
  });

  it('preserves an owner change on an encoded account_update2', () => {
    const owner = {
      weight_threshold: 1,
      account_auths: [],
      key_auths: [['STM1', 1]],
    };
    const uri = encodeOp(['account_update2', { account: 'a', owner }]);
    const path = uri.replace('hive://sign/', '');
    const req = parseSignRequest(path, {}, 1);
    // The owner field survives schema processing (it is no longer dropped).
    expect(req?.operations[0][1].owner).toEqual(owner);
  });
});

describe('parseSignRequest — /sign/tx preserved envelope', () => {
  it('exposes preservedTx for a tx form (real ref fields), not for op form', () => {
    const tx = {
      ref_block_num: 1234,
      ref_block_prefix: 5678,
      expiration: '2030-01-01T00:00:00',
      extensions: [],
      operations: [
        ['vote', { voter: 'alice', author: 'a', permlink: 'p', weight: 1 }],
      ],
    };
    const uri: string = encodeTx(tx);
    const path = uri.replace('hive://sign/', '');
    const req = parseSignRequest(path, {}, 1);
    expect(req?.preservedTx?.ref_block_num).toBe(1234);
    expect(req?.preservedTx?.expiration).toBe('2030-01-01T00:00:00');

    // An op form has no preserved tx (its ref fields are placeholders).
    const opReq = parseSignRequest(
      'vote',
      { author: 'a', permlink: 'p', weight: '1' },
      1,
    );
    expect(opReq?.preservedTx).toBeUndefined();
  });
});

describe('non-finite numbers are refused, not signed as 0', () => {
  it('rejects a vote whose weight does not parse', () => {
    // parseInt('abc') is NaN and DataView.setInt16(NaN) writes 0, so this used to
    // render "Upvote ... NaN%" and sign weight 0, which REMOVES an existing vote.
    expect(
      parseSignRequest(
        'vote',
        { author: 'a', permlink: 'p', weight: 'abc' },
        1,
      ),
    ).toBeNull();
  });

  it('still accepts a well-formed weight, including 0', () => {
    const up = parseSignRequest(
      'vote',
      { author: 'a', permlink: 'p', weight: '10000' },
      1,
    );
    expect(up?.operations[0][1].weight).toBe(10000);
    const unvote = parseSignRequest(
      'vote',
      { author: 'a', permlink: 'p', weight: '0' },
      1,
    );
    expect(unvote?.operations[0][1].weight).toBe(0);
  });
});
