import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
import {
  alertError,
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
import { getAppDirectory } from '@/lib/app-directory';
import { getProfiles, type Profile } from '@/lib/hive';
import { safeText } from '@/lib/operation-summary';
import {
  appDirectoryKey,
  directoryProfileBatchKey,
  directoryProfileKey,
} from '@/lib/query-keys';

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
  const queryClient = useQueryClient();

  // ONE query for both lists, shared with the homepage. The API ranks the
  // featured list from real usage; if it cannot be reached this falls back to
  // reading the curated post and the follow list straight off the chain, which
  // is what the app did before the endpoint existed.
  const {
    data: index,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: appDirectoryKey(),
    queryFn: getAppDirectory,
    staleTime: 10 * 60_000,
  });
  const featured = useMemo(
    () => (index?.featured ?? []).map((app) => app.username),
    [index],
  );
  const all = index?.directory ?? [];

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
  // name and a line of description would cost megabytes.
  //
  // Split into FIXED slices rather than one query over everything visible.
  // Keying a single query on the whole visible set meant every "show more"
  // produced a new key and re-downloaded every profile already on screen, so
  // revealing the directory cost O(n^2) transfers. Slice boundaries are fixed
  // at multiples of PAGE_SIZE, so a slice already fetched keeps its key and
  // comes straight from the cache; only the newly revealed slice is fetched.
  const slices = useMemo(() => {
    const out: string[][] = [];
    for (let i = 0; i < visible.length; i += PAGE_SIZE) {
      out.push(visible.slice(i, i + PAGE_SIZE));
    }
    return out;
  }, [visible]);

  const profileQuery = (names: string[]) => ({
    queryKey: directoryProfileBatchKey(names),
    queryFn: async () => {
      const batch = await getProfiles(names);
      // Seed the single-app cache AppProfile reads. Not the OAuth consent
      // screen: that caches a different shape under its own key, and the two
      // sharing one is what crashed consent (see lib/query-keys.ts). Without
      // this, opening an app whose profile this batch already fetched issued a
      // second getAccounts for it inside the same freshness window.
      for (const [name, profile] of Object.entries(batch)) {
        queryClient.setQueryData(directoryProfileKey(name), profile);
      }
      return batch;
    },
    enabled: names.length > 0,
    staleTime: 10 * 60_000,
  });

  // `featured` is its own query rather than part of the slices: it arrives
  // asynchronously, and folding it into the front of the list would shift every
  // slice boundary the moment it landed, refetching all of them once.
  const results = useQueries({
    queries: [featured, ...slices].map(profileQuery),
  });

  // Not memoised on purpose: useQueries hands back a fresh array every render,
  // so any dependency list built from it would miss every time anyway. Merging
  // a handful of small objects is cheaper than pretending otherwise.
  const profiles: Record<string, Profile> = Object.assign(
    {},
    ...results.map((r) => r.data ?? {}),
  );

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
          {/* min-w-0 + break-all + isolate: this echoes the user's own query,
              and a long unbroken one expanded a 320px viewport to 1328px. */}
          <h2 className={`${h2} min-w-0 break-all [unicode-bidi:isolate]`}>
            {query ? t('apps.search_for', { search }) : t('apps.all_apps')}
          </h2>
          {/* `!isError` matters as much as `!isLoading`: on a failed load
              `matches` is empty, so this rendered "0 apps" directly beside the
              message saying the directory could not be reached - restating the
              exact false claim the error state exists to avoid. */}
          {!isLoading && !isError && (
            <span className={mutedXs}>
              {t('apps.count', { count: matches.length })}
            </span>
          )}
        </div>

        {isLoading ? (
          <p className={muted}>{t('apps.loading')}</p>
        ) : isError ? (
          // NOT the empty state. "There are no apps" is a very different claim
          // from "we could not reach a node", and the directory coming back
          // empty because of an outage used to read as the former.
          <div role="alert" className={`${alertError} flex flex-col gap-3`}>
            <span>{t('apps.directory_unavailable')}</span>
            <button
              type="button"
              onClick={() => refetch()}
              className={`${btnGhost} self-start`}
            >
              {t('common.try_again')}
            </button>
          </div>
        ) : matches.length === 0 ? (
          <p className={`${muted} break-all [unicode-bidi:isolate]`}>
            {t('apps.empty_search', { search })}
          </p>
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
