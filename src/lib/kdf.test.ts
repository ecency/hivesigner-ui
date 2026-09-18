import { scrypt } from '@noble/hashes/scrypt.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type KdfJob, scryptOffThread } from './kdf';

const job: KdfJob = {
  password: new TextEncoder().encode('passcode'),
  salt: new Uint8Array(16).fill(7),
  N: 2 ** 4,
  r: 8,
  p: 1,
  dkLen: 32,
};
const expected = scrypt(job.password, job.salt, {
  N: 16,
  r: 8,
  p: 1,
  dkLen: 32,
});

/** A Worker stand-in; `run` is what the worker thread does with a job. */
function stubWorker(run: (w: FakeWorker, data: KdfJob) => void) {
  const made: FakeWorker[] = [];
  class FakeWorker {
    onmessage: ((e: { data: unknown }) => void) | null = null;
    onerror: ((e: { preventDefault(): void }) => void) | null = null;
    terminated = false;
    jobs = 0;
    constructor() {
      made.push(this);
    }
    postMessage(data: KdfJob) {
      this.jobs++;
      setTimeout(() => run(this, data), 0);
    }
    terminate() {
      this.terminated = true;
    }
  }
  vi.stubGlobal('Worker', FakeWorker);
  return made;
}
type FakeWorker = {
  onmessage: ((e: { data: unknown }) => void) | null;
  onerror: ((e: { preventDefault(): void }) => void) | null;
  terminated: boolean;
  jobs: number;
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('scryptOffThread', () => {
  it('derives in the worker, with the worker module itself, and ends it', async () => {
    // The real worker module, answering through the stand-in.
    // `location` too: the test transform resolves the worker's URL with it.
    const scope: {
      location: Location;
      onmessage?: (e: { data: KdfJob }) => void;
      postMessage?: (m: unknown) => void;
    } = { location: window.location };
    vi.stubGlobal('self', scope);
    await import('./scrypt.worker');
    const made = stubWorker((w, data) => {
      scope.postMessage = (m) => w.onmessage?.({ data: m });
      scope.onmessage?.({ data });
    });
    const key = await scryptOffThread(job);
    expect(key).toEqual(expected);
    expect(made).toHaveLength(1);
    expect(made[0].jobs).toBe(1);
    expect(made[0].terminated).toBe(true);
  });

  it('derives on the page when the worker does not load', async () => {
    const made = stubWorker((w) => w.onerror?.({ preventDefault() {} }));
    expect(await scryptOffThread(job)).toEqual(expected);
    expect(made[0].terminated).toBe(true);
  });

  it('derives on the page when no worker can be made', async () => {
    vi.stubGlobal(
      'Worker',
      class {
        constructor() {
          throw new Error('blocked');
        }
      },
    );
    expect(await scryptOffThread(job)).toEqual(expected);
  });

  it('fails as the worker says when the derivation itself fails', async () => {
    stubWorker((w) => w.onmessage?.({ data: { error: 'boom' } }));
    await expect(scryptOffThread(job)).rejects.toThrow('boom');
  });
});
