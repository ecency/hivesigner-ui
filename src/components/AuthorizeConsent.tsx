import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AddActiveKey } from '@/components/AddActiveKey';
import { Avatar } from '@/components/Avatar';
import { CurrentAccount } from '@/components/CurrentAccount';
import { PostingAbilities } from '@/components/PostingAbilities';
import { ReportIssue } from '@/components/ReportIssue';
import { UnlockAndContinue } from '@/components/UnlockAndContinue';
import { Sentence } from '@/components/Untranslated';
import {
  alertError,
  alertWarn,
  btnPrimary,
  btnSecondary,
  card,
  mutedXs,
  page,
} from '@/components/ui';
import { readAccountNow } from '@/lib/account-now';
import { getKeys, stillSelected } from '@/lib/accounts';
import { buildGrantOperation, hasGrant, waitForGrant } from '@/lib/grant';
import { type Account, getAccount, type Keys } from '@/lib/hive';
import { hostOf, reportIntegrationIssue } from '@/lib/integration-signal';
import {
  type AppProfile,
  type AuthRequest,
  authorityForScope,
  buildAuthToken,
  buildRedirectUrl,
  isRegisteredRedirect,
  isValidRedirectUri,
  loadAppProfile,
} from '@/lib/oauth';
import { safeText } from '@/lib/operation-summary';
import { accountKey, oauthAppProfileKey } from '@/lib/query-keys';
import { broadcastOperations } from '@/lib/sign-tx';
import { useAccounts } from '@/lib/use-accounts';
import { useLeaveLatch } from '@/lib/use-leave-latch';

// The consent screen (#106 pain #3): one screen naming the app and its scope in
// plain words. For a posting-scope request it first confirms (and, if missing,
// establishes with the active key) the app's on-chain posting authority before
// issuing the token - without the grant the token cannot broadcast (#95).
//
// Shared by /oauth2/authorize and the legacy /login, which differ only in how
// their query is normalised into an AuthRequest. Keeping one implementation is
// the point: the grant confirmation, the cancellation latch and the client_id
// disclosure must not drift between the two entry points.

// The shape of a Hive account name. A client_id that is not one names no app:
// it is never looked up on-chain and never shown as typed.
const HIVE_NAME = /^[a-z][a-z0-9.-]{2,15}$/;

/**
 * The key the token is signed with. The token is an off-chain proof of the
 * username, and hivesigner-api accepts it signed by any of the account's
 * posting, active or owner keys. So a login, or an app that already holds the
 * grant, can use whichever of posting or active this device has; only an
 * active-scope request insists on active. Chain writes are stricter: since
 * HF28 an operation needs exactly its own authority, which is why the grant
 * always takes the active key.
 */
function tokenSigner(
  authority: 'posting' | 'active',
  keys: Keys | null,
): { role: 'posting' | 'active'; wif: string } | null {
  if (authority === 'posting' && keys?.posting)
    return { role: 'posting', wif: keys.posting };
  return keys?.active ? { role: 'active', wif: keys.active } : null;
}

