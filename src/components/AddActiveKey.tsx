import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  alertError,
  btnPrimary,
  card,
  field,
  label,
  labelText,
  mutedXs,
} from '@/components/ui';
import { accountIsEncrypted, addAccount } from '@/lib/accounts';
import { getAccount, type Keys, resolveCredential } from '@/lib/hive';

// Password managers must leave these fields alone. A manager keeps ONE
// password per username per site, and on this site that is usually the key
// the account was added with: offered a second password for the same
// username, it proposes to overwrite that saved key with this one (#136).
const unmanaged = {
  autoComplete: 'off',
  'data-1p-ignore': 'true',
  'data-lpignore': 'true',
  'data-bwignore': 'true',
  'data-form-type': 'other',
} as const;

/**
 * Add the active key to an account that is already on this device, in place.
 * A screen that needs the active key (a first-time grant) shows this instead
 * of sending the user to /import, so the request they are answering stays on
 * screen. The key is checked against the account on-chain and merged into the
 * stored keys, under the account's passcode when it has one.
 */
export function AddActiveKey({ username }: { username: string }) {
  const { t } = useTranslation();
  const [secret, setSecret] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const encrypted = accountIsEncrypted(username);

  const canSubmit =
    secret.trim().length > 0 && (!encrypted || passcode.length > 0) && !busy;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const account = await getAccount(username);
      if (!account) {
        setError(t('common.try_again'));
        return;
      }
      // As on /import: the secret exactly as typed first, then trimmed, since
      // a master password may legitimately start or end with a space.
      const resolved =
        resolveCredential(account, secret) ??
        resolveCredential(account, secret.trim());
      if (!resolved?.active) {
        setError(t('authorize.not_active_key', { account: username }));
        return;
      }
      // Only what this screen needs. A master password also derives the
      // owner key, and nothing here should leave that on the device.
      const keys: Keys = { active: resolved.active };
      if (resolved.posting) keys.posting = resolved.posting;
      await addAccount(username, keys, encrypted ? passcode : undefined);
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
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`${card} flex flex-col gap-3`}
      data-testid="add-active-key"
    >
      <label className={label}>
        <span className={labelText}>
          {t('authorize.active_key_label', { account: username })}
        </span>
        <input
          className={`${field} font-mono`}
          name="active-key"
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          {...unmanaged}
        />
        <span className={mutedXs}>{t('authorize.active_key_hint')}</span>
      </label>
      {encrypted && (
        <label className={label}>
          <span className={labelText}>
            {t('authorize.active_key_passcode', { account: username })}
          </span>
          <input
            className={field}
            name="unlock-passcode"
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            {...unmanaged}
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
