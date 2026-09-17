import { useQuery } from '@tanstack/react-query';
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
import { type DirectoryApp, fetchAppDirectory } from '@/lib/app-directory';
import { safeText } from '@/lib/operation-summary';
import { appDirectoryKey } from '@/lib/query-keys';

// Apps that use Hivesigner, from the API, which builds the list out of what it
// actually serves. ONE request: the response carries each app's name, website
// and description, so nothing here fetches profiles off the chain, batches them
// or seeds a cache.
export const Route = createFileRoute('/apps')({
  component: Apps,
});

/** How many cards to show before "show more". */
const PAGE_SIZE = 24;

function AppCard({ app }: { app: DirectoryApp }) {
  // Display name and description are the app account's OWN metadata, so they
  // are attacker-controlled: an app can call itself anything. safeText strips
  // the bidi and zero-width characters that let one name render as another, and
  // the isolate keeps a right-to-left name from reordering the text around it.
  const handle = `@${app.username}`;
  const title = app.name ? safeText(app.name) : handle;
  const about = app.about ? safeText(app.about) : null;
  // Plenty of accounts set their display name to their own handle, which
  // rendered the card as "@a1ebrijes" over "@a1ebrijes".
  const showHandle = title.trim().toLowerCase() !== handle.toLowerCase();

  return (
    <Link
      to="/authorize/$username"
      params={{ username: app.username }}
      className={`${cardTight} flex items-start gap-3 text-ink no-underline hover:border-line-strong`}
    >
      <Avatar username={app.username} size="md" className="mt-0.5" />
      <div className="min-w-0 flex-1">
        {/* <bdi>: an app's own name, handle and blurb run in their own
            direction, whatever the page's. */}
        <div className="truncate text-[15px] font-semibold">
          <bdi>{title}</bdi>
        </div>
        {/* The handle is shown alongside any display name: it is the only part
            of the identity the app cannot choose freely, so it is what a user
            can actually check against the account they are authorizing. */}
        {showHandle && (
          <div className={`${mutedXs} truncate`}>
            <bdi>{handle}</bdi>
          </div>
        )}
        {about && (
          <div className={`${mutedXs} mt-1 line-clamp-2`}>
            <bdi>{about}</bdi>
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

  const {
    data: index,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: appDirectoryKey(),
    queryFn: () => fetchAppDirectory(),
    staleTime: 10 * 60_000,
  });

  const all = useMemo(() => index?.apps ?? [], [index]);
  const featured = useMemo(() => {
    const byName = new Map(all.map((app) => [app.username, app]));
    return (index?.featured ?? [])
      .map((name) => byName.get(name))
      .filter((app): app is DirectoryApp => app !== undefined);
  }, [index, all]);

  const query = search.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!query) return all;
    // Matches the handle or the display name, shortest handle first so "eco"
    // puts @ecoin ahead of @ecosystem-tracker.
    return all
      .filter(
        (app) =>
          app.username.includes(query) ||
          (app.name ?? '').toLowerCase().includes(query),
      )
      .sort((a, b) => a.username.length - b.username.length);
  }, [all, query]);

  const visible = matches.slice(0, limit);

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
              <AppCard key={app.username} app={app} />
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
          {!isLoading && !isError && !index?.building && (
            <span className={mutedXs}>
              {t('apps.count', { count: matches.length })}
            </span>
          )}
        </div>

        {isLoading ? (
          <p className={muted}>{t('apps.loading')}</p>
        ) : isError ? (
          // NOT the empty state. "There are no apps" is a very different claim
          // from "we could not reach the directory", and with no fallback left
          // this is the only place that distinction gets made.
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
        ) : index?.building ? (
          // A real state, not an error and not emptiness: the directory is
          // built from apps that have signed people in through Hivesigner, so a
          // freshly deployed API has nothing to show until some have.
          <p className={muted}>{t('apps.building')}</p>
        ) : matches.length === 0 ? (
          <p className={`${muted} break-all [unicode-bidi:isolate]`}>
            {t('apps.empty_search', { search })}
          </p>
        ) : (
          <>
            <div className={cardGrid}>
              {visible.map((app) => (
                <AppCard key={app.username} app={app} />
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
