import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { type CSSProperties, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getKeys } from '@/lib/accounts';
import { type Account, getAccount, type KeyRole } from '@/lib/hive';
import { useAccounts } from '@/lib/use-accounts';

// View the selected account's authorities: the key/account auths on each role,
// and (for roles this device holds) reveal the private key.
export const Route = createFileRoute('/auths')({
  component: Auths,
});

const card: CSSProperties = {
  background: '#fff',
  border: '1px solid #d1d9e0',
  borderRadius: 12,
  padding: 16,
};

const ROLES: Exclude<KeyRole, 'memo'>[] = ['owner', 'active', 'posting'];

function Auths() {
  const { t } = useTranslation();
  const { selectedAccount } = useAccounts();
  const { data: account } = useQuery({
    queryKey: ['account', selectedAccount],
    queryFn: (): Promise<Account | null> =>
      selectedAccount ? getAccount(selectedAccount) : Promise.resolve(null),
    enabled: !!selectedAccount,
  });
  const keys = selectedAccount ? getKeys(selectedAccount) : null;
  const [revealed, setRevealed] = useState<KeyRole | null>(null);

  if (!selectedAccount) {
    return (
      <section style={{ padding: 20 }}>
        <Link to="/accounts">{t('footer.login')}</Link>
      </section>
    );
  }

  return (
    <section
      style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
        {t('auths.auths')} · @{selectedAccount}
      </h1>

      {ROLES.map((role) => {
        const authority = account?.[role];
        const heldKey = keys?.[role];
        return (
          <div
            key={role}
            style={{
              ...card,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ fontWeight: 700, textTransform: 'capitalize' }}>
              {role}
            </div>
            {authority?.key_auths.map(([k, w]) => (
              <div
                key={k}
                style={{
                  fontSize: 12,
                  fontFamily: 'ui-monospace, monospace',
                  wordBreak: 'break-all',
                  color: '#59636e',
                }}
              >
                {k} · {t('auths.weight')} {w}
              </div>
            ))}
            {authority?.account_auths.map(([a, w]) => (
              <div
                key={a}
                style={{
                  fontSize: 13,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>
                  @{a} · {t('auths.weight')} {w}
                </span>
                {/* Revoke removes an account from posting and active, signed with
                    the active key. An OWNER delegation needs the owner key, so
                    offering the same link here reported success while changing
                    nothing. Say so instead of pretending. */}
                {role === 'owner' ? (
                  <span style={{ fontSize: 11.5, color: '#59636e' }}>
                    owner delegation: remove with your owner key
                  </span>
                ) : (
                  <Link
                    to="/revoke/$username"
                    params={{ username: a }}
                    style={{ color: '#cf222e', fontWeight: 600, fontSize: 12 }}
                  >
                    {t('revoke.revoke')}
                  </Link>
                )}
              </div>
            ))}
            {heldKey && (
              <div style={{ marginTop: 4 }}>
                {revealed === role ? (
                  <code
                    style={{
                      fontSize: 11,
                      wordBreak: 'break-all',
                      color: '#1f2328',
                    }}
                  >
                    {heldKey}
                  </code>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRevealed(role)}
                    style={{
                      border: '1px solid #d1d9e0',
                      background: '#fff',
                      borderRadius: 8,
                      padding: '6px 12px',
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {t('auths.reveal_private_key')}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
