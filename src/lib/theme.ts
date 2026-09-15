// Theme preference: light, dark, or follow the operating system.
//
// The CSS in globals.css already handles "system" on its own through
// `prefers-color-scheme`, so this module's ONLY job is the explicit override.
// That ordering matters: it means a dark-preferring visitor gets a dark page
// from the first paint, before any JavaScript runs, rather than a white flash
// while the bundle downloads. Writing `data-theme` on every load would undo
// that, so `system` REMOVES the attribute instead of resolving it.

const THEME_KEY = 'hs_theme';

export const themes = ['system', 'light', 'dark'] as const;
export type Theme = (typeof themes)[number];

function isTheme(v: unknown): v is Theme {
  return typeof v === 'string' && (themes as readonly string[]).includes(v);
}

// The choice made THIS SESSION. It exists because storage can refuse to be
// written (a private window, blocked site data, quota): without it setTheme
// would paint the page dark, getTheme would keep answering 'system', and the
// header button would show the system icon and offer to switch to light while
// the page in front of the user was already dark. Clicking then cycled from a
// state that was never true, so the user could not reach the one they could see.
let sessionTheme: Theme | null = null;

export function getTheme(): Theme {
  // The session choice wins: it is the most recent thing the user actually did,
  // and on a working browser it was written to storage anyway.
  if (sessionTheme) return sessionTheme;
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (isTheme(v)) return v;
  } catch {
    // storage blocked (private window, blocked site data): fall through
  }
  return 'system';
}

/** Put the preference on <html>, or take it off so the CSS media query rules. */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}

// The header switch and the settings radio group both show the theme, so a
// change in one has to reach the other. A set of listeners is enough: this is a
// single string that changes when a person clicks.
const listeners = new Set<() => void>();

export function subscribeTheme(fn: () => void): () => void {
  listeners.add(fn);
  // Under `system` the ANSWER changes without anyone clicking, when the OS
  // flips at sunset. Without this the icon would keep claiming light.
  let media: MediaQueryList | null = null;
  try {
    media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', fn);
  } catch {
    media = null;
  }
  return () => {
    listeners.delete(fn);
    media?.removeEventListener('change', fn);
  };
}

export function setTheme(theme: Theme): void {
  // Recorded BEFORE the write is attempted, so a storage failure still leaves
  // the controls agreeing with the page for the rest of this page load.
  sessionTheme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Not remembered past this page load; sessionTheme carries it until then.
  }
  applyTheme(theme);
  for (const fn of listeners) fn();
}

/**
 * Adopt a change another tab made.
 *
 * `storage` fires in every OTHER tab of the origin. Without it a second tab
 * kept the old attribute and the old snapshot: its header showed the previous
 * mode, and clicking there cycled from a value that was no longer stored,
 * writing back a choice the user had already moved on from.
 *
 * The other tab's write is newer than anything this one has in memory, so the
 * session value is replaced rather than preferred.
 */
function adoptExternalChange(event: StorageEvent): void {
  if (event.key !== null && event.key !== THEME_KEY) return;
  sessionTheme = isTheme(event.newValue) ? event.newValue : null;
  applyTheme(getTheme());
  for (const fn of listeners) fn();
}

/** Apply the stored preference. Called once at startup. */
export function initTheme(): void {
  try {
    // Registered here rather than in subscribeTheme so the ATTRIBUTE follows
    // the other tab even on a screen that renders no theme control.
    window.addEventListener('storage', adoptExternalChange);
  } catch {
    // no window (or blocked): the page still works, it just will not follow
  }
  applyTheme(getTheme());
}

/**
 * Whether the page is CURRENTLY dark, which is not the same question as which
 * preference is stored: under `system` the answer comes from the OS. Read from
 * the attribute and the media query rather than from a computed colour, so it
 * agrees with the CSS by construction.
 */
export function isDarkNow(): boolean {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'dark') return true;
  if (attr === 'light') return false;
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

/**
 * The snapshot both theme controls render from. One string rather than an
 * object so `useSyncExternalStore` can compare it by identity: returning a
 * fresh object on every call would re-render forever.
 */
export function themeSnapshot(): string {
  return `${getTheme()}|${isDarkNow() ? 'dark' : 'light'}`;
}

export function readSnapshot(snapshot: string): {
  theme: Theme;
  isDark: boolean;
} {
  const [theme, mode] = snapshot.split('|');
  return {
    theme: isTheme(theme) ? theme : 'system',
    isDark: mode === 'dark',
  };
}

/** Test seam: forget the session choice (not storage, not the attribute). */
export function _resetSessionTheme(): void {
  sessionTheme = null;
}
