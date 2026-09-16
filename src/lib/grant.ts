// Posting-authority grant and revoke, as account_update operations.
//
// Granting adds the app account to the user's posting account_auths (weight =
// the posting weight_threshold); revoking removes it from posting and active.
// Both are broadcast with the ACTIVE key. Matches the Nuxt AuthorizeForm /
// RevokeForm payload shape, but is weight-aware and de-duplicated (the Nuxt
// version pushes a duplicate even when the grant already exists).
import { type Account, type Authority, getAccount } from './hive';
import type { Operation } from './hive-uri';

/** Weight-aware: is `name` in the authority with enough weight to meet its threshold? */
export function hasGrant(
  authority: Authority | undefined,
  name: string,
): boolean {
  if (!authority) return false;
  const threshold = authority.weight_threshold ?? 1;
  return authority.account_auths.some(
    ([n, w]) => n === name && Number(w) >= threshold,
  );
}

function cloneAuthority(a: Authority): Authority {
  return {
    weight_threshold: a.weight_threshold,
    account_auths: a.account_auths.map((e) => [e[0], e[1]] as [string, number]),
    key_auths: a.key_auths.map((e) => [e[0], e[1]] as [string, number]),
  };
}

/**
 * The account_update operation that grants `clientId` posting authority, or
 * null when the grant already exists (nothing to broadcast). Sorted by name.
 */
export function buildGrantOperation(
  account: Account,
  clientId: string,
): Operation | null {
  if (hasGrant(account.posting, clientId)) return null;
  const posting = cloneAuthority(account.posting);
  // Drop any stale under-weight entry for the same name, then add at threshold.
  posting.account_auths = posting.account_auths.filter(([n]) => n !== clientId);
  posting.account_auths.push([clientId, posting.weight_threshold]);
  posting.account_auths.sort((a, b) => (a[0] > b[0] ? 1 : -1));
  return [
    'account_update',
    {
      account: account.name,
      memo_key: account.memo_key,
      json_metadata: account.json_metadata,
      posting,
    },
  ];
}

/**
 * The account_update operation that revokes `clientId` from posting and active,
 * or null when it is present in neither. Only the changed authorities are sent.
 */
export function buildRevokeOperation(
  account: Account,
  clientId: string,
): Operation | null {
  const inPosting = account.posting.account_auths.some(([n]) => n === clientId);
  const inActive = account.active.account_auths.some(([n]) => n === clientId);
  if (!inPosting && !inActive) return null;

  const payload: Record<string, unknown> = {
    account: account.name,
    memo_key: account.memo_key,
    json_metadata: account.json_metadata,
  };
  if (inPosting) {
    const posting = cloneAuthority(account.posting);
    posting.account_auths = posting.account_auths.filter(
      ([n]) => n !== clientId,
    );
    payload.posting = posting;
  }
  if (inActive) {
    const active = cloneAuthority(account.active);
    active.account_auths = active.account_auths.filter(([n]) => n !== clientId);
    payload.active = active;
  }
  return ['account_update', payload];
}

/**
 * The apps that can actually post as this account. Weight-aware for the same
 * reason hasGrant is: an entry below posting.weight_threshold cannot sign on its
 * own, so listing it as authorized overstates what the app can do.
 */
export function authorizedApps(account: Account): string[] {
  const threshold = Number(account.posting.weight_threshold ?? 1);
  return account.posting.account_auths
    .filter(([, w]) => Number(w ?? 0) >= threshold)
    .map(([n]) => n);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Poll the chain until the app holds posting authority, or the budget runs out.
 *
 * A broadcast returns before block inclusion and reads can lag, so a single
 * immediate refetch would wrongly report failure, and whatever screen comes
 * next would ask for the grant again and broadcast a second account_update.
 * Shared by the consent screen and the grant page for exactly that reason.
 */
export async function waitForGrant(
  username: string,
  clientId: string,
  attempts = 8,
): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    await sleep(2000);
    try {
      const acc = await getAccount(username);
      if (acc && hasGrant(acc.posting, clientId)) return true;
    } catch {
      // transient read failure; keep polling within the budget
    }
  }
  return false;
}
