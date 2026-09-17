import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Handle } from '@/components/Untranslated';
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

import { getKeys } from '@/lib/accounts';
import { type Account, getAccount } from '@/lib/hive';
import { isValidRedirectUri } from '@/lib/oauth';
import { accountKey } from '@/lib/query-keys';
import { broadcastOperations } from '@/lib/sign-tx';
import { useAccounts } from '@/lib/use-accounts';

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

  const initial = useMemo(() => readProfile(account), [account]);
  const [form, setForm] = useState<ProfileForm | null>(null);
  // The account the pending edits belong to. Without this the form survived an
  // account switch and `current` kept preferring it, so saving wrote one
  // account's profile onto another.
  const [formFor, setFormFor] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'busy' | 'done' | 'error'>(
    'idle',
  );
  const [error, setError] = useState('');
  const current =
    form !== null && formFor === (account?.name ?? null) ? form : initial;

  const isUnlocked = !!selectedAccount && unlocked.includes(selectedAccount);
  const postingKey = selectedAccount
    ? getKeys(selectedAccount)?.posting
    : undefined;

  function set(field: keyof ProfileForm, value: string) {
    // `initial` is empty until the account query resolves; seeding from it would
    // copy blanks over the stored profile on save.
    if (!account) return;
    setForm({ ...current, [field]: value });
    setFormFor(account.name);
  }

  async function save() {
    if (!account || !postingKey) return;
    // Reject a callback that could never be used: isRegisteredRedirect now
    // refuses non-loopback http, so saving one would register something the
    // consent screen silently declines. Fail here, where it can be corrected.
    const bad = current.redirect_uris
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean)
      .filter((u) => !isValidRedirectUri(u));
    if (bad.length > 0) {
      setStatus('error');
      setError(
        `Not a usable callback (https, or http on localhost): ${bad.join(', ')}`,
      );
      return;
    }
    setStatus('busy');
    setError('');
    try {
      const op = [
        'account_update2',
        {
          account: account.name,
          json_metadata: '',
          posting_json_metadata: buildProfileMetadata(account, current),
          extensions: [],
        },
      ] as [string, Record<string, unknown>];
      await broadcastOperations([op], postingKey, account.name);
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
        <div role="alert" className={alertError}>
          {error}
        </div>
      )}
      {status === 'done' && (
        <output className="block text-[13px] text-ok">
          {t('settings.saved')}
        </output>
      )}

      {/* Full width under the thumb on a phone, its own size once there is room. */}
      {!isUnlocked || !postingKey ? (
        // Keyed: its children differ from a plain label's, so React builds it
        // fresh rather than reworking another link's text (translation-guard).
        <Link
          key="unlock"
          to="/accounts"
          className={`${btnPrimary} sm:self-start`}
        >
          {`${t('accounts.unlock')} `}
          <Handle name={selectedAccount} />
        </Link>
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
