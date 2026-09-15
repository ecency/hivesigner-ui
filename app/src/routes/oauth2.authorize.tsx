import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { type CSSProperties, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getKeys } from '@/lib/accounts';
import { buildGrantOperation, hasGrant } from '@/lib/grant';
import { type Account, getAccount } from '@/lib/hive';
import {
  type AppProfile,
  authorityForScope,
  buildAuthToken,
  buildRedirectUrl,
  isRegisteredRedirect,
  loadAppProfile,
  normalizeAuthRequest,
} from '@/lib/oauth';
import { broadcastOperations } from '@/lib/sign-tx';
import { useAccounts } from '@/lib/use-accounts';

// The OAuth consent screen (#106 pain #3): one screen naming the app and its
// scope in plain words. For a posting-scope request it first confirms (and, if
// missing, establishes with the active key) the app's on-chain posting authority
// before issuing the token - without the grant the token cannot broadcast (#95).
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Poll the chain until the app holds posting authority, or the budget runs out.
 * A broadcast returns before block inclusion and reads can lag, so a single
 * immediate refetch would wrongly report failure and a retry would re-broadcast.
 */
async function waitForGrant(
  username: string,
  clientId: string,
): Promise<boolean> {
  for (let i = 0; i < 8; i++) {
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
  const { data: account, refetch: refetchAccount } = useQuery({
    queryKey: ['account', selectedAccount],
    queryFn: (): Promise<Account | null> =>
      selectedAccount ? getAccount(selectedAccount) : Promise.resolve(null),
    enabled: !!selectedAccount,
  });

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const authority = authorityForScope(req.scope);
  const isUnlocked = !!selectedAccount && unlocked.includes(selectedAccount);
  const keys = selectedAccount ? getKeys(selectedAccount) : null;
  const signingKey = keys?.[authority];
  const callback = req.redirectUri ?? '';
  const registered = profile ? isRegisteredRedirect(profile, callback) : false;

  // A posting-scope request needs the app to hold posting authority on-chain.
  const postingScope = req.scope !== 'login' && !!req.clientId;
  // The account must be loaded before we can judge the grant; undefined = still
  // loading (null = not found). Approval waits for it on a posting-scope request.
  const accountLoaded = account !== undefined;
  const grantNeeded =
    postingScope &&
    !!account &&
    !hasGrant(account.posting, req.clientId as string);

  async function approve() {
    setError(null);
    if (!selectedAccount || !signingKey) return;
    // Enforce redirect_uri registration (the Nuxt app does not; we do).
    if (!profile || !registered) {
      setError(t('errors.unknown'));
      return;
    }
    setBusy(true);
    try {
      // For a posting-scope request, the app MUST hold the on-chain grant before
      // we issue a token, or the token cannot broadcast (#95). Never issue on an
      // unloaded account, and confirm the grant on the REFRESHED account after
      // granting rather than trusting the broadcast optimistically.
      if (postingScope && req.clientId) {
        // Refetch fresh first, so a retry after a grant that already landed sees
        // the authority and does not broadcast a second account_update.
        const loaded = (await refetchAccount()).data ?? account;
        if (!loaded) {
          setError(t('common.try_again'));
          return;
        }
        if (!hasGrant(loaded.posting, req.clientId)) {
          const activeKey = keys?.active;
          if (!activeKey) {
            setError(t('login.need_import', { authority: 'active' }));
            return;
          }
          const op = buildGrantOperation(loaded, req.clientId);
          if (op) await broadcastOperations([op], activeKey, loaded.name);
          // Wait for the grant to be visible on-chain before issuing the token.
          if (!(await waitForGrant(loaded.name, req.clientId))) {
            setError(
              'Authorization was submitted but is still confirming. Please try again in a moment.',
            );
            return;
          }
          await refetchAccount();
        }
      }
      const token = buildAuthToken(req, selectedAccount, signingKey, authority);
      window.location.assign(
        buildRedirectUrl(callback, token, req, selectedAccount),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
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
        ) : postingScope && !accountLoaded ? (
          // Never issue a posting token before we can confirm the on-chain grant.
          <button
            type="button"
            disabled
            style={{ ...btn(false), border: 'none' }}
          >
            …
          </button>
        ) : (
          <>
            {grantNeeded && (
              <div style={{ fontSize: 12.5, color: '#7a5300' }}>
                First-time authorization: this grants posting access on-chain
                and needs your active key once.
              </div>
            )}
            <button
              type="button"
              onClick={approve}
              disabled={unregistered || busy}
              style={{ ...btn(!unregistered && !busy), border: 'none' }}
            >
              {busy ? '…' : t('authorize.authorize')}
            </button>
          </>
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
