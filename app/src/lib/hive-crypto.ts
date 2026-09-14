// Browser-native Hive key handling: WIF decode, public-key (STM address)
// derivation, and canonical message signing / recovery.
//
// dhive is the reference but it reads Buffer at module scope, which the
// node-globals guard rejects. These primitives use @noble (secp256k1, sha256,
// ripemd160) and @scure/base (base58) instead, and are cross-checked against
// dhive-produced vectors in the tests. This is the foundation the login
// credential check, message signing and (later) transaction signing build on.
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { ripemd160 } from '@noble/hashes/legacy.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { base58 } from '@scure/base';

export const ADDRESS_PREFIX = 'STM';

function doubleSha256(bytes: Uint8Array): Uint8Array {
  return sha256(sha256(bytes));
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++)
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/** Decode a WIF private key to its 32 raw bytes, verifying the checksum. */
export function privateKeyFromWif(wif: string): Uint8Array {
  const decoded = base58.decode(wif);
  // version(1) + key(32) + checksum(4)
  if (decoded.length !== 37 || decoded[0] !== 0x80) {
    throw new Error('Invalid WIF');
  }
  const payload = decoded.slice(0, 33);
  const checksum = decoded.slice(33);
  const expected = doubleSha256(payload).slice(0, 4);
  for (let i = 0; i < 4; i++) {
    if (checksum[i] !== expected[i]) throw new Error('Invalid WIF checksum');
  }
  return payload.slice(1);
}

/** Encode 32 raw private-key bytes as a WIF string. */
export function wifFromPrivateKey(key: Uint8Array): string {
  if (key.length !== 32) throw new Error('Private key must be 32 bytes');
  const payload = new Uint8Array(33);
  payload[0] = 0x80;
  payload.set(key, 1);
  const checksum = doubleSha256(payload).slice(0, 4);
  const full = new Uint8Array(37);
  full.set(payload);
  full.set(checksum, 33);
  return base58.encode(full);
}

/** A compressed public key (33 bytes) to its STM address string. */
export function publicKeyToAddress(pub: Uint8Array): string {
  const checksum = ripemd160(pub).slice(0, 4);
  const full = new Uint8Array(pub.length + 4);
  full.set(pub);
  full.set(checksum, pub.length);
  return ADDRESS_PREFIX + base58.encode(full);
}

export function publicKeyFromPrivate(key: Uint8Array): string {
  return publicKeyToAddress(secp256k1.getPublicKey(key, true));
}

export function publicKeyFromWif(wif: string): string {
  return publicKeyFromPrivate(privateKeyFromWif(wif));
}

// graphene canonical signature: the high bit of r and s must be clear.
function isCanonical(rs: Uint8Array): boolean {
  return (
    !(rs[0] & 0x80) &&
    !(rs[0] === 0 && !(rs[1] & 0x80)) &&
    !(rs[32] & 0x80) &&
    !(rs[32] === 0 && !(rs[33] & 0x80))
  );
}

/**
 * Sign a 32-byte digest with a WIF, returning the 65-byte Hive signature hex
 * (recovery+31, r, s). Retries with extra entropy until the signature is
 * canonical, as graphene requires.
 */
export function signDigest(digest: Uint8Array, wif: string): string {
  const key = privateKeyFromWif(wif);
  for (let nonce = 0; nonce < 256; nonce++) {
    const extraEntropy =
      nonce === 0 ? undefined : fromHex(nonce.toString(16).padStart(64, '0'));
    // prehash: false — the digest is already the final hash; Hive signs it
    // directly and does not re-hash (noble's default would re-sha256 it).
    const sig = secp256k1.sign(digest, key, {
      format: 'recovered',
      prehash: false,
      extraEntropy,
    });
    const recovery = sig[0];
    const rs = sig.slice(1);
    if (isCanonical(rs)) {
      const out = new Uint8Array(65);
      out[0] = recovery + 31; // 27 + 4 (compressed)
      out.set(rs, 1);
      return toHex(out);
    }
  }
  throw new Error('Could not produce a canonical signature');
}

/** Recover the signer's STM address from a 65-byte Hive signature hex. */
export function recoverAddress(
  signatureHex: string,
  digest: Uint8Array,
): string {
  const sig = fromHex(signatureHex);
  if (sig.length !== 65) throw new Error('Invalid signature length');
  const recovered = new Uint8Array(65);
  recovered[0] = sig[0] - 31;
  recovered.set(sig.slice(1), 1);
  const pub = secp256k1.recoverPublicKey(recovered, digest, {
    format: 'recovered',
    prehash: false,
  });
  return publicKeyToAddress(pub);
}

export function verifyDigest(
  signatureHex: string,
  digest: Uint8Array,
  address: string,
): boolean {
  try {
    return recoverAddress(signatureHex, digest) === address;
  } catch {
    return false;
  }
}

/** sha256 of a UTF-8 string, the digest Hive message signing uses. */
export function sha256Message(message: string): Uint8Array {
  return sha256(new TextEncoder().encode(message));
}

export type KeyRole = 'owner' | 'active' | 'posting' | 'memo';

export interface AuthorityLike {
  key_auths: [string, number][];
}

/** Whether a public address is one of an authority's keys. */
export function authorityHasKey(
  authority: AuthorityLike | undefined,
  address: string,
): boolean {
  return !!authority?.key_auths?.some(([key]) => key === address);
}
