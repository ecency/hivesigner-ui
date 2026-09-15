import { describe, expect, it } from 'vitest';
import {
  createSignedMessage,
  decodeToken,
  encodeToken,
  matchAuthority,
} from './message-token';

// A message-signing token produced by the Nuxt app's exact algorithm using
// @hiveio/dhive (login hivesignertest/password123, message {message:'hello'},
// timestamp 1700000000). If decodeToken recovers the right signer from it, the
// digest formula and b64u handling match the deployed app byte for byte.
const DHIVE_TOKEN =
  'eyJzaWduZWRfbWVzc2FnZSI6eyJtZXNzYWdlIjoiaGVsbG8ifSwiYXV0aG9ycyI6WyJoaXZlc2lnbmVydGVzdCJdLCJ0aW1lc3RhbXAiOjE3MDAwMDAwMDAsInNpZ25hdHVyZXMiOlsiMWY2NDFmZWM0OTczOWI0ZTViNzE3NjZjZWMxMzRmNTdmYTJlMGU3YjNjMjdmZWY4YTQ3ZTA2MDJlYjcwMjM3OWEyMWJmOGEyY2U5NGFmYTM2NjBjY2I1MDQyZDgxNmE4NzFlOWQ3NWJiZmIwMmM4ZmQwZDkzOWI4OTRlOWNjZjhmMyJdLCJhdXRob3JpdHkiOiJwb3N0aW5nIn0.';
const POSTING_WIF = '5KT3LKgkovUYzQVSX3WpEGZ4rdazyotpi6piwvdFMxx9eiv8gRL';
const POSTING_PUB = 'STM4tb8Quiasc1qFoxqAkA72zug5bTUbZxAFBzDV43LXoBBRZdXkS';

describe('message token', () => {
  it('recovers the correct signer from a dhive-produced token', () => {
    const v = decodeToken(DHIVE_TOKEN);
    expect(v).not.toBeNull();
    expect(v!.signer).toBe(POSTING_PUB);
    expect(v!.payload.signed_message).toEqual({ message: 'hello' });
    expect(v!.payload.authors).toEqual(['hivesignertest']);
  });

  it('round-trips create -> encode -> decode back to the same signer', () => {
    const payload = createSignedMessage(
      { message: 'gm' },
      'hivesignertest',
      POSTING_WIF,
      'posting',
    );
    const v = decodeToken(encodeToken(payload));
    expect(v!.signer).toBe(POSTING_PUB);
    expect(v!.payload.signed_message).toEqual({ message: 'gm' });
  });

  it('signs an object body with stable key order (oauth-style {type, app})', () => {
    const payload = createSignedMessage(
      { type: 'posting', app: 'ecency.app' },
      'hivesignertest',
      POSTING_WIF,
      'posting',
    );
    expect(decodeToken(encodeToken(payload))!.signer).toBe(POSTING_PUB);
  });

  it('returns null for a malformed or incomplete token', () => {
    expect(decodeToken('!!!not-base64!!!')).toBeNull();
    // valid b64u JSON but missing signatures
    const bad = encodeToken({
      signed_message: { message: 'x' },
      authors: ['a'],
      timestamp: 1,
      signatures: [],
    });
    expect(decodeToken(bad)).toBeNull();
  });
});

describe('matchAuthority', () => {
  const account = {
    owner: { key_auths: [['STM1owner', 1]] as [string, number][] },
    active: { key_auths: [['STM1active', 1]] as [string, number][] },
    posting: { key_auths: [[POSTING_PUB, 1]] as [string, number][] },
    memo_key: 'STM1memo',
  };

  it('finds the role a recovered key belongs to', () => {
    expect(matchAuthority(account, POSTING_PUB)).toBe('posting');
    expect(matchAuthority(account, 'STM1owner')).toBe('owner');
    expect(matchAuthority(account, 'STM1memo')).toBe('memo');
  });

  it('returns null for a key on no authority', () => {
    expect(matchAuthority(account, 'STM1stranger')).toBeNull();
  });
});
