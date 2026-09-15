import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthorizeConsent } from '@/components/AuthorizeConsent';
import { resolveInternalPath } from '@/lib/internal-path';
import { isLocalLoginRequest, normalizeLoginRequest } from '@/lib/oauth';
import { parseSearch } from '@/lib/search';
import { useAccounts } from '@/lib/use-accounts';

// The LEGACY /login entry point, part of the published contract: third-party
// apps and the hivesigner SDK link here, and /login-request/* redirects into it.
//
// login.vue served TWO flows from this one path and both have to work:
//  - app consent (client_id + redirect_uri), which issues a token. That renders
//    the same screen as /oauth2/authorize, so the grant confirmation, the
//    cancellation latch and the client_id disclosure cannot drift apart.
//  - a LOCAL login-and-return (`?redirect=/profile`, or a bare /login), which
//    just authenticates and navigates to an internal page. No app, no token, no
//    registration. Routing this through the consent screen made it fail with an
//    invalid-request error even for an unlocked account.
export const Route = createFileRoute('/login')({
  component: Login,
  validateSearch: (s: Record<string, unknown>) => s as Record<string, string>,
});

function Login() {
  const search = Route.useSearch();
  if (isLocalLoginRequest(search)) return <LocalLogin next={search.redirect} />;
  return <AuthorizeConsent req={normalizeLoginRequest(search)} />;
}

/** Log in, then continue to an internal page (default the home screen). */
function LocalLogin({ next }: { next?: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { usernames, selectedAccount, unlocked } = useAccounts();
  // A bare /login means "log in and go home", as login.vue did. An off-site or
  // malformed target is discarded rather than followed (resolveInternalPath).
  const dest = resolveInternalPath(next) ?? { pathname: '/', search: '' };
  const isUnlocked = !!selectedAccount && unlocked.includes(selectedAccount);
  const sent = useRef(false);

  useEffect(() => {
    if (!isUnlocked || sent.current) return;
    sent.current = true;
    navigate({
      to: dest.pathname,
      search: dest.search ? parseSearch(dest.search) : {},
    } as never);
  }, [isUnlocked, dest.pathname, dest.search, navigate]);

  if (isUnlocked) {
    return <section style={{ padding: 20 }}>…</section>;
  }

  const target = `${dest.pathname}${dest.search}`;
  return (
    <section
      style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
        {t('footer.login')}
      </h1>
      <p style={{ margin: 0, fontSize: 14, color: '#59636e' }}>
        Unlock an account to continue to <b>{target}</b>.
      </p>
      {usernames.length === 0 ? (
        <Link to="/import" style={{ fontSize: 14 }}>
          {t('accounts.add_another')}
        </Link>
      ) : (
        <Link to="/accounts" search={{ next: target }} style={{ fontSize: 14 }}>
          {t('accounts.unlock')}
        </Link>
      )}
    </section>
  );
}
