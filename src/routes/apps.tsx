import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
import {
  btnGhost,
  cardGrid,
  cardTight,
  field,
  h1,
  h2,
  muted,
  mutedXs,
  page,
} from '@/components/ui';
import { getAllApps, getProfiles, getTopApps, type Profile } from '@/lib/hive';
import { safeText } from '@/lib/operation-summary';

// The directory of apps that use Hivesigner to sign in.
//
// It used to show only the eight curated entries from the @hivesigner/top-apps
// post, which is why an app added last month was nowhere to be found. The full
// directory - every account @hivesigner follows, ~900 of them - is back, with
// the curated list kept as a "featured" row on top.
export const Route = createFileRoute('/apps')({
  component: Apps,
});

/** How many cards to show before "show more". Profiles load for these only. */
const PAGE_SIZE = 24;

function AppCard({
  username,
  profile,
}: {
  username: string;
  profile?: Profile;
}) {
  // Display name and description come out of the account's own metadata, so
  // they are attacker-controlled: an app can call itself anything. safeText
  // strips the bidi and zero-width characters that let one name render as
  // another, and the isolate keeps a right-to-left name from reordering the
  // text around it.
  const handle = `@${username}`;
  const title = profile?.name ? safeText(profile.name) : handle;
  const about = profile?.about ? safeText(profile.about) : null;
  // Plenty of accounts set their display name to their own handle, which
  // rendered the card as "@a1ebrijes" over "@a1ebrijes". Show the handle line
  // only when it says something the title does not.
  const showHandle = title.trim().toLowerCase() !== handle.toLowerCase();

  return (
    <Link
      to="/authorize/$username"
      params={{ username }}
      className={`${cardTight} flex items-start gap-3 text-ink no-underline hover:border-line-strong`}
    >
      <Avatar username={username} size="md" className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold [unicode-bidi:isolate]">
          {title}
        </div>
        {/* The handle is shown alongside any display name: it is the only part
            of the identity the app cannot choose freely, so it is what a user
            can actually check against the account they are authorizing. */}
        {showHandle && (
          <div className={`${mutedXs} truncate [unicode-bidi:isolate]`}>
            {handle}
          </div>
        )}
        {about && (
          <div
            className={`${mutedXs} mt-1 line-clamp-2 [unicode-bidi:isolate]`}
          >
            {about}
          </div>
        )}
      </div>
    </Link>
  );
}

function Apps() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);

  const { data: featured = [] } = useQuery({
    queryKey: ['top-apps'],
    queryFn: getTopApps,
    staleTime: 10 * 60_000,
  });
  const { data: all = [], isLoading } = useQuery({
    queryKey: ['all-apps'],
    queryFn: getAllApps,
    staleTime: 10 * 60_000,
  });

  const query = search.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!query) return all;
    // Shortest first, so "eco" puts @ecoin ahead of @ecosystem-tracker.
    return all
      .filter((a) => a.includes(query))
      .sort((a, b) => a.length - b.length);
  }, [all, query]);

  const visible = matches.slice(0, limit);

  // Profiles for the cards ON SCREEN only. Fetching all ~900 accounts to show a
  // name and a line of description would cost megabytes; this is one call.
  const shown = useMemo(
    () => [...new Set([...featured, ...visible])],
    [featured, visible],
  );
  const { data: profiles = {} } = useQuery({
    queryKey: ['app-profiles', shown.join(',')],
    queryFn: () => getProfiles(shown),
    enabled: shown.length > 0,
    staleTime: 10 * 60_000,
  });

  return (
    <section className={page}>
      <div className="flex flex-col gap-1">
        <h1 className={h1}>{t('apps.store')}</h1>
        <p className={muted}>{t('apps.directory_hint')}</p>
      </div>

      {/* Full width on a phone, capped from `sm` up: a search box stretched
          across the whole shell reads badly. The results use the extra room. */}
      <input
        type="search"
        aria-label={t('apps.search_placeholder')}
        placeholder={t('apps.search_placeholder')}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setLimit(PAGE_SIZE);
        }}
        className={`${field} sm:max-w-md`}
      />

      {!query && featured.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className={h2}>{t('apps.featured')}</h2>
          <div className={cardGrid}>
            {featured.map((app) => (
              <AppCard key={app} username={app} profile={profiles[app]} />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className={h2}>
            {query ? t('apps.search_for', { search }) : t('apps.all_apps')}
          </h2>
          {!isLoading && (
            <span className={mutedXs}>
              {t('apps.count', { count: matches.length })}
            </span>
          )}
        </div>

        {isLoading ? (
          <p className={muted}>{t('apps.loading')}</p>
        ) : matches.length === 0 ? (
          <p className={muted}>{t('apps.empty_search', { search })}</p>
        ) : (
          <>
            <div className={cardGrid}>
              {visible.map((app) => (
                <AppCard key={app} username={app} profile={profiles[app]} />
              ))}
            </div>
            {matches.length > visible.length && (
              <button
                type="button"
                onClick={() => setLimit((n) => n + PAGE_SIZE * 2)}
                className={`${btnGhost} self-start`}
              >
                {t('apps.show_more')}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