export function AuthorizeConsent({ req }: { req: AuthRequest }) {
  const { t } = useTranslation();
  const { selectedAccount, unlocked } = useAccounts();
  const clientIdValid = !req.clientId || HIVE_NAME.test(req.clientId);
  // For display only. The URL is attacker-controlled, so control and bidi
  // characters are stripped here as they are for the heading.
  const clientLabel = safeText(req.clientId ?? '');

  const {
    data: profile,
    isLoading,
    isError: profileFailed,
    isFetching: profileFetching,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: oauthAppProfileKey(req.clientId ?? ''),
    queryFn: (): Promise<AppProfile | null> =>
      req.clientId ? loadAppProfile(req.clientId) : Promise.resolve(null),
    enabled: !!req.clientId && clientIdValid,
  });
  const {
    data: account,
    refetch: refetchAccount,
    isError: accountFailed,
    isFetching: accountFetching,
    isLoading: accountLoading,
  } = useQuery({
    queryKey: accountKey(selectedAccount),
    queryFn: (): Promise<Account | null> =>
      selectedAccount ? getAccount(selectedAccount) : Promise.resolve(null),
    enabled: !!selectedAccount,
  });

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // The passcode that unlocked the account on this screen, held only when
  // the active key turned out to be missing, so adding it does not ask for
  // the passcode a second time. Gone with the screen.
  const [unlockedWith, setUnlockedWith] = useState<{
    account: string;
    passcode: string | undefined;
  } | null>(null);
  // Set once the user leaves (or sets off to), so an in-flight approve()
  // cannot grant authority or redirect after they withdrew consent.
  const abandoned = useLeaveLatch();
  const queryClient = useQueryClient();
  // A grant went out from this screen: its account now reads as granted,
  // but the screen must not turn into a sign-in on the way to the app.
  const [granting, setGranting] = useState(false);

  // A request with NO app account is a site asking only to confirm who the
  // user is (hivesearcher and the like): it holds no posting authority and
  // gets a bare login token, whatever scope it named. There is no profile to
  // check a registration against, so the callback is held to being a secure
  // URL, and the consent names its host as the requester. This is what the
  // Nuxt app did, minus the plain-http case.
  const loginOnly = !req.clientId;
  // A login-only request always answers with a login token as access_token:
  // a `code` response is the app-side exchange flow, and there is no app.
  const effective: AuthRequest = loginOnly
    ? { ...req, scope: 'login', responseType: 'token' }
    : req;
  const authority = authorityForScope(effective.scope);
  const isUnlocked = !!selectedAccount && unlocked.includes(selectedAccount);
  const keys = selectedAccount ? getKeys(selectedAccount) : null;
  const signingKey = tokenSigner(authority, keys)?.wif;
  const callback = req.redirectUri ?? '';
  const registered = profile
    ? isRegisteredRedirect(profile, callback)
    : loginOnly
      ? isValidRedirectUri(callback)
      : false;
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
  // Asked for in place, so the request stays on screen: sending the user to
  // /import for a key the account is merely missing lost them the flow.
  const needsActiveKey =
    isUnlocked && !keys?.active && (grantNeeded || authority === 'active');
  // Nothing new is granted: a login, or a posting request from an app this
  // account authorized before. The user is signing in, and the screen says so
  // instead of presenting the scope as a fresh request every visit (#145). An
  // active-scope request is never one: its token is signed with the active
  // key, which the posting grant says nothing about.
  const signIn =
    !granting &&
    !!selectedAccount &&
    (effective.scope === 'login' ||
      (postingScope &&
        authority === 'posting' &&
        !!account &&
        hasGrant(account.posting, req.clientId as string)));

  async function approve() {
    setError(null);
    // Read now, not from this render: an unlock in the same click has only
    // just put the keys in memory.
    const keys = selectedAccount ? getKeys(selectedAccount) : null;
    const signer = tokenSigner(authority, keys);
    if (!selectedAccount || !signer) return;
    // Enforce redirect_uri registration (the Nuxt app does not; we do). A
    // site with no app account has nothing to register; its callback only
    // has to be a secure URL.
    if (!registered || (!loginOnly && !profile)) {
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
        // Read fresh first, so a retry after a grant that already landed sees
        // the authority and does not broadcast a second account_update. By
        // name, and never the cached copy when the read fails (readAccountNow).
        let loaded: Account | null;
        try {
          loaded = await readAccountNow(queryClient, selectedAccount);
        } catch {
          setError(t('authorize.read_failed'));
          return;
        }
        // Re-check here, BEFORE the broadcast. The read is awaited, so the
        // user can cancel while it is in flight; granting posting authority is
        // an irreversible on-chain write, so withdrawn consent has to stop it
        // at this point, not merely stop the token afterwards. Another tab
        // may also have selected someone else: the screen now names them, so
        // nothing is done for the account it showed before.
        if (abandoned.current || !stillSelected(selectedAccount)) return;
        if (!loaded) {
          setError(t('common.try_again'));
          return;
        }
        if (!hasGrant(loaded.posting, req.clientId)) {
          // The screen said nothing new would be granted: it was judged on a
          // cached account that still showed the grant (revoked since, or a
          // lagging read). The refetch has just redrawn it as a first-time
          // request, so the user is asked again with that on screen.
          if (!grantNeeded) return;
          const activeKey = keys?.active;
          if (!activeKey) {
            setError(
              t('authorize.active_key_needed', {
                account: `@${selectedAccount}`,
              }),
            );
            return;
          }
          const op = buildGrantOperation(loaded, req.clientId);
          setGranting(true);
          if (op) await broadcastOperations([op], activeKey, loaded.name);
          // Wait for the grant to be visible on-chain before issuing the token.
          if (!(await waitForGrant(loaded.name, req.clientId))) {
            setError(t('authorize.still_confirming'));
            return;
          }
          await readAccountNow(queryClient, selectedAccount).catch(() => null);
        }
      }
      // The grant poll can run for up to 16s. If the user left the consent
      // screen in the meantime (Cancel, or navigating away), do NOT hand the app
      // a token and redirect them - they withdrew consent mid-flow.
      if (abandoned.current || !stillSelected(selectedAccount)) return;
      const token = buildAuthToken(
        effective,
        selectedAccount,
        signer.wif,
        signer.role,
      );
      window.location.assign(
        buildRedirectUrl(callback, token, effective, selectedAccount),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const unregistered =
    !!req.clientId && !!callback && profile != null && !registered;
  const appMissing = !!req.clientId && (!clientIdValid || profile === null);
  // A no-app site's callback, classified: plain http off loopback is
  // INSECURE (the token is a week-long proof of the username, not something
  // to send in the clear); anything that is not an http(s) URL at all is
  // INVALID. Different advice, different signal.
  const callbackKind = (() => {
    if (!loginOnly || !callback) return 'ok';
    try {
      const u = new URL(callback);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return 'invalid';
      return registered ? 'ok' : 'insecure';
    } catch {
      return 'invalid';
    }
  })();
  const insecure = callbackKind === 'insecure';
  const invalid = callbackKind === 'invalid';
  // A request that cannot be approved. Nothing that asks for a key (adding an
  // account, unlocking one, adding its active key) is offered on its behalf.
  const refused = appMissing || unregistered || insecure || invalid;
  // A read that failed, as opposed to one still running: without this the
  // screen waited on a disabled button for ever.
  const readFailed =
    (!!req.clientId && profileFailed && profile === undefined) ||
    (postingScope && accountFailed && account === undefined);
  const verb = signIn ? t('authorize.sign_in') : t('authorize.authorize');
  const grantNotice = grantNeeded && (
    <div className={alertWarn}>
      <Sentence
        k="authorize.first_time_grant"
        values={{ app: `@${clientLabel}` }}
        bold
      />
    </div>
  );
  // The two integration failures an app author can fix, reported once per
  // screen: which app, and which callback host. Never the callback itself.
  useEffect(() => {
    if (unregistered) {
      reportIntegrationIssue('redirect_not_registered', {
        app: req.clientId,
        callback_host: hostOf(callback),
      });
    } else if (appMissing) {
      reportIntegrationIssue('app_not_found', { app: req.clientId });
    } else if (insecure) {
      reportIntegrationIssue('callback_insecure', {
        callback_host: hostOf(callback),
      });
    } else if (invalid) {
      reportIntegrationIssue('callback_invalid', {});
    }
  }, [unregistered, appMissing, insecure, invalid, req.clientId, callback]);

  // The account decides between a first-time request and a sign-in, so a
  // posting request waits for it as well as for the app: otherwise a returning
  // user watched the request turn into a sign-in as the second read landed.
  if (isLoading || (postingScope && accountLoading)) {
    return <section className={page}>…</section>;
  }

  // No callback is not a request anyone can approve: there is nowhere to
  // send the answer.
  if (!req.redirectUri) {
    return (
      <IncompleteRequest
        app={req.clientId}
        callbackHost={hostOf(req.redirectUri)}
      />
    );
  }

  // Attacker-controlled: profile.name is the app account's own on-chain
  // metadata and clientId comes from the URL. Strip control and bidi characters
  // for the same reason the confirm screen does.
  const appName = safeText(
    profile?.name ?? req.clientId ?? t('authorize.this_site'),
  );

  return (
    <section className={page}>
      <div className="flex flex-col gap-2 text-center">
        {loginOnly ? (
          // No app account: the requester IS the callback host, which is the
          // one thing about it the user can check.
          <h1 className="m-0 text-[19px] font-bold break-words sm:text-xl">
            <Sentence
              k="authorize.request_verify"
              values={{ site: callbackHost ?? '?' }}
              bold
            />
          </h1>
        ) : (
          <>
            {/* The app account's OWN avatar, keyed on client_id rather than
                on the display name: client_id is the part of the identity the
                app cannot rename, so the picture and the name below it agree. */}
            <Avatar
              username={req.clientId ?? ''}
              size="lg"
              className="mx-auto"
            />
            <h1 className="m-0 text-[19px] font-bold break-words sm:text-xl">
              {/* Keyed: a different sentence is built fresh, not reworked
                  (see lib/translation-guard.ts). */}
              <Sentence
                key={signIn ? 'sign-in' : 'request'}
                k={signIn ? 'authorize.sign_in_to' : 'authorize.request_access'}
                values={{ app: appName }}
                bold
              />
            </h1>
          </>
        )}
        {/* profile.name is the app account's OWN self-declared metadata, so an
            account like `ecency-login` can call itself "Ecency". Always show the
            real client_id and the callback host: those are what the grant and
            the redirect actually use, and they cannot be renamed. */}
        <div className={mutedXs}>
          {!loginOnly && (
            <>
              {t('authorize.hive_account')}{' '}
              <b translate="no">{`@${clientLabel}`}</b>
            </>
          )}
          {callbackHost && (
            <>
              {loginOnly ? '' : ' · '}
              <Sentence
                k="authorize.sends_you_to"
                values={{ host: callbackHost }}
                bold
              />
            </>
          )}
        </div>
      </div>

      {insecure && (
        <>
          <div className={alertError}>{t('authorize.callback_insecure')}</div>
          <ReportIssue
            kind="callback_insecure"
            tags={{ callback_host: hostOf(callback) }}
          />
        </>
      )}

      {invalid && (
        <>
          <div className={alertError}>{t('authorize.callback_invalid')}</div>
          <ReportIssue kind="callback_invalid" />
        </>
      )}

      {appMissing && (
        <>
          <div className={alertError}>
            <Sentence
              k="authorize.app_not_found"
              values={{ app: `@${clientLabel}` }}
            />
          </div>
          <ReportIssue kind="app_not_found" tags={{ app: req.clientId }} />
        </>
      )}

      {unregistered && (
        <>
          <div className={alertError}>
            {t('authorize.redirect_not_registered')}
          </div>
          <ReportIssue
            kind="redirect_not_registered"
            tags={{ app: req.clientId, callback_host: hostOf(callback) }}
          />
        </>
      )}

      {/* The scope, in the words the landing page uses. A posting request
          lists what the app will be able to do and says it is one grant; a
          login request is one line, because that is all it is. An app this
          account already authorized gets one line too: it is shown the
          first time, like any sign-in, not on every visit. */}
      {signIn && postingScope ? (
        <p className={`${mutedXs} text-center`}>
          <Sentence
            k="authorize.already_authorized"
            values={{ app: `@${clientLabel}` }}
            bold
          />
        </p>
      ) : (
        <div className={`${card} text-sm`}>
          <div className="mb-1 text-xs text-muted">{t('authorize.scope')}</div>
          {effective.scope === 'login' ? (
            <div className="font-semibold">{t('authorize.scope_login')}</div>
          ) : (
            <PostingAbilities app={clientLabel} compact />
          )}
        </div>
      )}

      {error && (
        <div role="alert" className={alertError}>
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {/* Which account this token is for, above every state that has one:
            locked, missing a key, or ready. A wrong selected account used to
            be silent until the app received a token for someone else. */}
        {selectedAccount && (
          <CurrentAccount
            username={selectedAccount}
            label={
              signIn
                ? t('authorize.signing_in_as')
                : t('authorize.authorizing_as')
            }
            next={window.location.pathname + window.location.search}
            busy={busy}
          />
        )}
        {refused ? (
          <button type="button" disabled className={btnPrimary}>
            {verb}
          </button>
        ) : readFailed ? (
          <>
            <div role="alert" className={alertError}>
              {t('authorize.read_failed')}
            </div>
            <button
              type="button"
              disabled={profileFetching || accountFetching}
              onClick={() => {
                if (profileFailed) refetchProfile();
                if (accountFailed) refetchAccount();
              }}
              className={btnSecondary}
            >
              {profileFetching || accountFetching ? '…' : t('authorize.retry')}
            </button>
          </>
        ) : !selectedAccount ? (
          <Link
            to="/import"
            search={{ next: window.location.pathname + window.location.search }}
            className={btnPrimary}
          >
            {t('common.continue')}
          </Link>
        ) : !isUnlocked ? (
          // The passcode on this screen, and one click signs in (#145). The
          // grant need is read from the chain, so a first-time grant still
          // says so before the click; a missing active key only shows once
          // the keys are open, and the screen then asks for it in place.
          <>
            {grantNotice}
            <UnlockAndContinue
              key={`unlock:${selectedAccount}`}
              username={selectedAccount}
              action={verb}
              disabled={postingScope && !accountLoaded}
              // Only on a sign-in: a first-time request is read first.
              autoFocus={signIn}
              onUnlocked={(passcode) => {
                const active = getKeys(selectedAccount)?.active;
                // Held whenever the active key is missing, not only when the
                // grant is known to need it: a sign-in judged on a cached
                // account can turn into a first-time grant on the fresh read.
                if (!active) {
                  setUnlockedWith({ account: selectedAccount, passcode });
                }
                if (!active && (grantNeeded || authority === 'active')) return;
                approve();
              }}
            />
          </>
        ) : postingScope && !accountLoaded ? (
          // Never issue a posting token before we can confirm the on-chain
          // grant, and never ask for a key before knowing it is needed.
          <button type="button" disabled className={btnPrimary}>
            …
          </button>
        ) : needsActiveKey ? (
          <>
            {grantNotice}
            <AddActiveKey
              username={selectedAccount}
              // Built afresh once the passcode is held: the unlock renders this form
              // a moment before the passcode reaches it, and focus is only taken on
              // mount.
              key={unlockedWith?.account === selectedAccount ? 'held' : 'ask'}
              {...(unlockedWith?.account === selectedAccount && {
                passcode: unlockedWith.passcode,
                autoFocus: true,
                onAdded: () => setUnlockedWith(null),
              })}
            />
          </>
        ) : !signingKey ? (
          // Neither posting nor active on this device (a memo-only import)
          // and no first-time grant to add the active key for.
          <Link
            to="/import"
            search={{ next: window.location.pathname + window.location.search }}
            className={btnPrimary}
          >
            <Sentence
              k="authorize.add_key_to_continue"
              values={{ account: `@${selectedAccount}` }}
            />
          </Link>
        ) : (
          <>
            {grantNotice}
            <button
              type="button"
              onClick={approve}
              disabled={busy}
              className={btnPrimary}
            >
              {busy ? '…' : verb}
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

/** A request naming no app or no callback: refused, reported, reportable. */
function IncompleteRequest({
  app,
  callbackHost,
}: {
  app?: string;
  callbackHost?: string;
}) {
  const { t } = useTranslation();
  useEffect(() => {
    reportIntegrationIssue('consent_incomplete', {
      app,
      callback_host: callbackHost,
    });
  }, [app, callbackHost]);
  return (
    <section className={page}>
      <div role="alert" className={alertError}>
        {t('errors.invalid_consent_request')}
      </div>
      <ReportIssue
        kind="consent_incomplete"
        tags={{ app, callback_host: callbackHost }}
      />
    </section>
  );
}
