import { Link } from '@tanstack/react-router';
import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccountList } from '@/components/AccountList';
import { Avatar } from '@/components/Avatar';
import { cardTight, link } from '@/components/ui';
import { selectAccount } from '@/lib/accounts';

/**
 * The account a consent or signing screen is about to act as, made hard to
 * miss: avatar, name and a way to change it, in one row above the action.
 *
 * A one-line "Authorizing as @name" in caption grey was easy to skim past,
 * and a user with several accounts on the device could approve a request
 * for the wrong one without noticing.
 *
 * Switching happens right here (#146): the list opens under the row, and the
 * account picked is the one the screen acts as, its passcode asked for in
 * place when it is locked. No trip to the account page and back.
 */
export function CurrentAccount({
  username,
  label,
  next,
  busy = false,
  defaultOpen = false,
}: {
  username: string;
  /** "Authorizing as" / "Signing as": the verb this screen is about. */
  label: string;
  /** The current request, path plus query, to come back to after adding an
      account that is not on this device yet. */
  next: string;
  /**
   * The screen is signing or broadcasting: the row keeps naming the account
   * but the switch link goes away, because the operation in flight will
   * still redirect to the app's callback when it completes, and a user who
   * had moved to the account list would be pulled away from it.
   */
  busy?: boolean;
  /** The list starts open: this account cannot do what the screen asks. */
  defaultOpen?: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);
  // Focus moves into the list only when the user opened it, never on load.
  const [opened, setOpened] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const close = () => {
    setOpen(false);
    toggle.current?.focus();
  };
  return (
    <div className="flex flex-col gap-2">
      <div
        className={`${cardTight} flex flex-wrap items-center gap-x-3 gap-y-1`}
        data-testid="current-account"
      >
        <Avatar username={username} size="md" />
        {/* Room for the label and the name first: a long "switch" label in
          some languages moves to its own line instead of squeezing them. */}
        <div className="min-w-0 flex-[1_1_9rem]">
          <div className="text-[11px] text-muted">{label}</div>
          {/* break-all, never truncate: the row exists so the user can check
            the EXACT account, and a 16-character name at 320px would lose
            the suffix that tells two similar accounts apart. translate="no":
            a page translator must not rewrite the name being checked. */}
          <div
            className="break-all text-[15px] font-semibold text-ink"
            translate="no"
          >
            <bdi>{`@${username}`}</bdi>
          </div>
        </div>
        {!busy && (
          <button
            ref={toggle}
            type="button"
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => {
              setOpen(!open);
              setOpened(true);
            }}
            className={`${link} ms-auto shrink-0 cursor-pointer border-none bg-transparent p-0 text-[13px]`}
          >
            {t('login.switch_an_account')}
          </button>
        )}
      </div>
      {open && !busy && (
        <div id={listId} className="flex flex-col gap-2">
          <AccountList
            current={username}
            onPick={(picked) => {
              // Focus first: a locked account's passcode field, mounting
              // with the new account, may take it from there.
              close();
              selectAccount(picked);
            }}
            autoFocus={opened}
          />
          <Link to="/import" search={{ next }} className={`${link} text-sm`}>
            {t('accounts.add_another')}
          </Link>
        </div>
      )}
    </div>
  );
}
