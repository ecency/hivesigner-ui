import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { type CSSProperties, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getKeys } from '@/lib/accounts';
import {
  buildGrantOperation,
  buildRevokeOperation,
  hasGrant,
} from '@/lib/grant';
import { type Account, getAccount } from '@/lib/hive';
import { broadcastOperations } from '@/lib/sign-tx';
import { useAccounts } from '@/lib/use-accounts';

// Shared screen for /authorize/:username and /revoke/:username. Grant or revoke
// the app's posting authority with the selected account's ACTIVE key.
const card: CSSProperties = {
  background: '#fff',
  border: '1px solid #d1d9e0',
  borderRadius: 12,
  padding: 16,
};
const btn = (enabled: boolean): CSSProperties => ({
  height: 50,
  border: 'none',
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
});

export function GrantAction({
  appName,
  mode,
}: {
  appName: string;
  mode: 'grant' | 'revoke';
}) {
  const { t } = useTranslation();
  const { selectedAccount, unlocked } = useAccounts();
  const [status, setStatus] = useState<'idle' | 'busy' | 'done' | 'error'>(
    'idle',
  );
  const [error, setError] = useState('');

  const { data: account, refetch } = useQuery({
    queryKey: ['account', selectedAccount],
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
      await refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
    }
  }

  const verb = mode === 'grant' ? t('authorize.authorize') : t('revoke.revoke');

  return (
    <section
      style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
        {verb} @{appName}
      </h1>

      <div style={{ ...card, fontSize: 14 }}>
        {mode === 'grant'
          ? `@${appName} will be able to post, comment, vote and follow as @${selectedAccount}.`
          : `@${appName} will no longer be able to act as @${selectedAccount}.`}
        <div style={{ marginTop: 8, fontSize: 12.5, color: '#7a5300' }}>
          {t('authorize.requires_active_key', { authority: 'active' }).replace(
            /<\/?b>/g,
            '',
          )}
        </div>
      </div>

      {status === 'done' || alreadyDone ? (
        <output
          style={{
            ...card,
            display: 'block',
            background: '#e6f4ea',
            borderColor: '#a7dab8',
            color: '#1a5c2b',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {mode === 'grant'
            ? `@${appName} is authorized.`
            : `@${appName} is revoked.`}
        </output>
      ) : null}

      {status === 'error' && (
        <div
          role="alert"
          style={{
            ...card,
            background: '#ffebe9',
            borderColor: '#f0b3b3',
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
        ) : !isUnlocked || !activeKey ? (
          <Link to="/accounts" style={btn(true)}>
            {t('accounts.unlock')} @{selectedAccount}
          </Link>
        ) : alreadyDone || status === 'done' ? (
          <Link to="/accounts" style={btn(true)}>
            {t('common.continue')}
          </Link>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={status === 'busy'}
            style={{ ...btn(status !== 'busy'), border: 'none' }}
          >
            {status === 'busy' ? '…' : verb}
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
