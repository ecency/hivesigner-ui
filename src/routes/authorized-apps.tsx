import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
import { UnlockAndContinue } from '@/components/UnlockAndContinue';
import {
  alertError,
  cardGrid,
  cardTight,
  h1,
  link,
  muted,
  mutedXs,
  page,
} from '@/components/ui';
import { readAccountNow } from '@/lib/account-now';
import { getKeys, stillSelected } from '@/lib/accounts';
import { authorizedApps, buildRevokeOperation } from '@/lib/grant';
import { type Account, getAccount } from '@/lib/hive';
import { accountKey } from '@/lib/query-keys';
import { broadcastOperations } from '@/lib/sign-tx';
import { useAccounts } from '@/lib/use-accounts';
import { useLeaveLatch } from '@/lib/use-leave-latch';

// The authorized-apps manager (#106 pain #3): every app that can post as the
// selected account, with revoke on each row. Revoking is an account_update with
// the active key.
export const Route = createFileRoute('/authorized-apps')({
  component: AuthorizedApps,
});

const revokeButton =
  'inline-flex h-[34px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-line bg-surface px-3.5 text-[13px] font-semibold text-danger disabled:cursor-not-allowed';

function AuthorizedApps() {
  const { t } = useTranslation();
  const { selectedAccount, unlocked } = useAccounts();
  const qc = useQueryClient();
  const [busyApp, setBusyApp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const leave = useLeaveLatch();

  const { data: account } = useQuery({
    queryKey: accountKey(selectedAccount),
    queryFn: (): Promise<Account | null> =>
      selectedAccount ? getAccount(selectedAccount) : Promise.resolve(null),
    enabled: !!selectedAccount,
  });

  if (!selectedAccount) {
    return (
      <section className={page}>
        <Link to="/accounts" className={link}>
          {t('footer.login')}
        </Link>
      </section>
    );
  }

  const isUnlocked = unlocked.includes(selectedAccount);
  const activeKey = getKeys(selectedAccount)?.active;
  const apps = account ? authorizedApps(account) : [];

  async function revoke(app: string) {
    const left = leave.mark();
    const name = selectedAccount;
    if (!name || !activeKey) return;
    setError(null);
    setBusyApp(app);
    try {
      // Built from a fresh read by name, never the cached copy: the
      // account_update carries the WHOLE authority, and a grant made
      // elsewhere since the page loaded would be undone by a stale one.
      let fresh: Account | null;
      try {
        fresh = await readAccountNow(qc, name);
      } catch {
        setError(t('authorize.read_failed'));
        return;
      }
      // The read is awaited: a user who left meanwhile, or whose other tab
      // selected someone else, gets no on-chain change for this click.
      if (left() || !stillSelected(name)) return;
      // No account came back (a lagging node): nothing to build on.
      if (!fresh) {
        setError(t('common.try_again'));
        return;
      }
      // null: the app holds no authority any more, nothing to revoke.
      const op = buildRevokeOperation(fresh, app);
      if (op) await broadcastOperations([op], activeKey, fresh.name);
      await qc.invalidateQueries({ queryKey: accountKey(selectedAccount) });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyApp(null);
    }
  }

  return (
    <section className={page}>
      <div>
        <h1 className={h1}>{t('footer.apps')}</h1>
        <p className={`${muted} mt-1`}>
          <Trans
            i18nKey="apps.can_post_as"
            values={{ account: `@${selectedAccount}` }}
            // The account is data: exact, and in its own direction.
            components={{ b: <b translate="no" /> }}
          />
        </p>
      </div>

      {error && (
        <div role="alert" className={alertError}>
          {error}
        </div>
      )}

      {!isUnlocked && (
        // Unlocked in place (#146); the revoke buttons follow.
        <div className="sm:max-w-md">
          <UnlockAndContinue
            key={`unlock:${selectedAccount}`}
            username={selectedAccount}
            action={t('accounts.unlock')}
            leave={leave}
            onUnlocked={() => {}}
          />
        </div>
      )}

      {apps.length === 0 ? (
        <p className={muted}>{t('apps.none_authorized')}</p>
      ) : (
        <div className={cardGrid}>
          {apps.map((app) => (
            <div key={app} className={`${cardTight} flex items-center gap-3`}>
              <Avatar username={app} size="md" />
              <div
                className="min-w-0 flex-1 break-all text-[15px] font-semibold"
                translate="no"
              >
                <bdi>{`@${app}`}</bdi>
              </div>
              {!isUnlocked || !activeKey ? (
                // The revoke page asks for the passcode and, when missing,
                // the active key in place.
                <Link
                  to="/revoke/$username"
                  params={{ username: app }}
                  className={revokeButton}
                >
                  {t('revoke.revoke')}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => revoke(app)}
                  disabled={busyApp === app}
                  className={revokeButton}
                >
                  {busyApp === app ? '…' : t('revoke.revoke')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <p className={mutedXs}>{t('apps.revoke_needs_active')}</p>
    </section>
  );
}
