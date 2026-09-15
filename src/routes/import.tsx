import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  alertError,
  btnPrimary,
  field,
  formColumn,
  h1,
  label,
  labelText,
  muted,
  mutedXs,
  page,
} from '@/components/ui';
import { addAccount, selectAccount } from '@/lib/accounts';
import { getAccount, resolveCredential } from '@/lib/hive';
import { resolveInternalPath } from '@/lib/internal-path';
import { parseSearch } from '@/lib/search';
import { useAccounts } from '@/lib/use-accounts';

// Add an account: paste a Hive key or master password (validated on-chain), and
// optionally protect it on this device with a passcode. This implements the
// three-credential separation from the #106 redesign; the passcode is optional
// (sign instantly) per the reviewed mockups.
export const Route = createFileRoute('/import')({
  component: Import,
  // `next` is OPTIONAL so it stays absent from every other <Link to="/import">.
  validateSearch: (search: Record<string, unknown>): { next?: string } =>
    typeof search.next === 'string' ? { next: search.next } : {},
});

const USERNAME_RE = /^[a-z][a-z0-9.-]{2,15}$/;

function Import() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { usernames } = useAccounts();
  const { next } = Route.useSearch();

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
      // Try the secret EXACTLY as entered first. Trimming can change a master
      // password that legitimately begins or ends with whitespace, deriving
      // different keys; the trimmed retry still rescues a pasted key that
      // carried a stray newline. resolveCredential validates against the chain,
      // so whichever form matches is the right one.
      const keys =
        resolveCredential(account, secret) ??
        resolveCredential(account, secret.trim());
      if (!keys) {
        setError(t('import.invalid_username_password'));
        return;
      }
      await addAccount(name, keys, usePasscode ? passcode : undefined);
      // Make the account the user just imported the current one. addAccount only
      // selects when NOTHING is selected, so importing Bob while Alice was
      // selected left Alice current: returning to a consent request would then
      // still use Alice and, if Alice lacks the required key, prompt for an
      // import again in a loop.
      selectAccount(name);
      // Return to the flow that sent the user here (an OAuth consent request
      // would otherwise be lost and the app would have to start over), falling
      // back to the accounts screen.
      const back = resolveInternalPath(next);
      navigate(
        back
          ? ({
              to: back.pathname,
              search: back.search ? parseSearch(back.search) : {},
            } as never)
          : { to: '/accounts' },
      );
    } catch (e) {
      // Surface keystore/accounts messages verbatim: a wrong passcode on an
      // already-protected account now throws here, and telling the user to "try
      // again later" would send them into retrying the same wrong passcode.
      const msg = e instanceof Error ? e.message : '';
      setError(/passcode|protected/i.test(msg) ? msg : t('common.try_again'));
    } finally {
      setBusy(false);
    }
  }

  return (
    // A form stays one readable column: the shell widens on a desktop, but
    // stretching these inputs across it would only make them harder to read.
    <form onSubmit={onSubmit} className={`${page} ${formColumn}`}>
      <div className="flex flex-col gap-1">
        <h1 className={h1}>{t('import.add_account')}</h1>
        <p className={`${mutedXs} m-0 leading-[1.45]`}>
          {t('import.add_account_hint')}
        </p>
      </div>

      <label className={label}>
        <span className={labelText}>{t('import.username')}</span>
        <input
          className={field}
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="hiveuser"
        />
      </label>

      <label className={label}>
        <span className={labelText}>{t('import.private_key')}</span>
        <input
          className={`${field} font-mono`}
          name="password"
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
        />
        <span className={mutedXs}>{t('import.private_key_hint')}</span>
      </label>

      <div className="flex flex-col gap-2.5">
        <label className="flex items-center gap-2 text-[13.5px]">
          <input
            type="checkbox"
            className="accent-brand"
            checked={usePasscode}
            onChange={(e) => setUsePasscode(e.target.checked)}
          />
          <span>{t('import.protect_with_passcode')}</span>
        </label>
        {usePasscode && (
          // A real <label>, not a placeholder: a placeholder is not an
          // accessible name and it vanishes as soon as the user types, which
          // left this field - the one that protects the key - unnamed.
          <label className={label}>
            <span className={labelText}>{t('import.passcode')}</span>
            <input
              className={field}
              name="passcode"
              type="password"
              autoComplete="new-password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
            />
          </label>
        )}
      </div>

      {error && (
        <div role="alert" className={alertError}>
          {error}
        </div>
      )}

      {/* Full width under the thumb on a phone, its own size once there is room. */}
      <button
        type="submit"
        disabled={!canSubmit}
        className={`${btnPrimary} cursor-pointer sm:self-start`}
      >
        {busy ? '…' : t('import.add_account')}
      </button>

      {usernames.length > 0 && (
        <p className={`${muted} m-0`}>
          {t('import.accounts_on_device', { count: usernames.length })}
        </p>
      )}
    </form>
  );
}
