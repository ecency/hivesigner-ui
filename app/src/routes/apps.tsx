import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
    <section
      style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
        {t('apps.store')}
      </h1>

      <input
        aria-label={t('apps.search_placeholder')}
        placeholder={t('apps.search_placeholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          height: 44,
          padding: '0 12px',
          border: '1px solid #d1d9e0',
          borderRadius: 8,
          fontSize: 15,
        }}
      />

      {isLoading ? (
        <p style={{ fontSize: 14, color: '#59636e' }}>…</p>
      ) : filtered.length === 0 ? (
        <p style={{ fontSize: 14, color: '#59636e' }}>
          {search ? t('apps.empty_search', { search }) : t('apps.apps')}
        </p>
      ) : (
        <div
          style={{
            background: '#fff',
            border: '1px solid #d1d9e0',
            borderRadius: 12,
            padding: 4,
          }}
        >
          {filtered.map((app, i) => (
            <Link
              key={app}
              to="/authorize/$username"
              params={{ username: app }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 14,
                borderTop: i === 0 ? 'none' : '1px solid #eef1f4',
                textDecoration: 'none',
                color: '#1f2328',
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: '#ffe3e8',
                  color: '#b90f2e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {app[0]}
              </div>
              <span style={{ fontWeight: 600, fontSize: 15 }}>@{app}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
