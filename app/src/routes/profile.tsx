import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { type CSSProperties, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getKeys } from '@/lib/accounts';
import { type Account, getAccount } from '@/lib/hive';
import { isValidRedirectUri } from '@/lib/oauth';
import { broadcastOperations } from '@/lib/sign-tx';
import { useAccounts } from '@/lib/use-accounts';

// Edit the selected account's profile (account_update2 -> posting_json_metadata).
// A profile-only edit needs the posting key. App accounts also register their
// redirect URIs here.
export const Route = createFileRoute('/profile')({
  component: Profile,
});

const fld: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  height: 44,
  padding: '0 12px',
  border: '1px solid #d1d9e0',
  borderRadius: 8,
  fontSize: 15,
};

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
    queryKey: ['account', selectedAccount],
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
      <section style={{ padding: 20 }}>
        <Link to="/accounts">{t('footer.login')}</Link>
      </section>
    );
  }

  const field = (key: keyof ProfileForm, label: string, multiline = false) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        htmlFor={`profile-${key}`}
        style={{ fontSize: 13, fontWeight: 600 }}
      >
        {label}
      </label>
      {multiline ? (
        <textarea
          id={`profile-${key}`}
          rows={4}
          style={{ ...fld, height: 'auto', padding: 12 }}
          value={current[key]}
          onChange={(e) => set(key, e.target.value)}
        />
      ) : (
        <input
          id={`profile-${key}`}
          style={fld}
          value={current[key]}
          onChange={(e) => set(key, e.target.value)}
        />
      )}
    </div>
  );

  return (
    <section
      style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
        {t('profile.profile')} · @{selectedAccount}
      </h1>

      {field('name', t('profile.name'))}
      {field('about', t('profile.about'), true)}
      {field('website', t('profile.website'))}
      {field('location', t('profile.location'))}
      {field('profile_image', t('profile.profile_pic'))}
      {field('cover_image', t('profile.cover_pic'))}
      {field('redirect_uris', t('profile.redirect_uris'), true)}
      <p style={{ margin: 0, fontSize: 12, color: '#59636e' }}>
        {t('profile.one_uri_line')}
      </p>

      {status === 'error' && (
        <div role="alert" style={{ fontSize: 13, color: '#cf222e' }}>
          {error}
        </div>
      )}
      {status === 'done' && (
        <output style={{ display: 'block', fontSize: 13, color: '#1a5c2b' }}>
          {t('settings.saved')}
        </output>
      )}

      {!isUnlocked || !postingKey ? (
        <Link
          to="/accounts"
          style={{
            height: 48,
            borderRadius: 10,
            background: '#E31337',
            color: '#fff',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
          }}
        >
          {t('accounts.unlock')} @{selectedAccount}
        </Link>
      ) : (
        <button
          type="button"
          onClick={save}
          disabled={status === 'busy'}
          style={{
            height: 48,
            border: 'none',
            borderRadius: 10,
            background: status === 'busy' ? '#f0a5b3' : '#E31337',
            color: '#fff',
            fontSize: 15,
            fontWeight: 600,
            cursor: status === 'busy' ? 'not-allowed' : 'pointer',
          }}
        >
          {status === 'busy' ? '…' : t('common.save')}
        </button>
      )}
    </section>
  );
}
