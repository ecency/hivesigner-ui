import { describe, expect, it } from 'vitest';
import {
  b64uDecode,
  b64uEncode,
  decode,
  encodeOp,
  encodeOps,
  type Operation,
  resolveCallback,
} from './hive-uri';

describe('base64url', () => {
  it('round-trips UTF-8 including an em dash and emoji (#96)', () => {
    const s = 'Body — é 🙂';
    expect(b64uDecode(b64uEncode(s))).toBe(s);
  });

  it('uses . / - / _ instead of = + /', () => {
    const enc = b64uEncode('any carnal pleasure.');
    expect(enc).not.toMatch(/[+/=]/);
  });
});

describe('decode', () => {
  it('round-trips a single op through encodeOp', () => {
    const op: Operation = [
      'vote',
      { voter: 'alice', author: 'ecency', permlink: 'x', weight: 10000 },
    ];
    const uri = encodeOp(op);
    const { tx } = decode(uri);
    expect(tx.operations).toEqual([op]);
    expect(tx.ref_block_num).toBe('__ref_block_num');
  });

  it('decodes multiple ops and the cb / nb / s params', () => {
    const ops: Operation[] = [
      ['vote', { author: 'a', permlink: 'p', weight: 1 }],
      [
        'custom_json',
        {
          id: 'x',
          json: '{}',
          required_auths: [],
          required_posting_auths: ['a'],
        },
      ],
    ];
    const uri = encodeOps(ops, {
      callback: 'https://app.test/cb',
      no_broadcast: true,
      signer: 'alice',
    });
    const { tx, params } = decode(uri);
    expect(tx.operations).toEqual(ops);
    expect(params.callback).toBe('https://app.test/cb');
    expect(params.no_broadcast).toBe(true);
    expect(params.signer).toBe('alice');
  });

  it('carries a callback memo with an em dash intact', () => {
    const uri = encodeOp(['vote', { weight: 1 }], {
      callback: 'https://app.test/cb?m=a—b',
    });
    expect(decode(uri).params.callback).toBe('https://app.test/cb?m=a—b');
  });

  it('rejects a non-hive protocol and an unknown action', () => {
    expect(() => decode('http://sign/op/x')).toThrow(/Invalid protocol/);
    // A validly-encoded payload under an unknown action reaches the action check.
    const payload = b64uEncode(JSON.stringify([['vote', {}]]));
    expect(() => decode(`hive://sign/nope/${payload}`)).toThrow(
      /Invalid signing action/,
    );
  });

  it('throws Invalid payload on a malformed body', () => {
    expect(() => decode('hive://sign/op/!!!not-base64!!!')).toThrow(
      /Invalid payload/,
    );
  });
});

describe('resolveCallback', () => {
  it('fills known templates and blanks the missing ones', () => {
    const out = resolveCallback('https://a/cb?s={{sig}}&i={{id}}&b={{block}}', {
      sig: 'S',
      id: 'I',
    });
    expect(out).toBe('https://a/cb?s=S&i=I&b=');
  });

  it('leaves a template-less url untouched', () => {
    expect(resolveCallback('https://a/cb', {})).toBe('https://a/cb');
  });
});
