import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
import { card, link, mutedXs } from '@/components/ui';
import { getProfiles } from '@/lib/hive';
import { safeText } from '@/lib/operation-summary';
import { directoryProfileKey } from '@/lib/query-keys';

/**
 * The app's own published website, or null.
 *
 * Every field here is written by the app account itself, so this is not a
 * formatting helper - it is the gate. Only http(s) is accepted, which keeps
 * `javascript:` and `data:` out of an href built from chain data, and the HOST
 * is what gets rendered so the destination is legible before the click rather
 * than hidden behind a display name.
 *
 * It cannot promise the destination is safe. Several app domains in this
 * directory have lapsed and been re-registered, and now redirect to unrelated
 * spam - so the URL is presented as the app's own claim, never as an
 * endorsement, and the link is nofollow + noreferrer.
 */
export function parseWebsite(
  value: string | undefined,
): { href: string; host: string } | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw) return null;
  // A bare "actifit.io" is common in these profiles and is not a URL yet.
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (!url.hostname.includes('.')) return null;
  return { href: url.toString(), host: url.host };
}

/**
 * Who an app is, on the screen that offers it posting authority.
 *
 * The directory used to show this and the rewrite dropped it, so the grant
 * screen named an account and nothing else. Someone deciding whether to let an
 * app post for them should be able to see what it claims to be first.
 */
export function AppProfile({ username }: { username: string }) {
  const { t } = useTranslation();
  // The DIRECTORY profile, which is a different shape from the one the OAuth
  // consent screen caches for the same account - sharing a key between them
  // crashed consent (see lib/query-keys.ts). The directory seeds this same key
  // from its batch, so opening an app the list already loaded does not refetch.
  const { data: profile } = useQuery({
    queryKey: directoryProfileKey(username),
    queryFn: async () => (await getProfiles([username]))[username] ?? null,
    staleTime: 10 * 60_000,
  });

  const handle = `@${username}`;
  const name = profile?.name ? safeText(profile.name) : null;
  const about = profile?.about ? safeText(profile.about) : null;
  const site = parseWebsite(profile?.website);
  const creator = profile?.creator ? safeText(profile.creator) : null;

  return (
    <div className={`${card} flex flex-col gap-3`}>
      <div className="flex items-start gap-3">
        <Avatar username={username} size="lg" />
        <div className="min-w-0 flex-1">
          {name && (
            <div className="text-base font-semibold break-words [unicode-bidi:isolate]">
              {name}
            </div>
          )}
          {/* Always shown: the handle is the only part of the identity the app
              cannot choose freely, so it is what a user can actually check. */}
          <div className={`${mutedXs} break-all [unicode-bidi:isolate]`}>
            {handle}
          </div>
          {site && (
            <a
              href={site.href}
              target="_blank"
              // nofollow as well: this is an unvetted URL out of chain data.
              rel="noopener noreferrer nofollow"
              className={`${link} mt-1 inline-block text-[13px] break-all`}
            >
              {site.host}
            </a>
          )}
        </div>
      </div>

      {about && (
        <p className={`${mutedXs} leading-[1.5] [unicode-bidi:isolate]`}>
          {about}
        </p>
      )}

      {creator && (
        <div className={`${mutedXs} [unicode-bidi:isolate]`}>
          {t('apps.creator')}: @{creator}
        </div>
      )}

      {(site || creator || name || about) && (
        // EVERY field above is the app account's own claim, and `about` is part
        // of that: listing only site/creator/name meant a profile carrying
        // nothing but a description - "the official Hive wallet", say - showed
        // it directly above the grant control with no warning at all.
        <p className={mutedXs}>{t('apps.self_declared')}</p>
      )}
    </div>
  );
}
