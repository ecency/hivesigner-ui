import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SecretInput } from '@/components/SecretInput';
import { UnlockAndContinue } from '@/components/UnlockAndContinue';
import { Handle, Sentence } from '@/components/Untranslated';
import {
  alertError,
  btnPrimary,
  fieldBase,
  field as fieldClass,
  formColumn,
  h1,
  labelText,
  link,
  mutedXs,
  page,
} from '@/components/ui';
import { readAccountNow } from '@/lib/account-now';
import { getKeys, stillSelected } from '@/lib/accounts';
import { effectiveProfile, metadataOf } from '@/lib/app-profile';
import { type Account, getAccount } from '@/lib/hive';
import { isValidRedirectUri } from '@/lib/oauth';
import { accountKey } from '@/lib/query-keys';
import { broadcastOperations } from '@/lib/sign-tx';
import { useAccounts } from '@/lib/use-accounts';
import { useLeaveLatch } from '@/lib/use-leave-latch';

// Edit the selected account's profile (account_update2 -> posting_json_metadata).
// A profile-only edit needs the posting key. An app account also registers here
// what Hivesigner and the API read about it: that it is an app at all, its
// callbacks, its client secret, who made it and whether it is live (#154).
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
  /** '1' when this account is an app. The fields below are its settings, and
      are saved only while it is on. */
  is_app: string;
  redirect_uris: string;
  creator: string;
  /** '1' production, '0' sandbox. */
  is_public: string;
  /** Typed to set a new secret. Never read back: only its hash is on chain. */
  secret: string;
}

/** What the chain stores for a client secret: its sha256, as hex. The API
    hashes the secret an app sends and compares it with this. */
export function secretHash(secret: string): string {
  return bytesToHex(sha256(new TextEncoder().encode(secret)));
}

export function readProfile(account: Account | null | undefined): ProfileForm {
  const profile = effectiveProfile(account);
  const s = (k: string) =>
    typeof profile[k] === 'string' ? (profile[k] as string) : '';
  return {
    name: s('name'),
    about: s('about'),
    website: s('website'),
    location: s('location'),
    profile_image: s('profile_image'),
    cover_image: s('cover_image'),
    is_app: profile.type === 'app' ? '1' : '0',
    redirect_uris: Array.isArray(profile.redirect_uris)
      ? (profile.redirect_uris as string[]).join('\n')
      : '',
    creator: s('creator'),
    // Only a real `true` is production. The old page took any truthy value,
    // which read the string "0" written by some other tool as production.
    is_public: profile.is_public === true ? '1' : '0',
    secret: '',
  };
}

