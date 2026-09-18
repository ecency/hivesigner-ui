import { type FormEvent, useState } from 'react';
import { flushSync } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { SecretInput } from '@/components/SecretInput';
import { Sentence } from '@/components/Untranslated';
import {
  alertError,
  btnPrimary,
  card,
  field,
  label,
  labelText,
  mutedXs,
} from '@/components/ui';
import { accountIsEncrypted, addAccount, getKeys } from '@/lib/accounts';
import { getAccount, type Keys, resolveCredential } from '@/lib/hive';

/**
 * Add the active key to an account that is already on this device, in place.
 * A screen that needs the active key (a first-time grant) shows this instead
 * of sending the user to /import, so the request they are answering stays on
 * screen. The key is checked against the account on-chain and merged into the
 * stored keys, under the account's passcode when it has one. An account with
 * no passcode is offered one, on by default as on /import: this is the key
 * that moves funds, and without a passcode it sits on disk unencrypted.
 *
 * A protected account unlocked on the same screen a moment ago passes the
 * passcode it was opened with, so it is not asked for twice (#145). It lives
 * only as long as the screen that asked for it; the keys it protects are in
 * memory for the whole session anyway.
 */
export function AddActiveKey({
  username,
  passcode: unlockedWith,
  autoFocus = false,
}: {
  username: string;
  passcode?: string;
  /** This form has just replaced the field the user was typing in. */
  autoFocus?: boolean;
}) {
  const { t } = useTranslation();
  const [secret, setSecret] = useState('');
  const [passcode, setPasscode] = useState('');
  const [protect, setProtect] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const encrypted = accountIsEncrypted(username);
  const known = encrypted ? unlockedWith : undefined;

  // A new passcode follows /import's minimum; an existing one is whatever the
  // user chose back then, so any non-empty entry is tried.
  const passcodeOk = encrypted
    ? known !== undefined || passcode.length > 0
    : !protect || passcode.length >= 4;
  const canSubmit = secret.trim().length > 0 && passcodeOk && !busy;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    // The button is disabled on exactly this condition, but a submit can
    // arrive without it: an empty passcode would store the key unprotected,
    // and a second submit while busy would run on the emptied fields.
    if (!canSubmit) return;
    setError(null);
    setBusy(true);
    // Both secrets are taken out of their fields before anything else, so the
    // form this component is removed with holds nothing a password manager
    // could offer to save. They go back only if the key is not added.
    const typed = { secret, passcode };
    flushSync(() => {
      setSecret('');
      setPasscode('');
    });
    let added = false;
    try {
      const account = await getAccount(username);
      if (!account) {
        setError(t('common.try_again'));
        return;
      }
      // As on /import: the secret exactly as typed first, then trimmed, since
      // a master password may legitimately start or end with a space.
      const resolved =
        resolveCredential(account, typed.secret) ??
        resolveCredential(account, typed.secret.trim());
      if (!resolved?.active) {
        setError(t('authorize.not_active_key', { account: `@${username}` }));
        return;
      }
      // Only what this screen needs. A master password also derives the
      // owner key, and nothing here should leave that on the device. The
      // posting key it derives is kept only when the device has none: an
      // account can list several posting keys, and the one the user added
      // stays theirs.
      const keys: Keys = { active: resolved.active };
      if (resolved.posting && !getKeys(username)?.posting) {
        keys.posting = resolved.posting;
      }
      // Protecting a plaintext account re-encrypts the whole record under the
      // new passcode, the same as adding it again on /import would.
      await addAccount(
        username,
        keys,
        encrypted || protect ? (known ?? typed.passcode) : undefined,
      );
      added = true;
      // addAccount notifies the account store, so the screen re-renders with
      // the key and this form is replaced by the action it was blocking.
    } catch (err) {
      // A wrong passcode throws from the keystore; say so rather than
      // "try again", which would send the user round the same mistake.
      const msg = err instanceof Error ? err.message : '';
      setError(
        /passcode|password|protected/i.test(msg)
          ? t('authorize.wrong_passcode')
          : t('common.try_again'),
      );
    } finally {
      if (!added) {
        // The fields are read-only while busy; only an empty one is refilled
        // all the same, so nothing typed since is ever overwritten.
        setSecret((current) => current || typed.secret);
        setPasscode((current) => current || typed.passcode);
      }
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`${card} flex w-full flex-col gap-3`}
      data-testid="add-active-key"
    >
      <label className={label}>
        <span className={labelText}>
          <Sentence
            k="authorize.active_key_label"
            values={{ account: `@${username}` }}
          />
        </span>
        <SecretInput
          className={`${field} font-mono`}
          name="active-key"
          value={secret}
          onChange={setSecret}
          onEnter="submit-form"
          readOnly={busy}
          autoFocus={autoFocus}
        />
        <span className={mutedXs}>{t('authorize.active_key_hint')}</span>
      </label>
      {!encrypted && (
        <label className="flex items-center gap-2 text-[13.5px]">
          <input
            type="checkbox"
            className="accent-brand"
            checked={protect}
            disabled={busy}
            onChange={(e) => setProtect(e.target.checked)}
          />
          <span>{t('import.protect_with_passcode')}</span>
        </label>
      )}
      {!encrypted && protect && (
        <label className={label}>
          <span className={labelText}>{t('import.passcode')}</span>
          <SecretInput
            className={field}
            name="new-passcode"
            value={passcode}
            onChange={setPasscode}
            onEnter="submit-form"
            readOnly={busy}
          />
          <span className={mutedXs}>{t('import.passcode_hint')}</span>
        </label>
      )}
      {encrypted && known === undefined && (
        <label className={label}>
          <span className={labelText}>
            <Sentence
              k="authorize.active_key_passcode"
              values={{ account: `@${username}` }}
            />
          </span>
          <SecretInput
            className={field}
            name="unlock-passcode"
            value={passcode}
            onChange={setPasscode}
            onEnter="submit-form"
            readOnly={busy}
          />
          <span className={mutedXs}>
            {t('authorize.active_key_passcode_hint')}
          </span>
        </label>
      )}
      {error && (
        <div role="alert" className={alertError}>
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!canSubmit}
        className={`${btnPrimary} cursor-pointer`}
      >
        {busy ? '…' : t('authorize.add_active_key')}
      </button>
    </form>
  );
}
