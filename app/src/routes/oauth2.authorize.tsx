import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { type CSSProperties, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getKeys } from '@/lib/accounts';
import {
  type AppProfile,
  authorityForScope,
  buildAuthToken,
  buildRedirectUrl,
  isRegisteredRedirect,
  loadAppProfile,
  normalizeAuthRequest,
} from '@/lib/oauth';
import { useAccounts } from '@/lib/use-accounts';

// The OAuth consent screen (#106 pain #3): one screen naming the app and its
// scope in plain words, issuing a token and redirecting on approval. The
// posting-authority grant (authorize/revoke) is a separate flow.
export const Route = createFileRoute('/oauth2/authorize')({
  component: Authorize,
  validateSearch: (s: Record<string, unknown>) => s as Record<string, string>,
});

const card: CSSProperties = {
  background: '#fff',
  border: '1px solid #d1d9e0',
  borderRadius: 12,
  padding: 16,
};

function Authorize() {
  const { t } = useTranslation();
  const search = Route.useSearch();
  const { selectedAccount, unlocked } = useAccounts();
  const req = normalizeAuthRequest(search);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['app-profile', req.clientId],
    queryFn: (): Promise<AppProfile | null> =>
      req.clientId ? loadAppProfile(req.clientId) : Promise.resolve(null),
    enabled: !!req.clientId,
  });

  const [error, setError] = useState<string | null>(null);

  const authority = authorityForScope(req.scope);
  const isUnlocked = !!selectedAccount && unlocked.includes(selectedAccount);
  const keys = selectedAccount ? getKeys(selectedAccount) : null;
  const signingKey = keys?.[authority];
  const callback = req.redirectUri ?? '';
  const registered = profile ? isRegisteredRedirect(profile, callback) : false;

  function approve() {
    setError(null);
    if (!selectedAccount || !signingKey) return;
    // Enforce redirect_uri registration (the Nuxt app does not; we do).
    if (!profile || !registered) {
      setError(t('errors.unknown'));
      return;
    }
    const token = buildAuthToken(req, selectedAccount, signingKey, authority);
    window.location.assign(
      buildRedirectUrl(callback, token, req, selectedAccount),
    );
  }

  if (isLoading) {
    return <section style={{ padding: 20 }}>…</section>;
  }

  const appName = profile?.name ?? req.clientId ?? 'This site';
  const unregistered =
    !!req.clientId && !!callback && profile != null && !registered;

  return (
    <section
      style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <div
        style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: '#E31337',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 24,
            margin: '0 auto',
            textTransform: 'uppercase',
          }}
        >
          {appName[0]}
        </div>
        <h1 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>
          <b>{appName}</b> {t('authorize.request_access')}
        </h1>
      </div>

      {unregistered && (
        <div
          style={{
            ...card,
            background: '#ffebe9',
            border: '1px solid #f0b3b3',
            color: '#cf222e',
            fontSize: 13,
          }}
        >
          This app's redirect URL is not registered. For your safety, sign-in is
          blocked.
        </div>
      )}

      <div style={{ ...card, fontSize: 14 }}>
        <div style={{ fontSize: 12, color: '#59636e' }}>Scope</div>
        <div style={{ fontWeight: 600 }}>
          {req.scope === 'login'
            ? 'View your account username'
            : 'Post, comment, vote and follow on your behalf'}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            ...card,
            background: '#ffebe9',
            border: '1px solid #f0b3b3',
            color: '#cf222e',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!selectedAccount ? (
          <Link to="/import" style={btn(true)}>
            {t('common.continue')}
          </Link>
        ) : !isUnlocked ? (
          <Link to="/accounts" style={btn(true)}>
            {t('accounts.unlock')} @{selectedAccount}
          </Link>
        ) : !signingKey ? (
          <Link to="/import" style={btn(true)}>
            {t('login.need_import', { authority })}
          </Link>
        ) : (
          <button
            type="button"
            onClick={approve}
            disabled={unregistered}
            style={{ ...btn(!unregistered), border: 'none' }}
          >
            {t('authorize.authorize')}
          </button>
        )}
        <Link
          to="/accounts"
          style={{ textAlign: 'center', fontSize: 13, color: '#59636e' }}
        >
          {t('common.cancel')}
        </Link>
      </div>
    </section>
  );
}

function btn(enabled: boolean): CSSProperties {
  return {
    height: 50,
    borderRadius: 10,
    background: enabled ? '#E31337' : '#f0a5b3',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: enabled ? 'pointer' : 'not-allowed',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
  };
}
