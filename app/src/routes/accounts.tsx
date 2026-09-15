import { createFileRoute, Link } from '@tanstack/react-router';
import { type CSSProperties, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  accountIsEncrypted,
  isUnlocked,
  removeAccount,
  selectAccount,
  unlockAccount,
} from '@/lib/accounts';
import { useAccounts } from '@/lib/use-accounts';

// The account switcher (#106 pain #5): every stored account with its state,
// switching that never logs the others out, and inline unlock for encrypted
// accounts. A plain account switches on click; an encrypted one asks for its
// passcode first.
export const Route = createFileRoute('/accounts')({
  component: Accounts,
});

const fld: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  height: 44,
  padding: '0 12px',
  border: '1px solid #d1d9e0',
  borderRadius: 8,
  fontSize: 15,
};

function AccountRow({
  username,
  current,
}: {
  username: string;
  current: boolean;
}) {
  const { t } = useTranslation();
  const encrypted = accountIsEncrypted(username);
  const unlocked = isUnlocked(username);
  const [unlocking, setUnlocking] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function activate() {
    if (unlocked) {
      selectAccount(username);
      return;
    }
    if (encrypted) {
      // Needs a passcode: open the inline form.
      setUnlocking(true);
      return;
    }
    // Plaintext but not yet in memory (e.g. just after a reload): load and select.
    setBusy(true);
    try {
      await unlockAccount(username);
      selectAccount(username);
    } finally {
      setBusy(false);
    }
  }

  async function submitUnlock() {
    setError(null);
    setBusy(true);
    try {
      await unlockAccount(username, passcode);
      selectAccount(username);
      setUnlocking(false);
      setPasscode('');
    } catch {
      setError(t('login.invalid_hs_password'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 10,
        background: current ? '#fff5f6' : '#fff',
        border: '1px solid #d1d9e0',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: '#ffe3e8',
            color: '#b90f2e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            flex: 'none',
            textTransform: 'uppercase',
          }}
        >
          {username[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>@{username}</div>
          <div
            style={{
              fontSize: 12,
              color: '#59636e',
              display: 'flex',
              gap: 6,
              marginTop: 2,
            }}
          >
            {current && (
              <span style={{ color: '#b90f2e', fontWeight: 600 }}>Current</span>
            )}
            {encrypted ? (unlocked ? 'Unlocked' : 'Protected') : 'No passcode'}
          </div>
        </div>
        {(!current || !unlocked) && (
          <button
            type="button"
            onClick={activate}
            disabled={busy}
            style={{
              border: 'none',
              background: 'none',
              color: '#b90f2e',
              fontWeight: 600,
              fontSize: 13,
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
          >
            {!unlocked ? t('accounts.unlock') : t('login.switch_an_account')}
          </button>
        )}
        <button
          type="button"
          aria-label={`${t('accounts.delete')} @${username}`}
          onClick={() => {
            // Removing wipes the only copy of the keys on this device; confirm.
            if (
              window.confirm(
                `Remove @${username} from this device? Its keys here will be deleted.`,
              )
            ) {
              removeAccount(username);
            }
          }}
          style={{
            border: 'none',
            background: 'none',
            color: '#59636e',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>

      {unlocking && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            style={fld}
            type="password"
            name={`passcode-${username}`}
            placeholder="Passcode"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            // biome-ignore lint/a11y/noAutofocus: focus the field the user just opened
            autoFocus
          />
          {error && (
            <div role="alert" style={{ fontSize: 12.5, color: '#cf222e' }}>
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={submitUnlock}
            disabled={busy || passcode.length === 0}
            style={{
              height: 44,
              border: 'none',
              borderRadius: 8,
              background: busy || !passcode ? '#f0a5b3' : '#E31337',
              color: '#fff',
              fontWeight: 600,
              cursor: busy || !passcode ? 'not-allowed' : 'pointer',
            }}
          >
            {t('accounts.unlock')}
          </button>
        </div>
      )}
    </div>
  );
}

function Accounts() {
  const { t } = useTranslation();
  const { usernames, selectedAccount } = useAccounts();

  return (
    <section
      style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
        {t('accounts.accounts')}
      </h1>

      {usernames.length === 0 ? (
        <p style={{ fontSize: 14, color: '#59636e' }}>
          <Link to="/import">{t('accounts.add_another')}</Link>
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {usernames.map((u) => (
            <AccountRow key={u} username={u} current={u === selectedAccount} />
          ))}
        </div>
      )}

      <Link
        to="/import"
        style={{
          alignSelf: 'flex-start',
          height: 44,
          padding: '0 16px',
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: 8,
          border: '1px dashed #c4ccd4',
          color: '#1f2328',
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        + {t('accounts.add_another')}
      </Link>
    </section>
  );
}
