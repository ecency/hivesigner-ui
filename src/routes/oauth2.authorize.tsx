import { createFileRoute, redirect } from '@tanstack/react-router';
import { AuthorizeConsent } from '@/components/AuthorizeConsent';
import { selectAccount } from '@/lib/accounts';
import { normalizeAuthRequest } from '@/lib/oauth';

// /oauth2/authorize: the modern entry point. The screen itself is shared with
// the legacy /login route (see components/AuthorizeConsent).
export const Route = createFileRoute('/oauth2/authorize')({
  component: Authorize,
  remountDeps: ({ search }) => search,
  validateSearch: (s: Record<string, unknown>) => s as Record<string, string>,
  // `account` names the account the app expects (the SDK's
  // getLoginURL(state, account), #83; its README calls it `select_account`):
  // chosen here when it is on this device, otherwise ignored. Taken out of
  // the URL once read. The screen hands its URL on to the account list and
  // the import as the way back, and on that return the param would take the
  // user's own pick away again.
  beforeLoad: ({ search }) => {
    const { account, select_account, ...rest } = search;
    const named = account ?? select_account;
    if (named === undefined) return;
    // Names are lower case on Hive; "@Name" still finds it.
    selectAccount(named.trim().toLowerCase().replace(/^@/, ''));
    throw redirect({ to: '/oauth2/authorize', search: rest, replace: true });
  },
});

function Authorize() {
  return <AuthorizeConsent req={normalizeAuthRequest(Route.useSearch())} />;
}
