import { scrypt } from '@noble/hashes/scrypt.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Every derivation on the page, with whether the stand-in worker had been
// ended by then.
const h = vi.hoisted(() => ({
  pageRuns: [] as boolean[],
  current: null as null | { terminated: boolean },
}));
vi.mock('@noble/hashes/scrypt.js', async (importOriginal) => {
  const real = await importOriginal<typeof import('@noble/hashes/scrypt.js')>();
  return {
    ...real,
    scrypt: (...args: Parameters<typeof real.scrypt>) => {
      h.pageRuns.push(h.current?.terminated ?? true);
      return real.scrypt(...args);
    },
  };
});

import { type KdfJob, RUN_MS, START_MS, scryptOffThread } from './kdf';

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
    onmessageerror: (() => void) | null = null;
    terminated = false;
    jobs = 0;
    constructor() {
      made.push(this);
      h.current = this;
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
  onmessageerror: (() => void) | null;
  terminated: boolean;
  jobs: number;
};

afterEach(() => {
  h.current = null;
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('scryptOffThread', () => {
  it('derives in the worker, with the worker module itself, and ends it', async () => {
    // The real worker module, answering through the stand-in.
    const sent: unknown[] = [];
    // `location` too: the test transform resolves the worker's URL with it.
    const scope: {
      location: Location;
      onmessage?: (e: { data: KdfJob }) => void;
      postMessage: (m: unknown) => void;
    } = { location: window.location, postMessage: (m) => sent.push(m) };
    vi.stubGlobal('self', scope);
    await import('./scrypt.worker');
    // It says when it is loaded and listening.
    expect(sent).toEqual([{ ready: true }]);
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

  it('derives on the page when the worker does not start in time', async () => {
    vi.useFakeTimers();
    // A chunk of its own that never arrives: no word from it at all.
    const made = stubWorker(() => {});
    const key = scryptOffThread(job);
    await vi.advanceTimersByTimeAsync(START_MS);
    expect(await key).toEqual(expected);
    expect(made[0].terminated).toBe(true);
  });

  it('gives a started worker the time a slow phone needs', async () => {
    vi.useFakeTimers();
    const fromWorker = new Uint8Array([9]);
    const made = stubWorker((w) => {
      w.onmessage?.({ data: { ready: true } });
      setTimeout(
        () => w.onmessage?.({ data: { key: fromWorker } }),
        START_MS + 5_000,
      );
    });
    const key = scryptOffThread(job);
    await vi.advanceTimersByTimeAsync(START_MS + 5_000);
    expect(await key).toBe(fromWorker);
    expect(made[0].terminated).toBe(true);
  });

  it('derives on the page when a started worker stops answering', async () => {
    vi.useFakeTimers();
    const made = stubWorker((w) => w.onmessage?.({ data: { ready: true } }));
    let settled = false;
    const key = scryptOffThread(job).finally(() => {
      settled = true;
    });
    await vi.advanceTimersByTimeAsync(START_MS);
    expect(settled).toBe(false);
    h.pageRuns = [];
    await vi.advanceTimersByTimeAsync(RUN_MS);
    expect(await key).toEqual(expected);
    // Ended before the page derived: not two derivations at once.
    expect(h.pageRuns).toEqual([true]);
    expect(made[0].terminated).toBe(true);
  });

  it('derives on the page when the job cannot reach the worker', async () => {
    vi.useFakeTimers();
    const made = stubWorker((w) => w.onmessageerror?.());
    let settled = false;
    const key = scryptOffThread(job).finally(() => {
      settled = true;
    });
    // At once, not when the start timer runs out.
    await vi.advanceTimersByTimeAsync(1);
    expect(settled).toBe(true);
    expect(await key).toEqual(expected);
    expect(made[0].terminated).toBe(true);
  });

  it('fails as the worker says when the derivation itself fails', async () => {
    stubWorker((w) => w.onmessage?.({ data: { error: 'boom' } }));
    await expect(scryptOffThread(job)).rejects.toThrow('boom');
  });
});
