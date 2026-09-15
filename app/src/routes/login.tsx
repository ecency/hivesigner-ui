import { createFileRoute } from '@tanstack/react-router';
import { AuthorizeConsent } from '@/components/AuthorizeConsent';
import { normalizeLoginRequest } from '@/lib/oauth';

// The LEGACY /login entry point, part of the published contract: third-party
// apps and the hivesigner SDK link here, and /login-request/* redirects into it.
// It renders the same consent screen as /oauth2/authorize; only the query
// normalisation differs (see normalizeLoginRequest for why they are separate).
export const Route = createFileRoute('/login')({
  component: Login,
  validateSearch: (s: Record<string, unknown>) => s as Record<string, string>,
});

function Login() {
  return <AuthorizeConsent req={normalizeLoginRequest(Route.useSearch())} />;
}
