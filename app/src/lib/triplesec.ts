// Decrypt a triplesec v4 blob, the format the Nuxt app used to store encrypted
// accounts. This is read-only and exists only so existing users are not locked
// out: on first unlock the keystore re-encrypts with its own format (keystore.ts).
//
// The triplesec npm package pulls Buffer at module scope, so it is reimplemented
// here with @noble. Every constant below (v4 layout, scrypt params, the split
// HMAC key, the SHA3 variant, the layer order) was verified against a blob the
// real triplesec 4.0.3 produced; see triplesec.test.ts.
import { ctr } from '@noble/ciphers/aes.js';
import { xsalsa20 } from '@noble/ciphers/salsa.js';
import { hmac } from '@noble/hashes/hmac.js';
import { scrypt } from '@noble/hashes/scrypt.js';
import { sha512 } from '@noble/hashes/sha2.js';
import { sha3_512 } from '@noble/hashes/sha3.js';

// v4 layout (bytes): magic(4) version(4) salt(16) hmac(128) aesIv(16) aesCt(rest)
const MAGIC = 0x1c94d7de;
const HEADER_LEN = 8;
const SALT_LEN = 16;
const HMAC_LEN = 128; // HMAC-SHA512 (64) ++ HMAC-SHA3-512 (64)
const AES_IV_LEN = 16;
const KEY_MATERIAL_LEN = 160; // hmac(96) + aes(32) + salsa20(32)
const MIN_LEN = HEADER_LEN + SALT_LEN + HMAC_LEN + AES_IV_LEN;

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Decrypt a triplesec v4 blob. Throws on a bad version, HMAC mismatch (wrong
 * password or tampering) or malformed input. Returns the plaintext bytes. */
export function decryptTriplesec(
  blob: Uint8Array,
  password: string,
): Uint8Array {
  if (blob.length < MIN_LEN) throw new Error('triplesec: blob too short');
  const view = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
  if (view.getUint32(0) !== MAGIC) throw new Error('triplesec: bad magic');
  const version = view.getUint32(4);
  if (version !== 4)
    throw new Error(`triplesec: unsupported version ${version}`);

  const header = blob.subarray(0, HEADER_LEN);
  const salt = blob.subarray(HEADER_LEN, HEADER_LEN + SALT_LEN);
  const receivedHmac = blob.subarray(
    HEADER_LEN + SALT_LEN,
    HEADER_LEN + SALT_LEN + HMAC_LEN,
  );
  const body = blob.subarray(HEADER_LEN + SALT_LEN + HMAC_LEN); // aesIv ++ aesCt

  // Standard scrypt (N=2^15, r=8, p=1) -> 160 bytes, split hmac/aes/salsa20.
  const km = scrypt(new TextEncoder().encode(password), salt, {
    N: 2 ** 15,
    r: 8,
    p: 1,
    dkLen: KEY_MATERIAL_LEN,
  });
  const hmacKey = km.subarray(0, 96);
  const aesKey = km.subarray(96, 128);
  const salsaKey = km.subarray(128, 160);

  // HMAC covers header + salt + body; the 96-byte key is split 48/48 across the
  // two hashes (SHA512 then FIPS-202 SHA3-512).
  const signed = new Uint8Array(header.length + salt.length + body.length);
  signed.set(header, 0);
  signed.set(salt, header.length);
  signed.set(body, header.length + salt.length);
  const computed = new Uint8Array(128);
  computed.set(hmac(sha512, hmacKey.subarray(0, 48), signed), 0);
  computed.set(hmac(sha3_512, hmacKey.subarray(48, 96), signed), 64);
  if (!timingSafeEqual(computed, receivedHmac)) {
    throw new Error('triplesec: signature mismatch (wrong password?)');
  }

  const aesIv = body.subarray(0, AES_IV_LEN);
  const aesCt = body.subarray(AES_IV_LEN);
  // AES-256-CTR outer layer -> XSalsa20 IV (24) ++ XSalsa20 ciphertext.
  const inner = ctr(aesKey, aesIv).decrypt(aesCt);
  const xIv = inner.subarray(0, 24);
  const xCt = inner.subarray(24);
  return xsalsa20(salsaKey, xIv, xCt);
}
