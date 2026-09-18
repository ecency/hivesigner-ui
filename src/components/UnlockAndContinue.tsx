import { useState } from 'react';
import { flushSync } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { SecretInput } from '@/components/SecretInput';
import {
  alertError,
  btnPrimary,
  field,
  label,
  labelText,
} from '@/components/ui';
import { accountIsEncrypted, unlockAccount } from '@/lib/accounts';
import type { Keys } from '@/lib/hive';
import type { LeaveLatch } from '@/lib/use-leave-latch';

/**
 * A locked account's passcode, asked for on the screen that needs it, with
 * that screen's own action on the button: one click unlocks and continues
 * (#145).
 *
 * Keys live in memory only, so every visit after a reload starts locked. The
 * screens used to answer that with an "Unlock" link to the account list, and
 * a returning user went list, unlock, passcode, back, then the action they
 * came for. Nothing here reaches past the screen: the passcode unlocks, then
 * `onUnlocked` runs the screen's action, which reads the keys it signs with
 * at call time (this click's render still sees the account as locked). An
 * action that cannot go ahead with the keys found (a missing active key, say)
 * simply returns, and the screen, now unlocked, shows what it needs.
 *
 * The screen's leave latch is marked at the click: a user who set off
 * elsewhere while the passcode was checked (Cancel, Switch account) gets no
 * action, even if they came back before it finished.
 */
export function UnlockAndContinue({
  username,
  action,
  leave,
  onOpened,
  onUnlocked,
  disabled = false,
  autoFocus = false,
}: {
  username: string;
  /** The screen's own verb: Sign in, Approve, Authorize. */
  action: string;
  /** The screen's leave latch. Required with `onUnlocked`: an action must
      never follow a user who left. */
  leave?: LeaveLatch;
  /** Runs just before the unlock is shown, with the passcode that opened
      the account (undefined for one without) and its keys, for the one step
      that needs the passcode again: adding a key to the protected record,
      which should not ask for what was typed a moment ago. Whatever it sets
      is in place in the same render as the unlocked screen. */
  onOpened?: (passcode: string | undefined, keys: Keys) => void;
  /** The screen's action. A screen that moves on by itself once the
      account is unlocked (the local login) has none. */
  onUnlocked?: () => void;
  /** The screen is not ready to act yet (an account read still running). */
  disabled?: boolean;
  /** Only where the passcode is the next thing to do; never above a long
      request the user still has to read. */
  autoFocus?: boolean;
}) {
  const { t } = useTranslation();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // A no-passcode account is unlocked at startup; one still locked has a
  // record that failed to load, and trying again says why.
  const encrypted = accountIsEncrypted(username);
  const ready = !busy && !disabled && (!encrypted || passcode.length > 0);

  async function submit() {
    if (!ready) return;
    setError(null);
    const typed = encrypted ? passcode : undefined;
    const left = leave?.mark();
    // Emptied BEFORE the unlock, so a password manager that captures on
    // removal finds nothing: the unlock notifies the store, the screen drops
    // this field before this function resumes, and a clear after the await
    // never reaches the DOM. Put back if the passcode was wrong.
    flushSync(() => {
      setPasscode('');
      setBusy(true);
    });
    try {
      // Handed over before the store announces the unlock, in the same
      // task, so what the screen sets renders together with the unlocked
      // screen instead of in a second pass after it.
      await unlockAccount(username, typed, (keys) => onOpened?.(typed, keys));
    } catch (e) {
      // Only a passcode that does not open the record is a wrong passcode.
      // Anything else (a record that fails to load, one removed in another
      // tab) is shown as it is, as the account list does: there is nothing
      // to correct in the field.
      const message = e instanceof Error ? e.message : String(e);
      setError(
        /wrong pass/i.test(message) ? t('login.invalid_hs_password') : message,
      );
      setPasscode(typed ?? '');
      setBusy(false);
      return;
    }
    setBusy(false);
    if (left?.()) return;
    onUnlocked?.();
  }

  return (
    <div className="flex flex-col gap-2.5">
      {encrypted && (
        <label className={label}>
          <span className={labelText}>{t('accounts.passcode')}</span>
          {/* Not the site's password: kept out of managers' save and update
              prompts (see SecretInput). */}
          <SecretInput
            className={field}
            name={`passcode-${username}`}
            value={passcode}
            onChange={setPasscode}
            onEnter={submit}
            readOnly={busy}
            autoFocus={autoFocus}
          />
        </label>
      )}
      {error && (
        <div role="alert" className={alertError}>
          {error}
        </div>
      )}
      <button
        type="button"
        onClick={submit}
        disabled={!ready}
        className={btnPrimary}
      >
        {busy ? '…' : action}
      </button>
    </div>
  );
}
