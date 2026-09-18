import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UnlockAndContinue } from '@/components/UnlockAndContinue';
import { Handle, Sentence } from '@/components/Untranslated';
import {
  alertError,
  btnPrimary,
  fieldBase,
  field as fieldClass,
  formColumn,
  h1,
  link,
  mutedXs,
  page,
} from '@/components/ui';
import { readAccountNow } from '@/lib/account-now';
import { getKeys, stillSelected } from '@/lib/accounts';
import { type Account, getAccount } from '@/lib/hive';
import { isValidRedirectUri } from '@/lib/oauth';
import { accountKey } from '@/lib/query-keys';
import { broadcastOperations } from '@/lib/sign-tx';
import { useAccounts } from '@/lib/use-accounts';
import { useLeaveLatch } from '@/lib/use-leave-latch';

// Edit the selected account's profile (account_update2 -> posting_json_metadata).
// A profile-only edit needs the posting key. App accounts also register their
// redirect URIs here.
export const Route = createFileRoute('/profile')({
  component: Profile,
});

interface ProfileForm {
  name: string;
  about: string;
  website: string;
  location: string;
  profile_image: string;
  cover_image: string;
  redirect_uris: string;
}

function readProfile(account: Account | null | undefined): ProfileForm {
  let profile: Record<string, unknown> = {};
  try {
    profile = JSON.parse(account?.posting_json_metadata || '{}').profile ?? {};
  } catch {
    profile = {};
  }
  const s = (k: string) =>
    typeof profile[k] === 'string' ? (profile[k] as string) : '';
  return {
    name: s('name'),
    about: s('about'),
    website: s('website'),
    location: s('location'),
    profile_image: s('profile_image'),
    cover_image: s('cover_image'),
    redirect_uris: Array.isArray(profile.redirect_uris)
      ? (profile.redirect_uris as string[]).join('\n')
      : '',
  };
}

export function buildProfileMetadata(
  account: Account,
  form: ProfileForm,
): string {
  let existing: Record<string, unknown> = {};
  try {
    existing = JSON.parse(account.posting_json_metadata || '{}');
  } catch {
    existing = {};
  }
  const profile: Record<string, unknown> = {
    ...((existing.profile as Record<string, unknown>) ?? {}),
    name: form.name,
    about: form.about,
    website: form.website,
    location: form.location,
    profile_image: form.profile_image,
    cover_image: form.cover_image,
  };
  const uris = form.redirect_uris
    .split('\n')
    .map((u) => u.trim())
    .filter(Boolean);
  // Empty means "no registered callbacks": remove the key so an app owner can
  // actually de-register a compromised URL (keeping the old list would leave it
  // active). Only omit the field entirely for a profile that never had it.
  if (uris.length > 0) {
    profile.redirect_uris = uris;
  } else {
    delete profile.redirect_uris;
  }
  return JSON.stringify({ ...existing, profile });
}

