import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
import {
  alertError,
  alertWarn,
  btnPrimary,
  card,
  mutedXs,
  page,
} from '@/components/ui';
import { getKeys } from '@/lib/accounts';
import { buildGrantOperation, hasGrant } from '@/lib/grant';
import { type Account, getAccount } from '@/lib/hive';
import {
  type AppProfile,
  type AuthRequest,
  authorityForScope,
  buildAuthToken,
  buildRedirectUrl,
  isRegisteredRedirect,
  loadAppProfile,
} from '@/lib/oauth';
import { safeText } from '@/lib/operation-summary';
import { broadcastOperations } from '@/lib/sign-tx';
import { useAccounts } from '@/lib/use-accounts';

// The consent screen (#106 pain #3): one screen naming the app and its scope in
// plain words. For a posting-scope request it first confirms (and, if missing,
// establishes with the active key) the app's on-chain posting authority before
// issuing the token - without the grant the token cannot broadcast (#95).
//
// Shared by /oauth2/authorize and the legacy /login, which differ only in how
// their query is normalised into an AuthRequest. Keeping one implementation is
// the point: the grant confirmation, the cancellation latch and the client_id
// disclosure must not drift between the two entry points.

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

export function AuthorizeConsent({ req }: { req: AuthRequest }) {
  const { t } = useTranslation();
  const { selectedAccount, unlocked } = useAccounts();

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
  // Set when this screen is left, so an in-flight approve() cannot grant
  // authority or redirect after the user withdrew consent. Setup MUST clear it:
  // Strict Mode runs setup -> cleanup -> setup, so a cleanup-only effect would
  // leave the latch stuck on and silently abort every approval in development.
  const abandoned = useRef(false);
  useEffect(() => {
    abandoned.current = false;
    return () => {
      abandoned.current = true;
    };
  }, []);

  const authority = authorityForScope(req.scope);
  const isUnlocked = !!selectedAccount && unlocked.includes(selectedAccount);
  const keys = selectedAccount ? getKeys(selectedAccount) : null;
  const signingKey = keys?.[authority];
  const callback = req.redirectUri ?? '';
  const registered = profile ? isRegisteredRedirect(profile, callback) : false;
  const callbackHost = (() => {
    try {
      return new URL(callback).host;
    } catch {
      return null;
    }
  })();

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
        // Re-check here, BEFORE the broadcast. The refetch is awaited, so the
        // user can cancel while it is in flight; granting posting authority is
        // an irreversible on-chain write, so withdrawn consent has to stop it
        // at this point, not merely stop the token afterwards.
        if (abandoned.current) return;
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
      // The grant poll can run for up to 16s. If the user left the consent
      // screen in the meantime (Cancel, or navigating away), do NOT hand the app
      // a token and redirect them - they withdrew consent mid-flow.
      if (abandoned.current) return;
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
    return <section className={page}>…</section>;
  }

  // Attacker-controlled: profile.name is the app account's own on-chain
  // metadata and clientId comes from the URL. Strip control and bidi characters
  // for the same reason the confirm screen does.
  const appName = safeText(profile?.name ?? req.clientId ?? 'This site');
  const unregistered =
    !!req.clientId && !!callback && profile != null && !registered;

  return (
    <section className={page}>
      <div className="flex flex-col gap-2 text-center">
        {/* The app account's OWN avatar, keyed on client_id rather than on
            the display name: client_id is the part of the identity the app
            cannot rename, so the picture and the name below it agree. */}
        <Avatar username={req.clientId ?? ''} size="lg" className="mx-auto" />
        <h1 className="m-0 text-[19px] font-bold break-words sm:text-xl">
          <b className="[unicode-bidi:isolate]">{appName}</b>{' '}
          {t('authorize.request_access')}
        </h1>
        {/* profile.name is the app account's OWN self-declared metadata, so an
            account like `ecency-login` can call itself "Ecency". Always show the
            real client_id and the callback host: those are what the grant and
            the redirect actually use, and they cannot be renamed. */}
        <div className={mutedXs}>
          {t('authorize.hive_account')} <b>@{req.clientId}</b>
          {callbackHost && (
            <>
              {' '}
              · {t('authorize.sends_you_to')} <b>{callbackHost}</b>
            </>
          )}
        </div>
      </div>

      {unregistered && (
        <div className={alertError}>
          {t('authorize.redirect_not_registered')}
        </div>
      )}

      <div className={`${card} text-sm`}>
        <div className="text-xs text-muted">{t('authorize.scope')}</div>
        <div className="font-semibold">
          {req.scope === 'login'
            ? t('authorize.scope_login')
            : t('authorize.scope_posting')}
        </div>
      </div>

      {error && (
        <div role="alert" className={alertError}>
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {!selectedAccount ? (
          <Link
            to="/import"
            search={{ next: window.location.pathname + window.location.search }}
            className={btnPrimary}
          >
            {t('common.continue')}
          </Link>
        ) : !isUnlocked ? (
          // Carry the consent request through the unlock, or the app has to
          // start the whole authorization over.
          <Link
            to="/accounts"
            search={{ next: window.location.pathname + window.location.search }}
            className={btnPrimary}
          >
            {t('accounts.unlock')} @{selectedAccount}
          </Link>
        ) : !signingKey ? (
          <Link
            to="/import"
            search={{ next: window.location.pathname + window.location.search }}
            className={btnPrimary}
          >
            {t('login.need_import', { authority })}
          </Link>
        ) : postingScope && !accountLoaded ? (
          // Never issue a posting token before we can confirm the on-chain grant.
          <button type="button" disabled className={btnPrimary}>
            …
          </button>
        ) : (
          <>
            {/* Name the account being authorized. Without it a user with several
                accounts cannot see WHICH account's token they are issuing, which
                is what made a wrong selected account silent. */}
            <div className={mutedXs}>
              Authorizing as <b>@{selectedAccount}</b>
            </div>
            {grantNeeded && (
              <div className={alertWarn}>
                First-time authorization: this adds <b>@{req.clientId}</b> to
                your posting authority on-chain and needs your active key once.
                That account will be able to post as you until you revoke it.
              </div>
            )}
            <button
              type="button"
              onClick={approve}
              disabled={unregistered || busy}
              className={btnPrimary}
            >
              {busy ? '…' : t('authorize.authorize')}
            </button>
          </>
        )}
        <Link to="/accounts" className="text-center text-[13px] text-muted">
          {t('common.cancel')}
        </Link>
      </div>
    </section>
  );
}
