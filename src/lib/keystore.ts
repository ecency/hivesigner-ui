// Per-account key storage. Reads what the Nuxt app stored so existing users are
// not locked out, and writes a new format the React app owns.
//
// The `password` field of a stored account is one of:
//  - legacy plaintext:  hex(JSON(keys)) + "decrypted"        (no passcode)
//  - legacy encrypted:  lowercase hex of a triplesec v4 blob (needs passcode)
//  - new encrypted:     a JSON envelope, {v:1,...}           (needs passcode)
// A no-passcode account keeps using the legacy plaintext form (still readable
// by the old app during the transition). A passcode account is re-encrypted
// into the v1 envelope on its first successful unlock.

import { base64 } from '@scure/base';
import { scryptOffThread } from './kdf';
import { decryptTriplesec } from './triplesec';

export interface Keys {
  owner?: string;
  active?: string;
  posting?: string;
  memo?: string;
}

export type StoredFormat = 'plain' | 'triplesec' | 'v1';

const PLAIN_SUFFIX = 'decrypted';
// New-format KDF: deliberately stronger than triplesec's N=2^15.
const KDF = { N: 2 ** 17, r: 8, p: 1, dkLen: 32 } as const;

function encodeUtf8(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}
function decodeUtf8(b: Uint8Array): string {
  return new TextDecoder().decode(b);
}
function toHex(b: Uint8Array): string {
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}
function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++)
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

// WebCrypto's BufferSource type (TS 5.7+) rejects a Uint8Array whose buffer is
// only known to be ArrayBufferLike (it could be a SharedArrayBuffer). Ours are
// always ArrayBuffer-backed (scrypt / @scure/base / getRandomValues), so this
// re-views them with the concrete type, copying only in the unexpected case.
function buf(u: Uint8Array): Uint8Array<ArrayBuffer> {
  return (
    u.buffer instanceof ArrayBuffer ? u : new Uint8Array(u)
  ) as Uint8Array<ArrayBuffer>;
}

function parseKeys(json: string): Keys {
  const parsed = JSON.parse(json);
  if (!parsed || typeof parsed !== 'object')
    throw new Error('keystore: not a key object');
  return parsed as Keys;
}

/** Which of the three storage forms a `password` field is. */
export function detectFormat(field: string): StoredFormat {
  if (field.endsWith(PLAIN_SUFFIX)) return 'plain';
  if (field.startsWith('{')) return 'v1';
  return 'triplesec';
}

// --- legacy plaintext (no passcode) ------------------------------------------

export function encodePlain(keys: Keys): string {
  return toHex(encodeUtf8(JSON.stringify(keys))) + PLAIN_SUFFIX;
}

function decodePlain(field: string): Keys {
  const hex = field.slice(0, -PLAIN_SUFFIX.length);
  return parseKeys(decodeUtf8(fromHex(hex)));
}

// --- new encrypted envelope (v1): scrypt + WebCrypto AES-GCM ------------------

interface EnvelopeV1 {
  v: 1;
  kdf: { N: number; r: number; p: number };
  salt: string; // base64
  iv: string; // base64
  ct: string; // base64 (AES-GCM ciphertext incl. tag)
}

async function deriveAesKey(
  passcode: string,
  salt: Uint8Array,
  N: number,
  r: number,
  p: number,
) {
  const keyBytes = await scryptOffThread({
    password: encodeUtf8(passcode),
    salt,
    N,
    r,
    p,
    dkLen: 32,
  });
  return crypto.subtle.importKey(
    'raw',
    buf(keyBytes),
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptKeys(
  keys: Keys,
  passcode: string,
): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(passcode, salt, KDF.N, KDF.r, KDF.p);
  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: buf(iv) },
      key,
      buf(encodeUtf8(JSON.stringify(keys))),
    ),
  );
  const envelope: EnvelopeV1 = {
    v: 1,
    kdf: { N: KDF.N, r: KDF.r, p: KDF.p },
    salt: base64.encode(salt),
    iv: base64.encode(iv),
    ct: base64.encode(ct),
  };
  return JSON.stringify(envelope);
}

async function decryptV1(field: string, passcode: string): Promise<Keys> {
  const env = JSON.parse(field) as EnvelopeV1;
  if (env.v !== 1)
    throw new Error(`keystore: unsupported envelope version ${env.v}`);
  // N/r/p come from persisted data, and an absurd N (or a non-number) would
  // run the derivation for ever instead of failing; bound them to the range
  // we ever write (N = 2^17, r = 8, p = 1).
  const { N, r, p } = env.kdf;
  const pow2 = (n: unknown) =>
    typeof n === 'number' &&
    Number.isInteger(n) &&
    n > 1 &&
    (n & (n - 1)) === 0;
  if (!pow2(N) || N > 2 ** 18)
    throw new Error('keystore: unsupported key-derivation cost');
  if (!Number.isInteger(r) || r < 1 || r > 16)
    throw new Error('keystore: unsupported key-derivation block size');
  if (!Number.isInteger(p) || p < 1 || p > 4)
    throw new Error('keystore: unsupported key-derivation parallelism');
  const key = await deriveAesKey(
    passcode,
    base64.decode(env.salt),
    env.kdf.N,
    env.kdf.r,
    env.kdf.p,
  );
  let pt: ArrayBuffer;
  try {
    pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: buf(base64.decode(env.iv)) },
      key,
      buf(base64.decode(env.ct)),
    );
  } catch {
    throw new Error('keystore: wrong passcode');
  }
  return parseKeys(decodeUtf8(new Uint8Array(pt)));
}

// --- unified read -------------------------------------------------------------

/** Whether unlocking this stored account needs a passcode. */
export function isEncrypted(field: string): boolean {
  return detectFormat(field) !== 'plain';
}

/** Whether an unlock failed on the passcode itself (the v1 envelope's or the
    legacy triplesec message), not on a record that cannot be read at all. */
export function isWrongPasscode(e: unknown): boolean {
  return e instanceof Error && /wrong pass/i.test(e.message);
}

/**
 * Read an account's keys from its stored `password` field. `passcode` is
 * required for an encrypted account (triplesec or v1) and ignored for plaintext.
 * Throws 'keystore: wrong passcode' (or the triplesec equivalent) on a bad one.
 */
export async function readKeys(
  field: string,
  passcode?: string,
): Promise<Keys> {
  switch (detectFormat(field)) {
    case 'plain':
      return decodePlain(field);
    case 'triplesec': {
      if (!passcode) throw new Error('keystore: passcode required');
      return parseKeys(
        decodeUtf8(await decryptTriplesec(fromHex(field), passcode)),
      );
    }
    case 'v1':
      if (!passcode) throw new Error('keystore: passcode required');
      return decryptV1(field, passcode);
  }
}

/**
 * Produce the `password` field to persist. With a passcode, the new v1 envelope;
 * without one, the legacy plaintext form. Re-encrypting a legacy triplesec
 * account is just readKeys(old, passcode) then encryptKeys(keys, passcode).
 */
export async function writeKeys(
  keys: Keys,
  passcode?: string,
): Promise<string> {
  return passcode ? encryptKeys(keys, passcode) : encodePlain(keys);
}

/** True when a stored field is the old triplesec form and should be upgraded. */
export function needsUpgrade(field: string): boolean {
  return detectFormat(field) === 'triplesec';
}
