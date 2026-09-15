import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
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
import { getKeys } from '@/lib/accounts';
import { authorizedApps, buildRevokeOperation } from '@/lib/grant';
import { type Account, getAccount } from '@/lib/hive';
import { broadcastOperations } from '@/lib/sign-tx';
import { useAccounts } from '@/lib/use-accounts';

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

  const { data: account } = useQuery({
    queryKey: ['account', selectedAccount],
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
    if (!account || !activeKey) return;
    setError(null);
    setBusyApp(app);
    try {
      const op = buildRevokeOperation(account, app);
      if (op) await broadcastOperations([op], activeKey, account.name);
      await qc.invalidateQueries({ queryKey: ['account', selectedAccount] });
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
            values={{ account: selectedAccount }}
            components={{ b: <b /> }}
          />
        </p>
      </div>

      {error && (
        <div role="alert" className={alertError}>
          {error}
        </div>
      )}

      {apps.length === 0 ? (
        <p className={muted}>{t('apps.none_authorized')}</p>
      ) : (
        <div className={cardGrid}>
          {apps.map((app) => (
            <div key={app} className={`${cardTight} flex items-center gap-3`}>
              <Avatar username={app} size="md" />
              <div className="min-w-0 flex-1 break-all text-[15px] font-semibold [unicode-bidi:isolate]">
                @{app}
              </div>
              {!isUnlocked || !activeKey ? (
                <Link
                  to="/accounts"
                  className="shrink-0 text-[13px] font-semibold text-brand-ink"
                >
                  {t('accounts.unlock')}
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

      <p className={mutedXs}>
        Revoking is an on-chain change and needs your active key once.
      </p>
    </section>
  );
}
