import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { AccountList } from '@/components/AccountList';
import { formColumn, h1, link, muted, page } from '@/components/ui';
import { selectAccount } from '@/lib/accounts';
import { resolveInternalPath } from '@/lib/internal-path';
import { parseSearch } from '@/lib/search';
import { useAccounts } from '@/lib/use-accounts';

// The accounts on this device (#106 pain #5, simplified in #146): pick one,
// or remove one. Picking never logs the others out and never asks for a
// passcode: the screen that needs the keys asks for it in place.
export const Route = createFileRoute('/accounts')({
  component: Accounts,
  // `next` is OPTIONAL: returning it as a always-present key would make
  // `search` a required prop on every <Link to="/accounts"> in the app.
  validateSearch: (search: Record<string, unknown>): { next?: string } =>
    typeof search.next === 'string' ? { next: search.next } : {},
});

function Accounts() {
  const { t } = useTranslation();
  const { usernames, selectedAccount } = useAccounts();
  const { next } = Route.useSearch();
  const navigate = useNavigate();

  function pick(username: string) {
    selectAccount(username);
    // Back to the flow that sent the user here, if any (an OAuth consent
    // request would otherwise be lost, forcing the app to start over).
    const back = resolveInternalPath(next);
    if (!back) return;
    // CLIENT-SIDE navigation only. Decrypted keys live in memory and are
    // never persisted, so a document navigation (window.location.assign)
    // would reload the app and drop every unlocked account. The target is a
    // runtime string the typed router cannot model; resolveInternalPath has
    // already constrained it to a same-origin path.
    navigate({
      to: back.pathname,
      search: back.search ? parseSearch(back.search) : {},
    } as never);
  }

  return (
    // One column, as a list reads best (#146), at a comfortable measure
    // instead of stretching across the widened shell.
    <section className={`${page} ${formColumn}`}>
      <h1 className={h1}>{t('accounts.accounts')}</h1>

      {usernames.length === 0 ? (
        <p className={muted}>
          <Link to="/import" search={next ? { next } : {}} className={link}>
            {t('accounts.add_another')}
          </Link>
        </p>
      ) : (
        <AccountList current={selectedAccount} onPick={pick} removable />
      )}

      {/* Not `btnSecondary`: the dashed, transparent "add" affordance is a
          different control, so it keeps its own class string. */}
      {/* `next` rides along: a user who came here from a consent or sign
          request, and finds the account they want is not on the device yet,
          must get back to that request after importing it. */}
      <Link
        to="/import"
        search={next ? { next } : {}}
        className="inline-flex min-h-11 max-w-full items-center justify-center self-start rounded-lg border border-dashed border-line-strong px-4 py-2 text-center font-semibold text-ink no-underline"
      >
        + {t('accounts.add_another')}
      </Link>
    </section>
  );
}
