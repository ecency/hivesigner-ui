import { type KeyboardEvent, useId } from 'react';
import { createPortal } from 'react-dom';

/**
 * A secret that password managers must leave alone: the local passcode, or a
 * key added to an account that is already on this device (#136).
 *
 * A manager keeps one password per username per site, and on this site that is
 * usually the Hive key the account was added with. Shown a second password
 * field next to it, managers read the pair as "old password, new password" and
 * offer to overwrite the saved key with the passcode. Four layers keep that
 * from happening, because no single signal is honoured by every manager:
 *
 * - `autocomplete="one-time-code"`: Chromium's password manager does not treat
 *   such a field as a password at all, so it neither saves it nor suggests one.
 * - The attributes 1Password, LastPass, Bitwarden and Dashlane look for.
 * - Its own detached form. A manager pairs password fields by form, so the
 *   secret is never read as the new password of the login beside it; Firefox,
 *   which honours neither signal above, pairs by form as well.
 * - The value is cleared by the caller as soon as it has been used, so a
 *   manager that captures on navigation or on removal finds nothing.
 *
 * It stays a real password field: a masked text field would be read aloud by
 * screen readers, learned by mobile keyboards and copyable.
 *
 * Because the input belongs to another form, Enter no longer submits the form
 * it sits in. `onEnter` restores that: `'submit-form'` submits the form the
 * field sits in, a function is called instead.
 */
export function SecretInput({
  name,
  value,
  onChange,
  onEnter,
  className,
  autoFocus,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  onEnter?: 'submit-form' | (() => void);
  className?: string;
  autoFocus?: boolean;
}) {
  const formId = `secret-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing) return;
    // Never let Enter reach the detached form: its submit event would carry
    // this secret, which is what managers capture.
    e.preventDefault();
    if (onEnter === 'submit-form') {
      e.currentTarget.closest('form')?.requestSubmit();
    } else {
      onEnter?.();
    }
  }
  return (
    <>
      <input
        className={className}
        name={name}
        type="password"
        form={formId}
        autoComplete="one-time-code"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-1p-ignore="true"
        data-lpignore="true"
        data-bwignore="true"
        data-form-type="other"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        // biome-ignore lint/a11y/noAutofocus: only where the caller just opened the field
        autoFocus={autoFocus}
      />
      {typeof document !== 'undefined' &&
        createPortal(
          <form
            id={formId}
            hidden
            aria-hidden="true"
            onSubmit={(e) => e.preventDefault()}
          />,
          document.body,
        )}
    </>
  );
}
