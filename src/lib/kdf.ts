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

/** How long a worker may take to start (its script and chunks loaded). */
export const START_MS = 10_000;
/** How long a started worker may take to answer: far more than a slow
    phone needs, so it only ends a worker that died without saying so. */
export const RUN_MS = 60_000;

/**
 * scrypt in a worker, so the page stays responsive for the second or more it
 * takes. On the page's own thread it froze everything, and a click made
 * meanwhile (Cancel, another page) waited in the queue until the unlock had
 * taken effect: WebKit hands a page each mouse event only once the previous
 * one is handled, so there it came after anything scheduled when the freeze
 * ended. Measured with real input in WebKit: 0 of 15 such clicks ran first.
 *
 * Runs inline where there is no worker (tests), it cannot start (its file
 * gone after a deploy), it does not start in time (a chunk that never
 * arrives) or it stops answering (ended by the system): slower to react,
 * never an unlock that fails or never ends.
 */
export async function scryptOffThread(job: KdfJob): Promise<Uint8Array> {
  if (typeof Worker === 'undefined') return inline(job);
  let worker: Worker;
  try {
    worker = new Worker(new URL('./scrypt.worker.ts', import.meta.url));
  } catch {
    return inline(job);
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const answer = await new Promise<{ key?: Uint8Array; error?: string }>(
      (resolve) => {
        // {} means the worker did not do it: the page does it after all.
        const giveUp = () => resolve({});
        const wait = (ms: number) => {
          clearTimeout(timer);
          timer = setTimeout(giveUp, ms);
        };
        wait(START_MS);
        worker.onmessage = (e) => {
          if (e.data?.ready) wait(RUN_MS);
          else resolve(e.data ?? {});
        };
        worker.onerror = (e) => {
          e.preventDefault();
          giveUp();
        };
        worker.onmessageerror = giveUp;
        worker.postMessage(job);
      },
    );
    if (answer.key) return answer.key;
    if (answer.error !== undefined) throw new Error(answer.error);
    return inline(job);
  } finally {
    clearTimeout(timer);
    worker.terminate();
  }
}
