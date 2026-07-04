import { Account } from '@hiveio/dhive'
import { client } from './client.util'

type PostingAuthority = Account['posting'] | undefined | null

/**
 * True when `clientId` is present in the given posting authority AND its weight
 * meets the authority's threshold — i.e. the app can actually sign posting
 * operations for this account.
 *
 * A name-only check (ignoring weight) reports a stale or low-weight entry as
 * authorized while the chain still rejects the broadcast, so the weight
 * comparison is required.
 */
export function hasPostingGrant (posting: PostingAuthority, clientId: string): boolean {
  if (!clientId || !posting) {
    return false
  }
  const threshold = posting.weight_threshold ?? 1
  const entry = posting.account_auths?.find(auth => auth[0] === clientId)
  return !!entry && Number(entry[1]) >= threshold
}

/**
 * Authoritative, on-chain confirmation that `clientId` holds posting authority
 * for `username`. Always queries the chain fresh — never a cached snapshot —
 * and fails CLOSED (returns false) on any error or empty result, so a token is
 * never issued for an account whose grant can't be confirmed (e.g. a freshly
 * created account that hasn't propagated to the queried node yet).
 */
export async function confirmPostingGrant (username: string, clientId: string): Promise<boolean> {
  if (!username || !clientId) {
    return false
  }
  try {
    const [account] = await client.database.getAccounts([username])
    return hasPostingGrant(account?.posting, clientId)
  } catch (error) {
    console.error('Failed to confirm posting authority', error)
    return false
  }
}
