import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AddActiveKey } from '@/components/AddActiveKey';
import { AppProfile } from '@/components/AppProfile';
import { Avatar } from '@/components/Avatar';
import {
  alertError,
  alertOk,
  btnPrimary,
  btnSecondary,
  card,
  formColumn,
  h1,
  page,
} from '@/components/ui';
import { getKeys } from '@/lib/accounts';
import {
  buildGrantOperation,
  buildRevokeOperation,
  hasGrant,
  waitForGrant,
} from '@/lib/grant';
import { type Account, getAccount } from '@/lib/hive';
import { grantReturnTarget } from '@/lib/oauth';
import { safeText } from '@/lib/operation-summary';
import { accountKey } from '@/lib/query-keys';
import { broadcastOperations } from '@/lib/sign-tx';
import { useAccounts } from '@/lib/use-accounts';

// Shared screen for /authorize/:username and /revoke/:username. Grant or revoke
// the app's posting authority with the selected account's ACTIVE key.

export function GrantAction({
  appName,
  mode,
  query = {},
}: {
  appName: string;
  mode: 'grant' | 'revoke';
  /** The route's query: the legacy detour carries the callback here. */
  query?: Record<string, string | undefined>;
}) {
  const { t } = useTranslation();
  const { selectedAccount, unlocked } = useAccounts();
  const navigate = useNavigate();
  // Where to go once the broadcast has landed, if this page was reached with a
  // callback. Null means "no callback", or a revoke: the list screen.
  const returnTarget = grantReturnTarget(appName, query, mode);
  const listTo = mode === 'grant' ? '/accounts' : '/authorized-apps';
  // Set when this screen is left, so an in-flight submit() cannot navigate
  // after the user pressed Cancel. Setup clears it: Strict Mode runs
  // setup -> cleanup -> setup, so a cleanup-only effect would leave the latch
  // stuck on in development.
  const abandoned = useRef(false);
  useEffect(() => {
    abandoned.current = false;
    return () => {
      abandoned.current = true;
    };
  }, []);
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState<'idle' | 'busy' | 'done' | 'error'>(
    'idle',
  );
  const [error, setError] = useState('');

  const {
    data: account,
    refetch,
    isError: accountFailed,
    isFetching: accountFetching,
  } = useQuery({
    queryKey: accountKey(selectedAccount),
    queryFn: (): Promise<Account | null> =>
      selectedAccount ? getAccount(selectedAccount) : Promise.resolve(null),
    enabled: !!selectedAccount,
  });

  const isUnlocked = !!selectedAccount && unlocked.includes(selectedAccount);
  const activeKey = selectedAccount
    ? getKeys(selectedAccount)?.active
    : undefined;

  const op = account
    ? mode === 'grant'
      ? buildGrantOperation(account, appName)
      : buildRevokeOperation(account, appName)
    : null;
  // A grant already present (or a revoke of something absent) is a no-op.
  const alreadyDone =
    !!account &&
    (mode === 'grant' ? hasGrant(account.posting, appName) : op === null);

  async function submit() {
    if (!account || !activeKey || !op) return;
    setStatus('busy');
    setError('');
    try {
      await broadcastOperations([op], activeKey, account.name);
      setStatus('done');
      // The Nuxt page continued to the callback by itself after the broadcast,
      // and the login that brought the user here is waiting on it. Automatic
      // only when there IS a callback; with none the page shows its result.
      //
      // Not before the grant is VISIBLE. A read straight after the broadcast
      // can lag block inclusion, and the consent screen at the callback
      // re-checks the authority: arriving early, it would ask for the grant
      // again and broadcast a second account_update.
      if (returnTarget && mode === 'grant') {
        setConfirming(true);
        const visible = await waitForGrant(account.name, appName);
        setConfirming(false);
        await refetch();
        if (abandoned.current) return;
        if (visible) navigate(returnTarget as never);
        return;
      }
      await refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
    }
  }

  const verb = mode === 'grant' ? t('authorize.authorize') : t('revoke.revoke');
  // The app name comes from the URL: shown only with control and bidi
  // characters stripped.
  const appLabel = safeText(appName);

  // The states that sit between "unlocked" and "act", each with its own
  // answer. `undefined` is a read still running or one that failed; `null` is
  // an account the chain does not know. Both used to leave a button that did
  // nothing, for ever.
  const pending =
    !!selectedAccount && isUnlocked && !alreadyDone && status !== 'done';
  const readFailed = pending && account === undefined && accountFailed;
  const accountMissing = pending && account === null;
  // An unlocked account without its active key is asked for it in place. The
  // unlock link this used to show led to an account that was already
  // unlocked, and the request was lost on the way.
  const askForKey = pending && !!account && !activeKey;

  return (
    // A confirm-and-act screen, so it stays one readable column instead of
    // stretching the sentence across the widened shell.
    <section className={`${page} ${formColumn} sm:max-w-xl`}>
      {/* `appName` is a rendered value taken from the URL, so let it wrap
          rather than push the page sideways at 320px. */}
      <h1 className={`${h1} flex flex-wrap items-center gap-2 break-words`}>
        <Avatar username={appName} size="md" />
        <span className="min-w-0 break-words [unicode-bidi:isolate]">
          {`${verb} @${appLabel}`}
        </span>
      </h1>

      {/* Who the app claims to be, before deciding to let it post. The
          directory used to show this and the rewrite dropped it. */}
      <AppProfile username={appName} />

      <div className={`${card} text-sm break-words`}>
        {/* The account is part of the CLAIM this sentence makes, so it cannot
            be interpolated when there is no account: logged out, this read
            "@ecency.app will be able to post, comment, vote and follow as @."
            - a consent sentence naming nobody. */}
        {!selectedAccount
          ? // Review caught this: branching on the account alone told a user
            // opening /revoke/:app that the app "is asking to post ... on your
            // behalf", the exact opposite of what the page does.
            t(
              mode === 'grant'
                ? 'authorize.grant_explain_no_account'
                : 'revoke.revoke_explain_no_account',
              { app: appLabel },
            )
          : mode === 'grant'
            ? t('authorize.grant_explain', {
                app: appLabel,
                account: selectedAccount,
              })
            : t('revoke.revoke_explain', {
                app: appLabel,
                account: selectedAccount,
              })}
        <div className="mt-2 text-[12.5px] text-warn">
          {t('authorize.requires_active_key', { authority: 'active' }).replace(
            /<\/?b>/g,
            '',
          )}
        </div>
      </div>

      {status === 'done' || alreadyDone ? (
        <output className={`${alertOk} block text-sm font-semibold`}>
          {/* Granted but not yet readable from the chain: say so, and leave
              Continue in place. The consent screen it leads to re-checks the
              authority itself. One string, because the ellipsis goes away
              while the screen is open (see lib/translation-guard.ts). */}
          {`${
            mode === 'grant'
              ? t('authorize.granted', { app: appLabel })
              : t('revoke.revoked', { app: appLabel })
          }${status === 'done' && confirming ? ' …' : ''}`}
        </output>
      ) : null}

      {status === 'error' && (
        <div role="alert" className={`${alertError} break-words`}>
          {error}
        </div>
      )}

      {readFailed && (
        <div role="alert" className={alertError}>
          {t('authorize.read_failed')}
        </div>
      )}
      {accountMissing && (
        <div role="alert" className={alertError}>
          {t('authorize.account_missing', { account: selectedAccount })}
        </div>
      )}
      {/* Above the actions, not in their row: the form is a block of its own
          and would otherwise be squeezed beside Cancel from sm up. */}
      {askForKey && selectedAccount && (
        <AddActiveKey username={selectedAccount} />
      )}

      {/* Full-width actions on a phone; from sm they sit inline at their own
          width with the cancel link beside them. */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        {!selectedAccount ? (
          <Link to="/import" className={btnPrimary}>
            {t('common.continue')}
          </Link>
        ) : !isUnlocked ? (
          <Link to="/accounts" className={btnPrimary}>
            {`${t('accounts.unlock')} @${selectedAccount}`}
          </Link>
        ) : alreadyDone || status === 'done' ? (
          // Already granted, or just granted: continue to the callback that
          // brought the user here, or to the account list when there is none.
          <Link
            to={returnTarget ? returnTarget.to : listTo}
            search={returnTarget ? returnTarget.search : {}}
            className={btnPrimary}
          >
            {t('common.continue')}
          </Link>
        ) : readFailed ? (
          <button
            type="button"
            onClick={() => refetch()}
            disabled={accountFetching}
            className={btnSecondary}
          >
            {accountFetching ? '…' : t('authorize.retry')}
          </button>
        ) : accountMissing ? null : !account ? (
          <button type="button" disabled className={btnPrimary}>
            …
          </button>
        ) : askForKey ? null : (
          <button
            type="button"
            onClick={submit}
            disabled={status === 'busy'}
            className={`${btnPrimary} cursor-pointer`}
          >
            {status === 'busy' ? '…' : verb}
          </button>
        )}
        {/* Cancel stays live while the broadcast is in flight: it cannot undo
            an irreversible write, but it does stop the automatic navigation
            (the latch above), so the user is not pulled away later. */}
        <Link to={listTo} className="text-center text-[13px] text-muted">
          {t('common.cancel')}
        </Link>
      </div>
    </section>
  );
}
