import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { type CSSProperties, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  accountIsEncrypted,
  isUnlocked,
  removeAccount,
  selectAccount,
  unlockAccount,
} from '@/lib/accounts';
import { resolveInternalPath } from '@/lib/internal-path';
import { parseSearch } from '@/lib/search';
import { useAccounts } from '@/lib/use-accounts';

// The account switcher (#106 pain #5): every stored account with its state,
// switching that never logs the others out, and inline unlock for encrypted
// accounts. A plain account switches on click; an encrypted one asks for its
// passcode first.
export const Route = createFileRoute('/accounts')({
  component: Accounts,
  // `next` is OPTIONAL: returning it as a always-present key would make
  // `search` a required prop on every <Link to="/accounts"> in the app.
  validateSearch: (search: Record<string, unknown>): { next?: string } =>
    typeof search.next === 'string' ? { next: search.next } : {},
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
  next,
}: {
  username: string;
  current: boolean;
  next?: string;
}) {
  const { t } = useTranslation();
  const encrypted = accountIsEncrypted(username);
  const unlocked = isUnlocked(username);
  const [unlocking, setUnlocking] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  function done() {
    // Return to the flow that sent the user here (an OAuth consent request
    // would otherwise be lost, forcing the app to start over).
    const back = resolveInternalPath(next);
    if (!back) return;
    // CLIENT-SIDE navigation only. Decrypted keys live in memory and are never
    // persisted, so a document navigation (window.location.assign) would reload
    // the app, drop the key cache, re-lock the account that was just unlocked,
    // and the consent screen would send the user straight back here forever.
    // The target is a runtime string, so the typed router cannot model it; the
    // cast is at this boundary only. resolveInternalPath has already constrained it
    // same-origin path.
    navigate({
      to: back.pathname,
      search: back.search ? parseSearch(back.search) : {},
    } as never);
  }

  async function activate() {
    if (unlocked) {
      selectAccount(username);
      done();
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
      done();
    } catch (e) {
      // A corrupt persisted plaintext keystore rejects here; without this the
      // row just stopped working with nothing on screen.
      setError(e instanceof Error ? e.message : String(e));
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
      done();
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
              // The confirm promised the keys would be deleted. If the write did
              // not reach storage the record comes back on reload, so say so
              // instead of silently leaving a false impression.
              if (!removeAccount(username)) {
                setError(
                  'Removed for this session only: storage is unavailable, so this account will return when you reload.',
                );
              }
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

      {/* A plaintext unlock failure never opens the passcode form, so its error
          has to render outside it or the row just goes quiet. */}
      {error && !unlocking && (
        <div role="alert" style={{ fontSize: 12.5, color: '#cf222e' }}>
          {error}
        </div>
      )}

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
  const { next } = Route.useSearch();

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
            <AccountRow
              key={u}
              username={u}
              current={u === selectedAccount}
              next={next}
            />
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
