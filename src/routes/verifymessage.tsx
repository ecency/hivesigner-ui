import { createFileRoute, Link } from '@tanstack/react-router';
import clsx from 'clsx';
import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  alertError,
  btnPrimary,
  card,
  fieldBase,
  h1,
  label,
  mono,
  muted,
  mutedXs,
  page,
} from '@/components/ui';
import { getAccount } from '@/lib/hive';
import { decodeToken, matchAuthority } from '@/lib/message-token';

// Verify a shared message token: decode + recover the signer, then confirm the
// signer is one of the named account's keys. Auto-verifies when opened from a
// verification link (?payload=...), matching the Nuxt behaviour.
export const Route = createFileRoute('/verifymessage')({
  component: VerifyMessage,
  validateSearch: (s: Record<string, unknown>) => s as { payload?: string },
});

// The shared vocabulary has no success panel, only `alertError`. This mirrors
// that recipe's metrics with the existing green palette.
const alertOk =
  'rounded-xl border border-ok-line bg-ok-bg p-4 text-[13px] text-ok';

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
    <section className={page}>
      <div>
        <h1 className={h1}>{t('message_verification.title')}</h1>
        <p className={`${muted} mt-1 mb-0`}>
          {t('message_verification.description')}
        </p>
      </div>

      {/* The token field stays a single readable column on a wide screen. */}
      <label className={`${label} w-full sm:max-w-xl`}>
        <span className="text-[13px] font-semibold text-ink">
          {t('message_verification.payload_label')}
        </span>
        {/* `fieldBase` carries no height, so the rows attribute decides it. Using
            `field` (which is h-11) plus `h-auto` would make the height depend on
            which utility Tailwind emits last. */}
        <textarea
          name="payload"
          rows={4}
          className={`${fieldBase} py-3 font-mono text-ink`}
          value={token}
          placeholder={t('message_verification.payload_placeholder')}
          onChange={(e) => setToken(e.target.value)}
        />
      </label>

      {/* Full width on a phone, sized to its label once there is room. */}
      <button
        type="button"
        onClick={() => verify(token)}
        disabled={busy}
        className={`${btnPrimary} w-full sm:w-auto sm:self-start`}
      >
        {busy
          ? t('message_verification.verifying')
          : t('message_verification.verify_button')}
      </button>

      {result && (
        <div
          role="alert"
          className={clsx(result.ok ? alertOk : alertError, 'font-semibold')}
        >
          {result.text}
        </div>
      )}

      {result?.signer && (
        // One column on a phone; two on a wider viewport, so the recovered
        // details use the shell's width instead of a long thin list.
        <div
          className={`${card} flex flex-col gap-2 text-[13px] sm:grid sm:grid-cols-2 sm:gap-x-6`}
        >
          <Row label={t('message_verification.author')}>@{result.author}</Row>
          <Row label={t('message_verification.recovered_key')}>
            {/* break-all is deliberate: it stops a crafted key from running
                off the line. `mono` carries it. */}
            <code className={`${mono} text-[11px]`}>{result.signer}</code>
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
    <div className="flex flex-col gap-0.5">
      <span className={mutedXs}>{label}</span>
      {/* The value comes from the token, so it may be one long unbroken run:
          wrap it rather than let it push the page sideways at 320px. */}
      <div className="break-words">{children}</div>
    </div>
  );
}
