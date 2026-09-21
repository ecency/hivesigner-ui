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

/** The profile as its readers see it: the posting one once it carries a
    version, and the older copy laid under it until then, so a value only the
    older one has is still found and a newer one always wins. */
export function effectiveProfile(
  account: Account | null | undefined,
): Record<string, unknown> {
  const posting = asRecord(metadataOf(account).profile);
  if (posting.version) return posting;
  return { ...profileIn(account?.json_metadata), ...posting };
}
