// Recovery for a lazily loaded route whose file could not be fetched.
//
// After a release, a page that was loaded before it still refers to the files
// of the release it came from, and a download can simply fail. Reloading
// fetches the current page, whose references are current. TanStack Router
// already does this for native `import()` failures, but it does not recognise
// the bundler's own chunk loader, whose error reads "Loading chunk 540 failed."

/** Whether an error is the bundler failing to load a JS or CSS chunk. */
export function isChunkLoadError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const { name, message } = error as { name?: unknown; message?: unknown };
  if (name === 'ChunkLoadError') return true;
  return (
    typeof message === 'string' &&
    /^Loading (CSS )?chunk \S+ failed/.test(message)
  );
}

const KEY = 'hs_chunk_reload_at';
/** A reload this recent that ended in the same failure did not help. */
const WINDOW_MS = 60_000;

function sessionStore(): Storage {
  return window.sessionStorage;
}

/**
 * Reload the page, at most once a minute. Returns false, leaving the caller to
 * show the error, when a reload in the last minute already failed to help, or
 * when session storage cannot record the attempt: a reload that cannot be
 * remembered could loop for ever.
 */
export function reloadOnce(
  now: number = Date.now(),
  storage: () => Storage = sessionStore,
  reload: () => void = () => window.location.reload(),
): boolean {
  try {
    const store = storage();
    const last = Number(store.getItem(KEY));
    if (Number.isFinite(last) && last > 0 && now - last < WINDOW_MS) {
      return false;
    }
    store.setItem(KEY, String(now));
  } catch {
    return false;
  }
  reload();
  return true;
}
