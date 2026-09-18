import { createFileRoute } from '@tanstack/react-router';
import { AuthorizeConsent } from '@/components/AuthorizeConsent';
import { normalizeAuthRequest } from '@/lib/oauth';

// /oauth2/authorize: the modern entry point. The screen itself is shared with
// the legacy /login route (see components/AuthorizeConsent).
export const Route = createFileRoute('/oauth2/authorize')({
  component: Authorize,
  remountDeps: ({ search }) => search,
  validateSearch: (s: Record<string, unknown>) => s as Record<string, string>,
});

function Authorize() {
  return <AuthorizeConsent req={normalizeAuthRequest(Route.useSearch())} />;
}
