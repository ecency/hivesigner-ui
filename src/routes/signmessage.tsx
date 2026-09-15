import { createFileRoute, Link } from '@tanstack/react-router';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  alertError,
  btnPrimary,
  card,
  field,
  fieldBase,
  h1,
  link as linkClass,
  mono,
  muted,
  mutedXs,
  page,
} from '@/components/ui';
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

// The label wrapper is deliberately not the shared `label` recipe: that recipe
// carries the muted caption colour, and preflight makes form controls inherit
// `color`, so it would tint the typed message and the authority select grey.
// `sm:max-w-md` keeps the form a readable column in the now-wider shell instead
// of stretching the inputs across the whole page.
const labelStack = 'flex flex-col gap-1.5 sm:max-w-md';
const labelText = 'text-[13px] font-semibold';

function SignMessage() {
  const { t } = useTranslation();
  const { selectedAccount, unlocked } = useAccounts();
  const keys = selectedAccount ? getKeys(selectedAccount) : null;
  const heldRoles = (
    ['owner', 'active', 'posting', 'memo'] as KeyRole[]
  ).filter((r) => keys?.[r]);

  const [message, setMessage] = useState('');
  const [role, setRole] = useState<KeyRole>(heldRoles[0] ?? 'posting');
  // useState seeds only on the first render, so after switching to an account
  // that lacks the previously selected role the signer would look for a key it
  // does not hold. Derive the role actually in use from what is held now.
  const effectiveRole: KeyRole = heldRoles.includes(role)
    ? role
    : (heldRoles[0] ?? 'posting');
  const [payload, setPayload] = useState<SignedMessagePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isUnlocked = !!selectedAccount && unlocked.includes(selectedAccount);

  if (!isUnlocked || heldRoles.length === 0) {
    return (
      <section className={page}>
        <h1 className={h1}>{t('message_signing.title')}</h1>
        <p className={muted}>{t('message_signing.login_prompt')}</p>
        <Link to="/accounts" className={linkClass}>
          {t('footer.login')}
        </Link>
      </section>
    );
  }

  function sign() {
    setError(null);
    const wif = keys?.[effectiveRole];
    if (!selectedAccount || !wif) return;
    try {
      setPayload(
        createSignedMessage(
          { message: message.trim() },
          selectedAccount,
          wif,
          effectiveRole,
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
    <section className={page}>
      <div>
        <h1 className={h1}>{t('message_signing.title')}</h1>
        <p className={`${muted} mt-1`}>{t('message_signing.description')}</p>
      </div>

      <label className={labelStack}>
        <span className={labelText}>{t('message_signing.message_label')}</span>
        {/* `field` pins a 44px control height, which would flatten a 4-row
            textarea, so the height is released back to the `rows` attribute. */}
        <textarea
          name="message"
          rows={4}
          className={`${fieldBase} py-3`}
          value={message}
          placeholder={t('message_signing.message_placeholder')}
          onChange={(e) => setMessage(e.target.value)}
        />
      </label>

      <label className={labelStack}>
        <span className={labelText}>
          {t('message_signing.authority_label')}
        </span>
        <select
          className={field}
          value={effectiveRole}
          onChange={(e) => setRole(e.target.value as KeyRole)}
        >
          {heldRoles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>

      {/* Full width on a phone, sized to its own label from `sm` up. */}
      <button
        type="button"
        onClick={sign}
        disabled={message.trim().length === 0}
        className={`${btnPrimary} cursor-pointer sm:self-start`}
      >
        {t('message_signing.sign_button')}
      </button>

      {error && (
        <div role="alert" className={alertError}>
          {error}
        </div>
      )}

      {payload && (
        <div className={`${card} flex flex-col gap-2.5`}>
          <div className="text-[13px] font-bold text-muted">
            {t('message_signing.summary')}
          </div>
          <Field label={t('message_signing.author')}>
            @{payload.authors[0]}
          </Field>
          <Field label={t('message_signing.authority_used')}>
            {payload.authority}
          </Field>
          <Field label={t('message_signing.verification_token')}>
            {/* `mono` keeps the deliberate break-all on rendered values. */}
            <code className={`${mono} text-[11px]`}>{token}</code>
          </Field>
          <Field label={t('message_signing.verification_link')}>
            <code className={`${mono} text-[11px]`}>{link}</code>
          </Field>
        </div>
      )}

      <Link to="/verifymessage" className={linkClass}>
        {t('message_signing.go_to_verify')}
      </Link>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={mutedXs}>{label}</span>
      <div className="text-[13px]">{children}</div>
    </div>
  );
}
