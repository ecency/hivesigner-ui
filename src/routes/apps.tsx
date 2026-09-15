import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cardGrid, cardTight, field, h1, muted, page } from '@/components/ui';
import { getTopApps } from '@/lib/hive';

// A lightweight directory of apps that integrate Hivesigner (the curated
// @hivesigner/top-apps list). Each links to its authorize screen.
export const Route = createFileRoute('/apps')({
  component: Apps,
});

function Apps() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const { data: apps = [], isLoading } = useQuery({
    queryKey: ['top-apps'],
    queryFn: getTopApps,
    staleTime: 5 * 60_000,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? apps.filter((a) => a.toLowerCase().includes(q)) : apps;
  }, [apps, search]);

  return (
    <section className={page}>
      <h1 className={h1}>{t('apps.store')}</h1>

      {/* Full width on a phone, but capped from `sm` up: the shell is wider now
          and a search box stretched to the full width reads badly. Only the
          results below it use the extra room. */}
      <input
        aria-label={t('apps.search_placeholder')}
        placeholder={t('apps.search_placeholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={`${field} sm:max-w-md`}
      />

      {isLoading ? (
        <p className={muted}>…</p>
      ) : filtered.length === 0 ? (
        <p className={muted}>
          {search ? t('apps.empty_search', { search }) : t('apps.apps')}
        </p>
      ) : (
        // The directory was a single panel of stacked rows, which on a desktop
        // left most of the width empty. One card per app instead: a column on a
        // phone, two from `sm` and three from `lg`.
        <div className={cardGrid}>
          {filtered.map((app) => (
            <Link
              key={app}
              to="/authorize/$username"
              params={{ username: app }}
              className={`${cardTight} flex items-center gap-3 text-ink no-underline`}
            >
              <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-brand-soft font-bold uppercase text-brand-ink">
                {app[0]}
              </div>
              {/* Account names come off-chain from the curated list: break them
                  rather than let one overflow the card at 320px. */}
              <span className="break-all text-[15px] font-semibold">
                @{app}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
