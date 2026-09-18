import { selectAccount } from './accounts';

/**
 * For a request route's beforeLoad: the account the request names (#83), as
 * `account` (the SDK's getLoginURL(state, account)) or `select_account` (the
 * name the SDK's README gives it), is chosen when it is on this device and
 * otherwise ignored.
 *
 * Returns the search without those params, for a redirect that takes them
 * out of the URL, or null when it names none. The screen hands its URL on to
 * the account list and the import as the way back, and on that return the
 * param would take the user's own pick away again.
 */
export function takeNamedAccount(
  search: Record<string, string>,
): Record<string, string> | null {
  const { account, select_account, ...rest } = search;
  if (account === undefined && select_account === undefined) return null;
  // Names are lower case on Hive; "@Name" still finds it. An empty one names
  // nobody, and the other spelling is read instead.
  const named = account || select_account || '';
  selectAccount(named.trim().toLowerCase().replace(/^@/, ''));
  return rest;
}
