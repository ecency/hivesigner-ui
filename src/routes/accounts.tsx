import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import clsx from 'clsx';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
import {
  btnPrimary,
  cardGrid,
  cardTight,
  field,
  h1,
  label,
  labelText,
  muted,
  mutedXs,
  page,
} from '@/components/ui';
import {
  accountIsEncrypted,
  isUnlocked,
  removeAccount,
  selectAccount,
  unlockAccount,
} from '@/lib/accounts';
import { resolveInternalPath } from '@/lib/internal-path';
import { parseSearch } from '@/lib/search';
import { useAccounts } from '@/lib/use-accounts';

// The account switcher (#106 pain #5): every stored account with its state,
// switching that never logs the others out, and inline unlock for encrypted
// accounts. A plain account switches on click; an encrypted one asks for its
// passcode first.
export const Route = createFileRoute('/accounts')({
  component: Accounts,
  // `next` is OPTIONAL: returning it as a always-present key would make
  // `search` a required prop on every <Link to="/accounts"> in the app.
  validateSearch: (search: Record<string, unknown>): { next?: string } =>
    typeof search.next === 'string' ? { next: search.next } : {},
});

function AccountRow({
  username,
  current,
  next,
}: {
  username: string;
  current: boolean;
  next?: string;
}) {
  const { t } = useTranslation();
  const encrypted = accountIsEncrypted(username);
  const unlocked = isUnlocked(username);
  const [unlocking, setUnlocking] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  function done() {
    // Return to the flow that sent the user here (an OAuth consent request
    // would otherwise be lost, forcing the app to start over).
    const back = resolveInternalPath(next);
    if (!back) return;
    // CLIENT-SIDE navigation only. Decrypted keys live in memory and are never
    // persisted, so a document navigation (window.location.assign) would reload
    // the app, drop the key cache, re-lock the account that was just unlocked,
    // and the consent screen would send the user straight back here forever.
    // The target is a runtime string, so the typed router cannot model it; the
    // cast is at this boundary only. resolveInternalPath has already constrained it
    // same-origin path.
    navigate({
      to: back.pathname,
      search: back.search ? parseSearch(back.search) : {},
    } as never);
  }

  async function activate() {
    if (unlocked) {
      selectAccount(username);
      done();
      return;
    }
    if (encrypted) {
      // Needs a passcode: open the inline form.
      setUnlocking(true);
      return;
    }
    // Plaintext but not yet in memory (e.g. just after a reload): load and select.
    setBusy(true);
    try {
      await unlockAccount(username);
      selectAccount(username);
      done();
    } catch (e) {
      // A corrupt persisted plaintext keystore rejects here; without this the
      // row just stopped working with nothing on screen.
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function submitUnlock() {
    setError(null);
    setBusy(true);
    try {
      await unlockAccount(username, passcode);
      selectAccount(username);
      setUnlocking(false);
      setPasscode('');
      done();
    } catch {
      setError(t('login.invalid_hs_password'));
    } finally {
      setBusy(false);
    }
  }

  return (
    // `bg-brand-tint!` wins over the recipe's own `bg-surface`: two background
    // utilities on one element are otherwise resolved by stylesheet order, not
    // by the order they appear here.
    <div
      className={clsx(
        cardTight,
        'flex flex-col gap-2.5',
        current && 'bg-brand-tint!',
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Avatar username={username} size="md" />
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold break-all">@{username}</div>
          <div className={`${mutedXs} mt-0.5 flex gap-1.5`}>
            {current && (
              <span className="font-semibold text-brand-ink">
                {t('accounts.current')}
              </span>
            )}
            {encrypted
              ? unlocked
                ? t('accounts.unlocked')
                : t('accounts.protected')
              : t('accounts.no_passcode')}
          </div>
        </div>
        {(!current || !unlocked) && (
          <button
            type="button"
            onClick={activate}
            disabled={busy}
            className="cursor-pointer border-none bg-transparent text-[13px] font-semibold text-brand-ink disabled:cursor-not-allowed"
          >
            {!unlocked ? t('accounts.unlock') : t('login.switch_an_account')}
          </button>
        )}
        <button
          type="button"
          aria-label={`${t('accounts.delete')} @${username}`}
          onClick={() => {
            // Removing wipes the only copy of the keys on this device; confirm.
            if (window.confirm(t('accounts.remove_confirm', { username }))) {
              // The confirm promised the keys would be deleted. If the write did
              // not reach storage the record comes back on reload, so say so
              // instead of silently leaving a false impression.
              if (!removeAccount(username)) {
                setError(t('accounts.remove_failed'));
              }
            }
          }}
          className="cursor-pointer border-none bg-transparent text-muted"
        >
          ✕
        </button>
      </div>

      {/* A plaintext unlock failure never opens the passcode form, so its error
          has to render outside it or the row just goes quiet. */}
      {error && !unlocking && (
        <div role="alert" className="text-[12.5px] text-danger">
          {error}
        </div>
      )}

      {unlocking && (
        <div className="flex flex-col gap-2">
          {/* A real <label>, not a placeholder. A placeholder is not an
              accessible name, and it disappears the moment the user types, so
              this field had nothing naming it at all - for a screen reader, or
              for anyone who looked away mid-entry. It is per-row, so the name
              carries the account it unlocks. */}
          <label className={label}>
            <span className={labelText}>
              {t('accounts.passcode')} · @{username}
            </span>
            <input
              className={field}
              type="password"
              name={`passcode-${username}`}
              autoComplete="current-password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              // biome-ignore lint/a11y/noAutofocus: focus the field the user just opened
              autoFocus
            />
          </label>
          {error && (
            <div role="alert" className="text-[12.5px] text-danger">
              {error}
            </div>
          )}
          {/* The button is disabled on exactly the condition that used to paint
              it `bg-brand-muted`, so the recipe's `disabled:` styling covers it. */}
          <button
            type="button"
            onClick={submitUnlock}
            disabled={busy || passcode.length === 0}
            className={`${btnPrimary} cursor-pointer`}
          >
            {t('accounts.unlock')}
          </button>
        </div>
      )}
    </div>
  );
}

function Accounts() {
  const { t } = useTranslation();
  const { usernames, selectedAccount } = useAccounts();
  const { next } = Route.useSearch();

  return (
    <section className={page}>
      <h1 className={h1}>{t('accounts.accounts')}</h1>

      {usernames.length === 0 ? (
        <p className={muted}>
          <Link to="/import">{t('accounts.add_another')}</Link>
        </p>
      ) : (
        // One column on a phone, two from `sm` and three from `lg`: the shell is
        // no longer a 480px strip, so the account list uses the width.
        <div className={cardGrid}>
          {usernames.map((u) => (
            <AccountRow
              key={u}
              username={u}
              current={u === selectedAccount}
              next={next}
            />
          ))}
        </div>
      )}

      {/* Not `btnSecondary`: the dashed, transparent "add" affordance is a
          different control, so it keeps its own class string. */}
      <Link
        to="/import"
        className="inline-flex h-11 max-w-full items-center justify-center self-start rounded-lg border border-dashed border-line-strong px-4 font-semibold text-ink no-underline"
      >
        + {t('accounts.add_another')}
      </Link>
    </section>
  );
}
