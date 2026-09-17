import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { AuthorizeConsent } from '@/components/AuthorizeConsent';
import { formColumn, h1, link, muted, page } from '@/components/ui';
import { resolveInternalPath } from '@/lib/internal-path';
import {
  isLocalLoginRequest,
  normalizeLoginRequest,
  unpackLoginRequest,
} from '@/lib/oauth';
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
  // A `redirect` pointing at /login-request carries the real request nested
  // inside it (client id in the path, callback and scope in its query), so unpack
  // it before deciding anything.
  const { query, pathClientId } = unpackLoginRequest(search);
  if (isLocalLoginRequest(query) && !pathClientId)
    return <LocalLogin next={query.redirect} />;
  return <AuthorizeConsent req={normalizeLoginRequest(query, pathClientId)} />;
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
    return <section className={page}>…</section>;
  }

  const target = `${dest.pathname}${dest.search}`;
  return (
    // Not a form, but the same reading rule applies: one column that stops at a
    // comfortable measure instead of stretching across the widened shell.
    <section className={`${page} ${formColumn} sm:max-w-md`}>
      <h1 className={h1}>{t('footer.login')}</h1>
      {/* `target` is built from the redirect param, so it is a rendered value:
          isolate it and let it break instead of pushing the page sideways at
          320px. */}
      <p className={`${muted} m-0 break-words`}>
        {/* I claimed in #113 that the last hardcoded English was gone. It was
            not: this one survived because the sentence is split around the
            target. One Trans key, so the target can move within it. */}
        <Trans
          i18nKey="login.unlock_to_continue_to"
          values={{ target }}
          components={{
            target: <b className="break-all" translate="no" />,
          }}
        />
      </p>
      {usernames.length === 0 ? (
        <Link
          to="/import"
          search={{ next: window.location.pathname + window.location.search }}
          className={`${link} text-sm`}
        >
          {t('accounts.add_another')}
        </Link>
      ) : (
        <Link
          to="/accounts"
          search={{ next: target }}
          className={`${link} text-sm`}
        >
          {t('accounts.unlock')}
        </Link>
      )}
    </section>
  );
}
