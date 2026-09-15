import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { type CSSProperties, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

const card: CSSProperties = {
  background: '#fff',
  border: '1px solid #d1d9e0',
  borderRadius: 12,
};

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
      <section style={{ padding: 20 }}>
        <Link to="/accounts">{t('footer.login')}</Link>
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
    <section
      style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
          {t('footer.apps')}
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#59636e' }}>
          Apps that can post as <b>@{selectedAccount}</b>.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            ...card,
            padding: 12,
            background: '#ffebe9',
            borderColor: '#f0b3b3',
            color: '#cf222e',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {apps.length === 0 ? (
        <p style={{ fontSize: 14, color: '#59636e' }}>
          No apps are authorized.
        </p>
      ) : (
        <div style={{ ...card, padding: 4 }}>
          {apps.map((app, i) => (
            <div
              key={app}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 14,
                borderTop: i === 0 ? 'none' : '1px solid #eef1f4',
              }}
            >
              <div
                style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 15 }}
              >
                @{app}
              </div>
              {!isUnlocked || !activeKey ? (
                <Link
                  to="/accounts"
                  style={{ fontSize: 13, color: '#b90f2e', fontWeight: 600 }}
                >
                  {t('accounts.unlock')}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => revoke(app)}
                  disabled={busyApp === app}
                  style={{
                    border: '1px solid #d1d9e0',
                    background: '#fff',
                    color: '#cf222e',
                    fontSize: 13,
                    fontWeight: 600,
                    height: 34,
                    padding: '0 14px',
                    borderRadius: 8,
                    cursor: busyApp === app ? 'not-allowed' : 'pointer',
                  }}
                >
                  {busyApp === app ? '…' : t('revoke.revoke')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 12, color: '#59636e' }}>
        Revoking is an on-chain change and needs your active key once.
      </p>
    </section>
  );
}
