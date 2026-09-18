import type { QueryClient } from '@tanstack/react-query';
import { type Account, getAccount } from './hive';
import { accountKey } from './query-keys';

/**
 * `name`'s account as the chain has it now, to build an account_update from.
 *
 * Read by NAME, not through the screen's query: that query follows the
 * selected account, and another tab can change the selection mid-click (the
 * unlock re-reads it from storage). The cached copy the screen renders from
 * is refreshed as well. A failed read throws and never falls back to the
 * cached copy: an account_update carries the whole authority, and a stale one
 * would undo what was granted or revoked elsewhere since.
 */
export function readAccountNow(
  client: QueryClient,
  name: string,
): Promise<Account | null> {
  return client.fetchQuery({
    queryKey: accountKey(name),
    queryFn: () => getAccount(name),
    staleTime: 0,
  });
}
