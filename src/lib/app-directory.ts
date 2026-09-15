// The app directory, read from the Hivesigner API.
//
// ONE SOURCE, NO FALLBACK. The API builds this from what it actually serves:
// every authenticated request carries the app's account name, so the list is
// measured rather than inferred. This used to fall back to reading the
// @hivesigner follow list and the curated top-apps post off the chain, and both
// are stale - the follow list has not been touched since March 2023. A fallback
// is also a second code path that only ever runs when the API is down, which is
// exactly when nobody is watching it.
//
// A fresh API answers `building: true` for a few hours until traffic fills it.
// That is a real state with its own message, not an error and not an empty list.
//
// EVERYTHING HERE IS UNTRUSTED: a network response rendered on screens that
// hand over posting authority, so account names must look like account names,
// strings are capped, and the amount that can be rendered is bounded.

const DEFAULT_API = 'https://api.hivesigner.com';
// Guarded with `typeof`, as sentry.ts guards its own define: the identifier
// does not exist under Vitest, and reading it bare would throw at module load.
const API = (
  typeof __API_URL__ === 'string' && __API_URL__ ? __API_URL__ : DEFAULT_API
).replace(/\/+$/, '');

/** How much of a response will be rendered at all. */
const MAX_APPS = 2000;

export interface DirectoryApp {
  username: string;
  name?: string;
  about?: string;
  website?: string;
  /** 'ok', or why the site check refused it ('redirected', 'unreachable', ...). */
  site?: string;
  users: number;
}

export interface AppDirectory {
  /** True while the API has no usage history yet. */
  building: boolean;
  apps: DirectoryApp[];
  /** Usernames, in the order the API ranked them. */
  featured: string[];
}

const USERNAME_RE = /^[a-z][a-z0-9.-]{2,15}$/;

function isUsername(value: unknown): value is string {
  return typeof value === 'string' && USERNAME_RE.test(value);
}

function str(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

function readApps(value: unknown): DirectoryApp[] {
  if (!Array.isArray(value)) {
    throw new Error('app directory: apps is not a list');
  }
  const out: DirectoryApp[] = [];
  const seen = new Set<string>();
  for (const entry of value.slice(0, MAX_APPS)) {
    if (!entry || typeof entry !== 'object') continue;
    const row = entry as Record<string, unknown>;
    if (!isUsername(row.username) || seen.has(row.username)) continue;
    seen.add(row.username);
    out.push({
      username: row.username,
      name: str(row.name, 200),
      about: str(row.about, 500),
      website: str(row.website, 500),
      site: str(row.site, 40),
      users: Number.isFinite(row.users) ? Number(row.users) : 0,
    });
  }
  return out;
}

/**
 * Ask the API. Rejects on anything unexpected; there is nowhere else to ask.
 *
 * A short timeout on purpose: this decorates the homepage and the directory,
 * and neither should wait on a slow API.
 */
export async function fetchAppDirectory(
  signal?: AbortSignal,
): Promise<AppDirectory> {
  const res = await fetch(`${API}/api/apps`, {
    signal: signal ?? AbortSignal.timeout(6000),
    headers: { accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`app directory: HTTP ${res.status}`);
  const body: unknown = await res.json();
  if (!body || typeof body !== 'object') {
    throw new Error('app directory: not an object');
  }
  const parsed = body as Record<string, unknown>;
  const apps = readApps(parsed.apps);
  const known = new Set(apps.map((a) => a.username));
  // A featured name must be IN the list: one the response does not describe
  // would render a card with nothing behind it.
  const featured = Array.isArray(parsed.featured)
    ? [...new Set(parsed.featured.filter(isUsername))].filter((n) =>
        known.has(n),
      )
    : [];
  return { building: parsed.building === true, apps, featured };
}
