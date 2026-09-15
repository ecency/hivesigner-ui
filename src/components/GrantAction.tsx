import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  alertError,
  btnPrimary,
  card,
  formColumn,
  h1,
  page,
} from '@/components/ui';
import { getKeys } from '@/lib/accounts';
import {
  buildGrantOperation,
  buildRevokeOperation,
  hasGrant,
} from '@/lib/grant';
import { type Account, getAccount } from '@/lib/hive';
import { broadcastOperations } from '@/lib/sign-tx';
import { useAccounts } from '@/lib/use-accounts';

// Shared screen for /authorize/:username and /revoke/:username. Grant or revoke
// the app's posting authority with the selected account's ACTIVE key.

export function GrantAction({
  appName,
  mode,
}: {
  appName: string;
  mode: 'grant' | 'revoke';
}) {
  const { t } = useTranslation();
  const { selectedAccount, unlocked } = useAccounts();
  const [status, setStatus] = useState<'idle' | 'busy' | 'done' | 'error'>(
    'idle',
  );
  const [error, setError] = useState('');

  const { data: account, refetch } = useQuery({
    queryKey: ['account', selectedAccount],
    queryFn: (): Promise<Account | null> =>
      selectedAccount ? getAccount(selectedAccount) : Promise.resolve(null),
    enabled: !!selectedAccount,
  });

  const isUnlocked = !!selectedAccount && unlocked.includes(selectedAccount);
  const activeKey = selectedAccount
    ? getKeys(selectedAccount)?.active
    : undefined;

  const op = account
    ? mode === 'grant'
      ? buildGrantOperation(account, appName)
      : buildRevokeOperation(account, appName)
    : null;
  // A grant already present (or a revoke of something absent) is a no-op.
  const alreadyDone =
    !!account &&
    (mode === 'grant' ? hasGrant(account.posting, appName) : op === null);

  async function submit() {
    if (!account || !activeKey || !op) return;
    setStatus('busy');
    setError('');
    try {
      await broadcastOperations([op], activeKey, account.name);
      setStatus('done');
      await refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
    }
  }

  const verb = mode === 'grant' ? t('authorize.authorize') : t('revoke.revoke');

  return (
    // A confirm-and-act screen, so it stays one readable column instead of
    // stretching the sentence across the widened shell.
    <section className={`${page} ${formColumn} sm:max-w-xl`}>
      {/* `appName` is a rendered value taken from the URL, so let it wrap
          rather than push the page sideways at 320px. */}
      <h1 className={`${h1} break-words`}>
        {verb} @{appName}
      </h1>

      <div className={`${card} text-sm break-words`}>
        {mode === 'grant'
          ? `@${appName} will be able to post, comment, vote and follow as @${selectedAccount}.`
          : `@${appName} will no longer be able to act as @${selectedAccount}.`}
        <div className="mt-2 text-[12.5px] text-[#7a5300]">
          {t('authorize.requires_active_key', { authority: 'active' }).replace(
            /<\/?b>/g,
            '',
          )}
        </div>
      </div>

      {status === 'done' || alreadyDone ? (
        // No success recipe exists in ui.ts; these are the card metrics with
        // the existing green palette, kept verbatim.
        <output className="block rounded-xl border border-[#a7dab8] bg-[#e6f4ea] p-4 text-sm font-semibold break-words text-[#1a5c2b]">
          {mode === 'grant'
            ? `@${appName} is authorized.`
            : `@${appName} is revoked.`}
        </output>
      ) : null}

      {status === 'error' && (
        <div role="alert" className={`${alertError} break-words`}>
          {error}
        </div>
      )}

      {/* Full-width actions on a phone; from sm they sit inline at their own
          width with the cancel link beside them. */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        {!selectedAccount ? (
          <Link to="/import" className={btnPrimary}>
            {t('common.continue')}
          </Link>
        ) : !isUnlocked || !activeKey ? (
          <Link to="/accounts" className={btnPrimary}>
            {t('accounts.unlock')} @{selectedAccount}
          </Link>
        ) : alreadyDone || status === 'done' ? (
          <Link to="/accounts" className={btnPrimary}>
            {t('common.continue')}
          </Link>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={status === 'busy'}
            className={`${btnPrimary} cursor-pointer`}
          >
            {status === 'busy' ? '…' : verb}
          </button>
        )}
        <Link to="/accounts" className="text-center text-[13px] text-[#59636e]">
          {t('common.cancel')}
        </Link>
      </div>
    </section>
  );
}
