import { describe, expect, it, vi } from 'vitest';
import { isChunkLoadError, reloadOnce } from './chunk-reload';

function memoryStore(): Storage {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    clear: () => data.clear(),
    key: () => null,
    get length() {
      return data.size;
    },
  };
}

describe('isChunkLoadError', () => {
  it('recognises the bundler chunk loader errors, JS and CSS', () => {
    const js = Object.assign(
      new Error(
        'Loading chunk 540 failed.\n(missing: https://hivesigner.test/static/js/async/540.x.js)',
      ),
      { name: 'ChunkLoadError' },
    );
    expect(isChunkLoadError(js)).toBe(true);
    // By message alone, in case a wrapper renamed the error.
    expect(isChunkLoadError(new Error('Loading chunk 540 failed.'))).toBe(true);
    // And by name alone, whatever a wrapper did to the message.
    expect(
      isChunkLoadError(
        Object.assign(new Error('something else'), { name: 'ChunkLoadError' }),
      ),
    ).toBe(true);
    expect(
      isChunkLoadError(new Error('Loading CSS chunk 12 failed.\n(/x.css)')),
    ).toBe(true);
  });

  it('leaves every other error to the normal path', () => {
    expect(
      isChunkLoadError(new Error('Cannot read properties of undefined')),
    ).toBe(false);
    expect(isChunkLoadError(new Error('Failed Loading chunk 1 failed'))).toBe(
      false,
    );
    expect(isChunkLoadError('Loading chunk 540 failed.')).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
    expect(isChunkLoadError({ message: 42 })).toBe(false);
  });
});

describe('reloadOnce', () => {
  it('reloads, then not again within a minute, then again later', () => {
    const store = memoryStore();
    const reload = vi.fn();
    expect(reloadOnce(1_000_000, () => store, reload)).toBe(true);
    expect(reloadOnce(1_030_000, () => store, reload)).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(reloadOnce(1_000_000 + 60_001, () => store, reload)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it('does not reload when it cannot remember doing so', () => {
    const reload = vi.fn();
    const blocked = () => {
      throw new DOMException('denied', 'SecurityError');
    };
    expect(reloadOnce(1, blocked, reload)).toBe(false);
    const readOnly = memoryStore();
    readOnly.setItem = () => {
      throw new DOMException('full', 'QuotaExceededError');
    };
    expect(reloadOnce(1, () => readOnly, reload)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it('ignores a garbage marker', () => {
    const store = memoryStore();
    store.setItem('hs_chunk_reload_at', 'nonsense');
    const reload = vi.fn();
    expect(reloadOnce(5, () => store, reload)).toBe(true);
  });

  it('is not blocked by a missing marker, even with a clock near zero', () => {
    const reload = vi.fn();
    expect(reloadOnce(1, () => memoryStore(), reload)).toBe(true);
  });

  it('is not blocked by a marker from a clock that has since moved back', () => {
    const store = memoryStore();
    store.setItem('hs_chunk_reload_at', String(10_000_000));
    const reload = vi.fn();
    expect(reloadOnce(10_000_000 - 10 * 60_000, () => store, reload)).toBe(
      true,
    );
  });
});
