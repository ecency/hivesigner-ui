import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { type CSSProperties, type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { addAccount } from '@/lib/accounts';
import { getAccount, resolveCredential } from '@/lib/hive';
import { useAccounts } from '@/lib/use-accounts';

// Add an account: paste a Hive key or master password (validated on-chain), and
// optionally protect it on this device with a passcode. This implements the
// three-credential separation from the #106 redesign; the passcode is optional
// (sign instantly) per the reviewed mockups.
export const Route = createFileRoute('/import')({
  component: Import,
});

const USERNAME_RE = /^[a-z][a-z0-9.-]{2,15}$/;

const fld: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  height: 48,
  padding: '0 12px',
  border: '1px solid #d1d9e0',
  borderRadius: 8,
  fontSize: 15,
};

function Import() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { usernames } = useAccounts();

  const [username, setUsername] = useState('');
  const [secret, setSecret] = useState('');
  const [usePasscode, setUsePasscode] = useState(true);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canSubmit =
    USERNAME_RE.test(username.trim()) &&
    secret.trim().length > 0 &&
    (!usePasscode || passcode.length >= 4) &&
    !busy;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const name = username.trim().toLowerCase();
      const account = await getAccount(name);
      if (!account) {
        setError(t('import.invalid_username_password'));
        return;
      }
      const keys = resolveCredential(account, secret.trim());
      if (!keys) {
        setError(t('import.invalid_username_password'));
        return;
      }
      await addAccount(name, keys, usePasscode ? passcode : undefined);
      navigate({ to: '/accounts' });
    } catch {
      setError(t('common.try_again'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
          {t('import.add_account')}
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 12.5,
            lineHeight: 1.45,
            color: '#59636e',
          }}
        >
          {t('import.add_account_hint')}
        </p>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          {t('import.username')}
        </span>
        <input
          style={fld}
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="hiveuser"
        />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          {t('import.private_key')}
        </span>
        <input
          style={{ ...fld, fontFamily: 'ui-monospace, monospace' }}
          name="password"
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
        />
        <span style={{ fontSize: 12, color: '#59636e' }}>
          A posting key covers daily use. It is stored only on this device.
        </span>
      </label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13.5,
          }}
        >
          <input
            type="checkbox"
            checked={usePasscode}
            onChange={(e) => setUsePasscode(e.target.checked)}
          />
          <span>Protect with a passcode (recommended)</span>
        </label>
        {usePasscode && (
          <input
            style={fld}
            name="passcode"
            type="password"
            placeholder="Passcode"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
          />
        )}
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            background: '#ffebe9',
            border: '1px solid #f0b3b3',
            color: '#cf222e',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        style={{
          height: 50,
          border: 'none',
          borderRadius: 10,
          background: canSubmit ? '#E31337' : '#f0a5b3',
          color: '#fff',
          fontSize: 16,
          fontWeight: 600,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
        }}
      >
        {busy ? '…' : t('import.add_account')}
      </button>

      {usernames.length > 0 && (
        <p style={{ margin: 0, fontSize: 13, color: '#59636e' }}>
          {usernames.length} account{usernames.length > 1 ? 's' : ''} on this
          device.
        </p>
      )}
    </form>
  );
}
