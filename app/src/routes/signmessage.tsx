import { createFileRoute, Link } from '@tanstack/react-router';
import { type CSSProperties, type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getKeys } from '@/lib/accounts';
import type { KeyRole } from '@/lib/hive';
import {
  createSignedMessage,
  encodeToken,
  type SignedMessagePayload,
} from '@/lib/message-token';
import { useAccounts } from '@/lib/use-accounts';

// Sign a message with one of the selected account's keys and share a
// verification token/link. Uses the shared message-token primitive so the
// output verifies anywhere a hivesigner token does.
export const Route = createFileRoute('/signmessage')({
  component: SignMessage,
});

const fld: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 12,
  border: '1px solid #d1d9e0',
  borderRadius: 8,
  fontSize: 15,
};
const card: CSSProperties = {
  background: '#fff',
  border: '1px solid #d1d9e0',
  borderRadius: 12,
  padding: 16,
};

function SignMessage() {
  const { t } = useTranslation();
  const { selectedAccount, unlocked } = useAccounts();
  const keys = selectedAccount ? getKeys(selectedAccount) : null;
  const heldRoles = (
    ['owner', 'active', 'posting', 'memo'] as KeyRole[]
  ).filter((r) => keys?.[r]);

  const [message, setMessage] = useState('');
  const [role, setRole] = useState<KeyRole>(heldRoles[0] ?? 'posting');
  const [payload, setPayload] = useState<SignedMessagePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isUnlocked = !!selectedAccount && unlocked.includes(selectedAccount);

  if (!isUnlocked || heldRoles.length === 0) {
    return (
      <section
        style={{
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
          {t('message_signing.title')}
        </h1>
        <p style={{ fontSize: 14, color: '#59636e' }}>
          {t('message_signing.login_prompt')}
        </p>
        <Link to="/accounts">{t('footer.login')}</Link>
      </section>
    );
  }

  function sign() {
    setError(null);
    const wif = keys?.[role];
    if (!selectedAccount || !wif) return;
    try {
      setPayload(
        createSignedMessage(
          { message: message.trim() },
          selectedAccount,
          wif,
          role,
        ),
      );
    } catch {
      setError(t('message_signing.unable_to_sign'));
    }
  }

  const token = payload ? encodeToken(payload) : '';
  const link = payload
    ? `${window.location.origin}/verifymessage?payload=${token}`
    : '';

  return (
    <section
      style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
          {t('message_signing.title')}
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#59636e' }}>
          {t('message_signing.description')}
        </p>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          {t('message_signing.message_label')}
        </span>
        <textarea
          name="message"
          rows={4}
          style={fld}
          value={message}
          placeholder={t('message_signing.message_placeholder')}
          onChange={(e) => setMessage(e.target.value)}
        />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          {t('message_signing.authority_label')}
        </span>
        <select
          style={fld}
          value={role}
          onChange={(e) => setRole(e.target.value as KeyRole)}
        >
          {heldRoles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={sign}
        disabled={message.trim().length === 0}
        style={{
          height: 48,
          border: 'none',
          borderRadius: 10,
          background: message.trim() ? '#E31337' : '#f0a5b3',
          color: '#fff',
          fontSize: 15,
          fontWeight: 600,
          cursor: message.trim() ? 'pointer' : 'not-allowed',
        }}
      >
        {t('message_signing.sign_button')}
      </button>

      {error && (
        <div role="alert" style={{ fontSize: 13, color: '#cf222e' }}>
          {error}
        </div>
      )}

      {payload && (
        <div
          style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: '#59636e' }}>
            {t('message_signing.summary')}
          </div>
          <Field label={t('message_signing.author')}>
            @{payload.authors[0]}
          </Field>
          <Field label={t('message_signing.authority_used')}>
            {payload.authority}
          </Field>
          <Field label={t('message_signing.verification_token')}>
            <code style={{ wordBreak: 'break-all', fontSize: 11 }}>
              {token}
            </code>
          </Field>
          <Field label={t('message_signing.verification_link')}>
            <code style={{ wordBreak: 'break-all', fontSize: 11 }}>{link}</code>
          </Field>
        </div>
      )}

      <Link to="/verifymessage">{t('message_signing.go_to_verify')}</Link>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 12, color: '#59636e' }}>{label}</span>
      <div style={{ fontSize: 13 }}>{children}</div>
    </div>
  );
}
