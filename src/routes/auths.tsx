import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
import {
  btnGhost,
  card,
  cardGrid,
  h1,
  link,
  mono,
  mutedXs,
  page,
  row,
} from '@/components/ui';
import { getKeys } from '@/lib/accounts';
import { type Account, getAccount, type KeyRole } from '@/lib/hive';
import { useAccounts } from '@/lib/use-accounts';

// View the selected account's authorities: the key/account auths on each role,
// and (for roles this device holds) reveal the private key.
export const Route = createFileRoute('/auths')({
  component: Auths,
});

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
      <section className={page}>
        <Link to="/accounts" className={link}>
          {t('footer.login')}
        </Link>
      </section>
    );
  }

  return (
    <section className={page}>
      <h1 className={`${h1} flex flex-wrap items-center gap-2`}>
        <Avatar username={selectedAccount} size="md" />
        <span>
          {t('auths.auths')} · @{selectedAccount}
        </span>
      </h1>

      <div className={cardGrid}>
        {ROLES.map((role) => {
          const authority = account?.[role];
          const heldKey = keys?.[role];
          return (
            <div key={role} className={`${card} flex flex-col gap-2`}>
              <div className="font-bold capitalize">{role}</div>
              {authority?.key_auths.map(([k, w]) => (
                <div key={k} className={`${mutedXs} ${mono}`}>
                  {k} · {t('auths.weight')} {w}
                </div>
              ))}
              {authority?.account_auths.map(([a, w]) => (
                <div key={a} className={`${row} justify-between`}>
                  <span>
                    @{a} · {t('auths.weight')} {w}
                  </span>
                  {/* Revoke removes an account from posting and active, signed with
                      the active key. An OWNER delegation needs the owner key, so
                      offering the same link here reported success while changing
                      nothing. Say so instead of pretending. */}
                  {role === 'owner' ? (
                    <span className={mutedXs}>
                      owner delegation: remove with your owner key
                    </span>
                  ) : (
                    <Link
                      to="/revoke/$username"
                      params={{ username: a }}
                      className="text-xs font-semibold text-danger"
                    >
                      {t('revoke.revoke')}
                    </Link>
                  )}
                </div>
              ))}
              {heldKey && (
                <div className="mt-1">
                  {revealed === role ? (
                    <code className={`${mono} text-[11px] text-ink`}>
                      {heldKey}
                    </code>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setRevealed(role)}
                      className={btnGhost}
                    >
                      {t('auths.reveal_private_key')}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
