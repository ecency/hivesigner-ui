import type { Account } from '@/lib/hive';

/**
 * The profile an account publishes, read the way its readers read it.
 *
 * Hive has two metadata fields and Hivesigner's own API picks between them:
 * `posting_json_metadata` once the profile carries a `version`, and the older
 * `json_metadata` until then. An app registered before that convention still
 * has its settings in the older copy, so anything that judges an app by its
 * profile (the consent screen, the profile form) has to look where the API
 * looks, or it refuses an app the API accepts, and writing over the newer copy
 * would lose what the older one carried.
 */

/** A JSON object as it is; anything else (null, an array, a string) as {}. */
export function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** The whole `posting_json_metadata` object. Another app may have written
    anything there, valid JSON that is not an object included. */
export function metadataOf(
  account: Account | null | undefined,
): Record<string, unknown> {
  try {
    return asRecord(JSON.parse(account?.posting_json_metadata || '{}'));
  } catch {
    return {};
  }
}

/** The profile inside a metadata string, for the older `json_metadata` copy. */
export function profileIn(
  metadata: string | undefined,
): Record<string, unknown> {
  try {
    return asRecord(asRecord(JSON.parse(metadata || '{}')).profile);
  } catch {
    return {};
  }
}

/** For EDITING and for the save that follows: the posting profile once it
    carries a version, and the older copy laid under it until then, so writing
    the version cannot lose a value only the older copy had (a client secret,
    an IP allowlist). A merge is right here because nothing is discarded; it is
    wrong for judging a request, which is what the two below are for. */
export function profileForEditing(
  account: Account | null | undefined,
): Record<string, unknown> {
  const posting = asRecord(metadataOf(account).profile);
  if (posting.version) return posting;
  return { ...profileIn(account?.json_metadata), ...posting };
}

/**
 * Whether the account presents itself as an app.
 *
 * Either copy counts. The API selects one profile and ignores the other
 * (`getAppProfile`: the posting one once it has a version, else the older
 * one), while everything here has always read the posting copy. Refusing an
 * account that one of those two accepts would take a working integration
 * offline, which is the expensive mistake; accepting one the API later turns
 * down costs a code exchange that was already failing.
 */
export function saysItIsAnApp(account: Account | null | undefined): boolean {
  const posting = asRecord(metadataOf(account).profile);
  if (posting.type === 'app') return true;
  return !posting.version && profileIn(account?.json_metadata).type === 'app';
}

const callbacks = (profile: Record<string, unknown>): string[] =>
  Array.isArray(profile.redirect_uris)
    ? profile.redirect_uris.filter((u): u is string => typeof u === 'string')
    : [];

/**
 * The callbacks the account has registered: its own list, and the older copy
 * only when the newer one has none at all.
 *
 * Not merged. The older copy is what the account looked like before any modern
 * tool wrote the newer one, so it holds addresses its owner has since removed,
 * and an emptied list is how a compromised callback is de-registered. Adding
 * them back would undo that.
 */
export function registeredCallbacks(
  account: Account | null | undefined,
): string[] {
  const posting = asRecord(metadataOf(account).profile);
  const own = callbacks(posting);
  if (own.length > 0 || posting.version) return own;
  return callbacks(profileIn(account?.json_metadata));
}

/** The name to show for an app: its own, then the older copy's, then the
    account name. Only a string: rendering an object as a React child throws
    and takes the consent screen down. */
export function appDisplayName(
  account: Account | null | undefined,
  clientId: string,
): string {
  for (const profile of [
    asRecord(metadataOf(account).profile),
    profileIn(account?.json_metadata),
  ]) {
    if (typeof profile.name === 'string' && profile.name) return profile.name;
  }
  return clientId;
}