export function buildProfileMetadata(
  account: Account,
  form: ProfileForm,
): string {
  const existing = metadataOf(account);
  // The version below moves what the API reads to this profile, so it is built
  // on everything its readers see now (see effectiveProfile). Anything the
  // form does not show - the client secret, the IP allowlist that keeps other
  // addresses out - comes across with it rather than being dropped.
  const profile: Record<string, unknown> = {
    ...effectiveProfile(account),
    name: form.name,
    about: form.about,
    website: form.website,
    location: form.location,
    profile_image: form.profile_image,
    cover_image: form.cover_image,
    // The API reads this profile only when it carries a version, and falls
    // back to the older `json_metadata` profile without one. The Nuxt page
    // wrote it on every save, so a profile it ever saved has it.
    version: 2,
  };
  if (form.is_app !== '1') {
    // Not an app: its settings are left exactly as they are on chain. Only an
    // account that called itself an app says otherwise, because nothing needs
    // a `type` and writing one onto every profile saved here is noise.
    if ('type' in profile) profile.type = 'user';
    return JSON.stringify({ ...existing, profile });
  }
  profile.type = 'app';
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
  if (form.creator) profile.creator = form.creator;
  else delete profile.creator;
  profile.is_public = form.is_public === '1';
  // The secret is stored as its hash and never shown again, so the field
  // starts empty on every visit: blank keeps the hash that is already there,
  // and only a value typed now replaces it.
  if (form.secret) profile.secret = secretHash(form.secret);
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
    // not edited here and drop an app's registered callbacks. The read has
    // landed in the page's copy, so that goes back: the form keeps showing
    // the profile, and the next click is judged against it again.
    if (
      !fresh ||
      (!fresh.posting_json_metadata && account.posting_json_metadata)
    ) {
      qc.setQueryData(accountKey(name), account);
      setError(t('common.try_again'));
      setStatus('error');
      return;
    }
    const values = { ...readProfile(fresh), ...shown.edits };
    // Reject a callback that could never be used: isRegisteredRedirect now
    // refuses non-loopback http, so saving one would register something the
    // consent screen silently declines. Fail here, where it can be corrected.
    // Only while the account is an app: otherwise the field is hidden and its
    // callbacks are left as they are, and refusing the save over one the owner
    // cannot see would leave them no way to correct it.
    const bad =
      values.is_app !== '1'
        ? []
        : values.redirect_uris
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
      const written = values.secret;
      await broadcastOperations([op], postingKey, name);
      // Used: drop the plaintext, and leave the field blank again, which is
      // what "keep the stored secret" looks like on the next save. Only the
      // value this save wrote, and only on the account it wrote it for: the
      // fields stay editable while the broadcast runs, so a secret typed
      // since then has not been saved and must survive.
      setEdits((prev) =>
        written && prev?.account === name && prev.values.secret === written
          ? { ...prev, values: { ...prev.values, secret: '' } }
          : prev,
      );
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

      {/* An app account is a Hive account with these settings on it, so the
          switch comes first: what it turns on is what Hivesigner and the API
          read when the app signs someone in. */}
      <label className="flex items-center gap-2 text-[13.5px]">
        <input
          type="checkbox"
          className="accent-brand"
          checked={current.is_app === '1'}
          onChange={(e) => set('is_app', e.target.checked ? '1' : '0')}
        />
        <span>{t('profile.is_app')}</span>
      </label>

      {field('name', t('profile.name'))}
      {field('about', t('profile.about'), true)}
      {field('website', t('profile.website'))}
      {field('location', t('profile.location'))}
      {field('profile_image', t('profile.profile_pic'))}
      {field('cover_image', t('profile.cover_pic'))}

      {current.is_app === '1' && (
        <>
          {field('redirect_uris', t('profile.redirect_uris'), true)}
          <p className={`${mutedXs} m-0`}>{t('profile.one_uri_line')}</p>
          {field('creator', t('profile.creator'))}

          {/* Two values of one setting, so arrow keys move between them. */}
          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className={`${labelText} mb-1 p-0`}>
              {t('profile.status')}
            </legend>
            <div className="flex flex-wrap gap-2">
              {(['1', '0'] as const).map((value) => (
                <label
                  key={value}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[13px] ${
                    current.is_public === value
                      ? 'border-brand bg-brand-tint font-semibold text-ink'
                      : 'border-line bg-surface text-muted hover:bg-subtle'
                  }`}
                >
                  <input
                    type="radio"
                    name="is_public"
                    value={value}
                    checked={current.is_public === value}
                    onChange={() => set('is_public', value)}
                    className="sr-only"
                  />
                  {t(value === '1' ? 'profile.production' : 'profile.sandbox')}
                </label>
              ))}
            </div>
          </fieldset>

          {/* The app's own credential, not a password for this site: kept out
              of managers' save and update prompts (see SecretInput). */}
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold">
              {t('profile.secret')}
            </span>
            <SecretInput
              className={fieldClass}
              name="client-secret"
              value={current.secret}
              onChange={(value) => set('secret', value)}
            />
            <span className={`${mutedXs} m-0`}>{t('profile.blank_field')}</span>
          </label>
        </>
      )}

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
