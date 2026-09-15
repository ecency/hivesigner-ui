import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
import { card, link, mutedXs } from '@/components/ui';
import { getProfiles } from '@/lib/hive';
import { safeText } from '@/lib/operation-summary';

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
  const { data: profiles } = useQuery({
    queryKey: ['app-profiles', username],
    queryFn: () => getProfiles([username]),
    staleTime: 10 * 60_000,
  });
  const profile = profiles?.[username];

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

      {site && (
        // The website is the app's OWN claim. Saying so matters here: this is
        // the screen where posting authority is handed over, and a lapsed
        // domain that now redirects elsewhere looks identical from here.
        <p className={mutedXs}>{t('apps.website_disclaimer')}</p>
      )}
    </div>
  );
}
