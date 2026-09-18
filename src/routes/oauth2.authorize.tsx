import { createFileRoute, redirect } from '@tanstack/react-router';
import { AuthorizeConsent } from '@/components/AuthorizeConsent';
import { takeNamedAccount } from '@/lib/named-account';
import { normalizeAuthRequest } from '@/lib/oauth';

// /oauth2/authorize: the modern entry point. The screen itself is shared with
// the legacy /login route (see components/AuthorizeConsent).
export const Route = createFileRoute('/oauth2/authorize')({
  component: Authorize,
  remountDeps: ({ search }) => search,
  validateSearch: (s: Record<string, unknown>) => s as Record<string, string>,
  // The account the app expects, chosen when it is on this device (#83).
  beforeLoad: ({ search }) => {
    const rest = takeNamedAccount(search);
    if (rest)
      throw redirect({ to: '/oauth2/authorize', search: rest, replace: true });
  },
});

function Authorize() {
  return <AuthorizeConsent req={normalizeAuthRequest(Route.useSearch())} />;
}
