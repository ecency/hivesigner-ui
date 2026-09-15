// The app directory, read from the Hivesigner API.
//
// The list used to be the @hivesigner/top-apps post, curated by hand and last
// edited in 2020. By the time it was looked at, half of it was dead: one domain
// gone, three lapsed and re-registered as gambling and SEO spam. Ranking it
// properly needs ~60 RPC calls and an HTTP request per candidate website, which
// a browser can neither afford nor perform, so the API does it on a timer and
// serves the answer.
//
// EVERYTHING HERE IS UNTRUSTED. It is a network response rendered on screens
// that hand over posting authority, so it is validated the same way chain data
// is: account names must look like account names, strings are capped, and the
// callers run display text through safeText.
import { getAllApps, getTopApps } from './hive';

// Baked at build time so a deployment can point somewhere else; the default is
// the public API, which serves the same list to everyone.
//
// Guarded with `typeof`, as sentry.ts guards its own define: the identifier
// does not exist under Vitest, and reading it bare would throw at module load
// and take every importing test with it.
const DEFAULT_API = 'https://api.hivesigner.com';
const API = (
  typeof __API_URL__ === 'string' && __API_URL__ ? __API_URL__ : DEFAULT_API
).replace(/\/+$/, '');

export interface FeaturedApp {
  username: string;
  name?: string;
  website?: string;
}

export interface AppDirectory {
  featured: FeaturedApp[];
  directory: string[];
  /** Where the answer came from, for the "could not reach" case. */
  source: 'api' | 'chain';
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

function readFeatured(value: unknown): FeaturedApp[] {
  if (!Array.isArray(value)) return [];
  const out: FeaturedApp[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const row = entry as Record<string, unknown>;
    if (!isUsername(row.username)) continue;
    out.push({
      username: row.username,
      name: str(row.name, 200),
      website: str(row.website, 500),
    });
  }
  return out;
}

/**
 * Ask the API. Rejects on anything unexpected so the caller falls back.
 *
 * A short timeout on purpose: this decorates the homepage and the directory,
 * and a slow API must not hold either of them up. Falling back to the chain is
 * always available and costs a second.
 */
export async function fetchFromApi(
  signal?: AbortSignal,
): Promise<AppDirectory> {
  const res = await fetch(`${API}/api/apps`, {
    signal: signal ?? AbortSignal.timeout(6000),
    headers: { accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`app directory: HTTP ${res.status}`);
  const body: unknown = await res.json();
  if (!body || typeof body !== 'object')
    throw new Error('app directory: not an object');
  const parsed = body as Record<string, unknown>;
  const featured = readFeatured(parsed.featured);
  const directory = Array.isArray(parsed.directory)
    ? parsed.directory.filter(isUsername)
    : [];
  // An empty answer is a failure, not an empty directory: it would blank the
  // apps page, and the chain fallback can do better.
  if (featured.length === 0 && directory.length === 0) {
    throw new Error('app directory: empty');
  }
  return { featured, directory, source: 'api' };
}

/**
 * The directory, from the API where possible and from the chain otherwise.
 *
 * The fallback is not decoration. This is a signing app: it must keep working
 * when the API is down, and it did all of this from the chain before the
 * endpoint existed, so the capability is already there.
 */
export async function getAppDirectory(): Promise<AppDirectory> {
  try {
    return await fetchFromApi();
  } catch {
    const [featured, directory] = await Promise.all([
      getTopApps(),
      getAllApps(),
    ]);
    return {
      featured: featured.map((username) => ({ username })),
      directory,
      source: 'chain',
    };
  }
}
