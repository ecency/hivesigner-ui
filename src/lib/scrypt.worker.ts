// The keystore's key derivation, on a thread of its own (see kdf.ts).
import { scrypt } from '@noble/hashes/scrypt.js';
import type { KdfJob } from './kdf';

self.onmessage = (e: MessageEvent<KdfJob>) => {
  const { password, salt, N, r, p, dkLen } = e.data;
  try {
    self.postMessage({ key: scrypt(password, salt, { N, r, p, dkLen }) });
  } catch (err) {
    self.postMessage({
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
