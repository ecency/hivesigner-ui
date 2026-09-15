// Validation for a caller-supplied "come back here afterwards" path, shared by
// the accounts screen (?next=) and the legacy /login local redirect.
//
// Resolve against our own origin and compare origins rather than pattern-matching
// the string. A browser reads `/\evil.example/x` and `\/evil.example` as
// protocol-relative, so a startsWith('//') check lets an off-site target through.
// Returning the RESOLVED parts also neutralises `/..//evil.example`, whose path
// resolves to a protocol-relative form even though its origin is ours.

export interface InternalPath {
  pathname: string;
  search: string;
}

export function resolveInternalPath(
  value: string | undefined,
): InternalPath | null {
  if (!value) return null;
  try {
    const origin = window.location.origin;
    const url = new URL(value, origin);
    if (url.origin !== origin) return null;
    if (url.pathname.startsWith('//')) return null;
    return { pathname: url.pathname, search: url.search };
  } catch {
    return null;
  }
}

/** True when a callback string is an absolute http(s) URL rather than a path. */
export function isAbsoluteHttpUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}
