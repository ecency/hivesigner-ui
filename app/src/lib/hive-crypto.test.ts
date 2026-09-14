import { describe, expect, it } from 'vitest';
import {
  authorityHasKey,
  privateKeyFromWif,
  publicKeyFromWif,
  recoverAddress,
  sha256Message,
  signDigest,
  verifyDigest,
  wifFromPrivateKey,
} from './hive-crypto';

// Cross-tool vectors generated with @hiveio/dhive (PrivateKey.fromLogin
// 'hivesignertest' / 'password123' / 'posting') — a deterministic throwaway
// key, not a real account. If these pass, this browser-native module is
// byte-compatible with Hive's own key derivation and signatures.
const WIF = '5KT3LKgkovUYzQVSX3WpEGZ4rdazyotpi6piwvdFMxx9eiv8gRL';
const PUB = 'STM4tb8Quiasc1qFoxqAkA72zug5bTUbZxAFBzDV43LXoBBRZdXkS';
const MESSAGE = 'hivesigner message signing test';
// A canonical signature dhive produced for sha256(MESSAGE) with WIF.
const DHIVE_SIG =
  '1f13144f105dc61bebd0890f3ef3c59fccf7d8c000d1fce2085dac58d097dc8ed3416f30e43ca77554e7a5fe1725237db9f128f4d78c82889d2afffb23da4f361d';

describe('WIF and public key', () => {
  it('derives the same STM address as dhive for a known WIF', () => {
    expect(publicKeyFromWif(WIF)).toBe(PUB);
  });

  it('round-trips a WIF through decode and encode', () => {
    expect(wifFromPrivateKey(privateKeyFromWif(WIF))).toBe(WIF);
  });

  it('rejects a corrupted WIF', () => {
    expect(() => privateKeyFromWif(`${WIF.slice(0, -1)}X`)).toThrow();
  });
});

describe('signing', () => {
  const digest = sha256Message(MESSAGE);

  it('recovers the signer address from a dhive-produced signature', () => {
    expect(recoverAddress(DHIVE_SIG, digest)).toBe(PUB);
    expect(verifyDigest(DHIVE_SIG, digest, PUB)).toBe(true);
  });

  it('produces a signature that recovers back to the same address', () => {
    const sig = signDigest(digest, WIF);
    expect(sig).toHaveLength(130); // 65 bytes hex
    expect(recoverAddress(sig, digest)).toBe(PUB);
    expect(verifyDigest(sig, digest, PUB)).toBe(true);
  });

  it('produces canonical signatures (high bit of r and s clear)', () => {
    for (let i = 0; i < 5; i++) {
      const sig = signDigest(sha256Message(`msg ${i}`), WIF);
      const r0 = Number.parseInt(sig.slice(2, 4), 16);
      const s0 = Number.parseInt(sig.slice(66, 68), 16);
      expect(r0 & 0x80).toBe(0);
      expect(s0 & 0x80).toBe(0);
    }
  });

  it('fails verification against the wrong address', () => {
    expect(
      verifyDigest(
        DHIVE_SIG,
        digest,
        'STM8thisIsNotTheSignerKeyxxxxxxxxxxxxxxxxxxxxxxxxx',
      ),
    ).toBe(false);
  });
});

describe('authorityHasKey', () => {
  it('detects a key present in an authority', () => {
    const authority = { key_auths: [[PUB, 1]] as [string, number][] };
    expect(authorityHasKey(authority, PUB)).toBe(true);
    expect(authorityHasKey(authority, 'STM1other')).toBe(false);
    expect(authorityHasKey(undefined, PUB)).toBe(false);
  });
});