function Profile() {
  const { t } = useTranslation();
  const { selectedAccount, unlocked } = useAccounts();
  const { data: account } = useQuery({
    queryKey: accountKey(selectedAccount),
    queryFn: (): Promise<Account | null> =>
      selectedAccount ? getAccount(selectedAccount) : Promise.resolve(null),
    enabled: !!selectedAccount,
  });

  const qc = useQueryClient();
  const initial = useMemo(() => readProfile(account), [account]);
  // Only the fields the user changed, with the account they belong to.
  // Without the account the edits survived a switch, and saving wrote one
  // account's profile onto another. Only the changed ones: a save lays them
  // over the profile as the chain has it then, so a field left alone keeps
  // what was saved elsewhere since the page loaded.
  const [edits, setEdits] = useState<{
    account: string;
    values: Partial<ProfileForm>;
  } | null>(null);
  const mine = edits && edits.account === account?.name ? edits.values : {};
  const current = { ...initial, ...mine };
  const [status, setStatus] = useState<'idle' | 'busy' | 'done' | 'error'>(
    'idle',
  );
  const [error, setError] = useState('');
  // Callbacks the form refused, shown exactly (not inside translated copy).
  const [badUris, setBadUris] = useState('');
  // What a save sends is the form as it is when the save runs. Unlocking in
  // the same click takes seconds, the fields stay editable meanwhile, and the
  // click's own render would send what they held before (#146).
  const formNow = useRef({ account: account?.name, edits: mine });
  formNow.current = { account: account?.name, edits: mine };

  const isUnlocked = !!selectedAccount && unlocked.includes(selectedAccount);
  const leave = useLeaveLatch();
  const postingKey = selectedAccount
    ? getKeys(selectedAccount)?.posting
    : undefined;

  function set(field: keyof ProfileForm, value: string) {
    // `initial` is empty until the account query resolves; seeding from it would
    // copy blanks over the stored profile on save.
    if (!account) return;
    const name = account.name;
    setEdits((prev) => ({
      account: name,
      values: {
        ...(prev?.account === name ? prev.values : {}),
        [field]: value,
      },
    }));
  }

  async function save() {
    // Read now, not from this render: an unlock in the same click has only
    // just put the keys in memory.
    const postingKey = selectedAccount
      ? getKeys(selectedAccount)?.posting
      : undefined;
    if (!account || !postingKey) return;
    const left = leave.mark();
    const name = account.name;
    // Another tab chose someone else while the passcode was checked: the
    // screen now shows their profile (blank until it loads), and saving it
    // onto the account clicked would overwrite that one. Nothing is saved.
    if (!stillSelected(name) || formNow.current.account !== name) return;
    setStatus('busy');
    setError('');
    setBadUris('');
    // The metadata is written whole, so it is built on the profile as the
    // chain has it now, read by name: the page's copy is as old as the
    // visit, and whatever was saved elsewhere since (another app, a field
    // this form does not show) would be reverted by it.
    let fresh: Account | null;
    try {
      fresh = await readAccountNow(qc, name);
    } catch {
      setError(t('authorize.read_failed'));
      setStatus('error');
      return;
    }
    // The form as it is now: the fields stay editable during the read too.
    const shown = formNow.current;
    if (left() || !stillSelected(name) || shown.account !== name) {
      setStatus('idle');
      return;
    }
    // No account, or one without the metadata the page had: some nodes leave
    // posting_json_metadata out, and building on that would blank every field
    // not edited here and drop an app's registered callbacks.
    if (
      !fresh ||
      (!fresh.posting_json_metadata && account.posting_json_metadata)
    ) {
      setError(t('common.try_again'));
      setStatus('error');
      return;
    }
    const values = { ...readProfile(fresh), ...shown.edits };
    // Reject a callback that could never be used: isRegisteredRedirect now
    // refuses non-loopback http, so saving one would register something the
    // consent screen silently declines. Fail here, where it can be corrected.
    const bad = values.redirect_uris
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean)
      .filter((u) => !isValidRedirectUri(u));
    if (bad.length > 0) {
      setStatus('error');
      setError('');
      setBadUris(bad.join(', '));
      return;
    }
    try {
      const op = [
        'account_update2',
        {
          account: name,
          json_metadata: '',
          posting_json_metadata: buildProfileMetadata(fresh, values),
          extensions: [],
        },
      ] as [string, Record<string, unknown>];
      await broadcastOperations([op], postingKey, name);
      setStatus('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
    }
  }

  if (!selectedAccount) {
    return (
      // `items-start` so the link keeps its own width instead of stretching its
      // hit area across the column.
      <section className={`${page} items-start`}>
        <Link to="/accounts" className={link}>
          {t('footer.login')}
        </Link>
      </section>
    );
  }

  const field = (key: keyof ProfileForm, label: string, multiline = false) => (
    // Not the shared `label` recipe: it greys its whole subtree and a form
    // control inherits that colour, which would fade the values being edited.
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`profile-${key}`} className="text-[13px] font-semibold">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={`profile-${key}`}
          rows={4}
          className={`${fieldBase} p-3`}
          value={current[key]}
          onChange={(e) => set(key, e.target.value)}
        />
      ) : (
        <input
          id={`profile-${key}`}
          className={fieldClass}
          value={current[key]}
          onChange={(e) => set(key, e.target.value)}
        />
      )}
    </div>
  );

  return (
    // A form, so it stays one readable column: the shell widens on a desktop,
    // but stretching these inputs across it would only make them harder to read.
    <section className={`${page} ${formColumn} sm:max-w-xl`}>
      <h1 className={h1}>
        {`${t('profile.profile')} · `}
        <Handle name={selectedAccount} />
      </h1>

      {field('name', t('profile.name'))}
      {field('about', t('profile.about'), true)}
      {field('website', t('profile.website'))}
      {field('location', t('profile.location'))}
      {field('profile_image', t('profile.profile_pic'))}
      {field('cover_image', t('profile.cover_pic'))}
      {field('redirect_uris', t('profile.redirect_uris'), true)}
      <p className={`${mutedXs} m-0`}>{t('profile.one_uri_line')}</p>

      {status === 'error' && (
        // Keyed by kind: a sentence and a plain message are built fresh
        // rather than reworked into each other (see translation-guard.ts).
        <div
          key={badUris ? 'uris' : 'error'}
          role="alert"
          className={alertError}
        >
          {badUris ? (
            <Sentence k="profile.bad_callbacks" values={{ uris: badUris }} />
          ) : (
            error
          )}
        </div>
      )}
      {status === 'done' && (
        <output className="block text-[13px] text-ok">
          {t('settings.saved')}
        </output>
      )}

      {/* Full width under the thumb on a phone, its own size once there is room. */}
      {!isUnlocked ? (
        // The passcode here, and the same click saves (#146).
        <div className="sm:max-w-md">
          <UnlockAndContinue
            key={`unlock:${selectedAccount}`}
            username={selectedAccount}
            action={t('common.save')}
            leave={leave}
            onUnlocked={save}
          />
        </div>
      ) : !postingKey ? (
        <p className="m-0 text-[13px] text-warn">
          <Sentence
            k="sign.missing_posting_key"
            values={{ account: `@${selectedAccount}` }}
          />
        </p>
      ) : (
        <button
          type="button"
          onClick={save}
          disabled={status === 'busy'}
          className={`${btnPrimary} cursor-pointer sm:self-start`}
        >
          {status === 'busy' ? '…' : t('common.save')}
        </button>
      )}
    </section>
  );
}
