import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
import {
  cardTight,
  field,
  label,
  labelText,
  muted,
  mutedXs,
} from '@/components/ui';
import { accountIsEncrypted, removeAccount } from '@/lib/accounts';
import { useAccounts } from '@/lib/use-accounts';

/** From this many accounts on, the list gets a filter. */
const FILTER_FROM = 6;

/**
 * The accounts on this device, to pick one (#146): one column, A to Z, and a
 * filter once the list is long. The row is the choice itself. Picking never
 * asks for a passcode here: every screen that signs asks for it in place, so
 * a locked account is simply chosen and opened where it is used.
 *
 * Only "No passcode" is said about an account: its keys are stored
 * unencrypted on this device, which the user should keep in mind. Current,
 * Unlocked and Protected were noise in the way of the name.
 */
export function AccountList({
  current,
  onPick,
  removable = false,
  autoFocus = false,
}: {
  /** The account in use, marked in the list. */
  current: string | null;
  onPick: (username: string) => void;
  /** Each row can also be removed from the device (the account page). */
  removable?: boolean;
  /** Focus moves into the list: it was opened for this. */
  autoFocus?: boolean;
}) {
  const { t } = useTranslation();
  const { usernames } = useAccounts();
  const [query, setQuery] = useState('');
  const [removeFailed, setRemoveFailed] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const sorted = [...usernames].sort();
  const filtering = sorted.length >= FILTER_FROM;
  // Names are lower case on Hive; a pasted "@Name" still finds it.
  const needle = query.trim().toLowerCase().replace(/^@/, '');
  const shown = filtering ? sorted.filter((u) => u.includes(needle)) : sorted;

  // biome-ignore lint/correctness/useExhaustiveDependencies: on opening only
  useEffect(() => {
    if (autoFocus)
      root.current?.querySelector<HTMLElement>('input, button')?.focus();
  }, []);

  return (
    <div ref={root} className="flex flex-col gap-2">
      {filtering && (
        <label className={label}>
          <span className={labelText}>{t('accounts.search')}</span>
          <input
            type="search"
            className={field}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
      )}
      {shown.length === 0 && (
        <p className={muted}>{t('signs.nothing_matches')}</p>
      )}
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {shown.map((username) => (
          <li
            key={username}
            data-testid="account-row"
            // `bg-brand-tint!` wins over the recipe's own `bg-surface`: two
            // background utilities on one element are otherwise resolved by
            // stylesheet order, not by the order they appear here.
            className={clsx(
              cardTight,
              'flex flex-col gap-1.5',
              username === current && 'bg-brand-tint!',
            )}
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onPick(username)}
                aria-current={username === current || undefined}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 border-none bg-transparent p-0 text-start text-ink"
              >
                <Avatar username={username} size="md" />
                <span className="min-w-0 flex-1">
                  {/* Data, not copy: a page translator must leave the name
                      alone. On the <bdi>, not the block: the global rule for
                      a span marked translate="no" (plaintext bidi) would
                      align the block to the name's direction, left on an
                      RTL page. */}
                  <span className="block break-all text-[15px] font-semibold">
                    <bdi translate="no">{`@${username}`}</bdi>
                  </span>
                  {!accountIsEncrypted(username) && (
                    <span className={`${mutedXs} block`}>
                      {t('accounts.no_passcode')}
                    </span>
                  )}
                </span>
                {/* The one in use, for eyes that do not tell the tint
                    apart; aria-current says it to a screen reader. */}
                {username === current && (
                  <span aria-hidden="true" className="font-bold text-brand-ink">
                    ✓
                  </span>
                )}
              </button>
              {removable && (
                <button
                  type="button"
                  aria-label={`${t('accounts.delete')} @${username}`}
                  onClick={() => {
                    // Removing wipes the only copy of the keys on this
                    // device; confirm.
                    if (
                      !window.confirm(
                        t('accounts.remove_confirm', {
                          username: `@${username}`,
                        }),
                      )
                    )
                      return;
                    // The confirm promised the keys would be deleted. If the
                    // write did not reach storage the record comes back on
                    // reload, so say so instead of leaving a false impression.
                    setRemoveFailed(removeAccount(username) ? null : username);
                  }}
                  className="min-h-11 min-w-11 shrink-0 cursor-pointer border-none bg-transparent text-muted"
                >
                  ✕
                </button>
              )}
            </div>
            {removeFailed === username && (
              <div role="alert" className="text-[12.5px] text-danger">
                {t('accounts.remove_failed')}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
