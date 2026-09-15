import { createFileRoute, Link } from '@tanstack/react-router';
import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAccount } from '@/lib/hive';
import { decodeToken, matchAuthority } from '@/lib/message-token';

// Verify a shared message token: decode + recover the signer, then confirm the
// signer is one of the named account's keys. Auto-verifies when opened from a
// verification link (?payload=...), matching the Nuxt behaviour.
export const Route = createFileRoute('/verifymessage')({
  component: VerifyMessage,
  validateSearch: (s: Record<string, unknown>) => s as { payload?: string },
});

const fld: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 12,
  border: '1px solid #d1d9e0',
  borderRadius: 8,
  fontSize: 14,
  fontFamily: 'ui-monospace, monospace',
};
const card: CSSProperties = {
  background: '#fff',
  border: '1px solid #d1d9e0',
  borderRadius: 12,
  padding: 16,
};

interface Result {
  ok: boolean;
  text: string;
  author?: string;
  signer?: string;
  authority?: string | null;
  message?: string;
}

function VerifyMessage() {
  const { t } = useTranslation();
  const { payload: linkPayload } = Route.useSearch();
  const [token, setToken] = useState(linkPayload ?? '');
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  async function verify(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      setResult({
        ok: false,
        text: t('message_verification.payload_required'),
      });
      return;
    }
    setBusy(true);
    try {
      const decoded = decodeToken(trimmed);
      if (!decoded) {
        setResult({
          ok: false,
          text: t('message_verification.invalid_payload'),
        });
        return;
      }
      const author = decoded.payload.authors[0];
      const account = await getAccount(author);
      if (!account) {
        setResult({
          ok: false,
          text: t('message_verification.account_not_found', {
            username: author,
          }),
        });
        return;
      }
      const role = matchAuthority(account, decoded.signer);
      const msg =
        typeof decoded.payload.signed_message === 'string'
          ? decoded.payload.signed_message
          : JSON.stringify(decoded.payload.signed_message);
      setResult({
        ok: role !== null,
        text: role
          ? t('message_verification.success', { username: author })
          : t('message_verification.invalid_signature'),
        author,
        signer: decoded.signer,
        authority: role,
        message: msg,
      });
    } catch {
      // An RPC failure while looking up the account must not strand the UI.
      setResult({ ok: false, text: t('common.try_again') });
    } finally {
      setBusy(false);
    }
  }

  // Auto-verify once when arriving from a verification link.
  // biome-ignore lint/correctness/useExhaustiveDependencies: verify is stable enough; run only on the incoming link
  useEffect(() => {
    if (linkPayload) verify(linkPayload);
  }, [linkPayload]);

  return (
    <section
      style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
          {t('message_verification.title')}
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#59636e' }}>
          {t('message_verification.description')}
        </p>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          {t('message_verification.payload_label')}
        </span>
        <textarea
          name="payload"
          rows={4}
          style={fld}
          value={token}
          placeholder={t('message_verification.payload_placeholder')}
          onChange={(e) => setToken(e.target.value)}
        />
      </label>

      <button
        type="button"
        onClick={() => verify(token)}
        disabled={busy}
        style={{
          height: 48,
          border: 'none',
          borderRadius: 10,
          background: '#E31337',
          color: '#fff',
          fontSize: 15,
          fontWeight: 600,
          cursor: busy ? 'not-allowed' : 'pointer',
        }}
      >
        {busy
          ? t('message_verification.verifying')
          : t('message_verification.verify_button')}
      </button>

      {result && (
        <div
          role="alert"
          style={{
            ...card,
            background: result.ok ? '#e6f4ea' : '#ffebe9',
            border: `1px solid ${result.ok ? '#a7dab8' : '#f0b3b3'}`,
            color: result.ok ? '#1a5c2b' : '#cf222e',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {result.text}
        </div>
      )}

      {result?.signer && (
        <div
          style={{
            ...card,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            fontSize: 13,
          }}
        >
          <Row label={t('message_verification.author')}>@{result.author}</Row>
          <Row label={t('message_verification.recovered_key')}>
            <code style={{ wordBreak: 'break-all', fontSize: 11 }}>
              {result.signer}
            </code>
          </Row>
          <Row label={t('message_verification.matched_authority')}>
            {result.authority ?? t('message_verification.unknown_authority')}
          </Row>
          <Row label={t('message_verification.message_preview')}>
            {result.message}
          </Row>
        </div>
      )}

      <Link to="/signmessage">{t('message_verification.go_to_sign')}</Link>
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 12, color: '#59636e' }}>{label}</span>
      <div>{children}</div>
    </div>
  );
}
