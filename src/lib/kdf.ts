import { scrypt } from '@noble/hashes/scrypt.js';

export interface KdfJob {
  password: Uint8Array;
  salt: Uint8Array;
  N: number;
  r: number;
  p: number;
  dkLen: number;
}

const inline = ({ password, salt, N, r, p, dkLen }: KdfJob) =>
  scrypt(password, salt, { N, r, p, dkLen });

/**
 * scrypt in a worker, so the page stays responsive for the second or more it
 * takes. On the page's own thread it froze everything, and a click made
 * meanwhile (Cancel, another page) waited in the queue until the unlock had
 * taken effect: WebKit hands a page each mouse event only once the previous
 * one is handled, so there it came after anything scheduled when the freeze
 * ended. Measured with real input in WebKit: 0 of 15 such clicks ran first.
 *
 * Runs inline where there is no worker (tests) or it cannot start (its file
 * gone after a deploy): slower to react, never a failed unlock.
 */
export async function scryptOffThread(job: KdfJob): Promise<Uint8Array> {
  if (typeof Worker === 'undefined') return inline(job);
  let worker: Worker;
  try {
    worker = new Worker(new URL('./scrypt.worker.ts', import.meta.url));
  } catch {
    return inline(job);
  }
  try {
    const answer = await new Promise<{ key?: Uint8Array; error?: string }>(
      (resolve) => {
        worker.onmessage = (e) => resolve(e.data);
        // The worker did not load or run: the page does it after all.
        worker.onerror = (e) => {
          e.preventDefault();
          resolve({});
        };
        worker.postMessage(job);
      },
    );
    if (answer.key) return answer.key;
    if (answer.error !== undefined) throw new Error(answer.error);
    return inline(job);
  } finally {
    worker.terminate();
  }
}
