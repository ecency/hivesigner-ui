import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
import {
  btnPrimary,
  btnSecondary,
  card,
  cardTight,
  h2,
  muted,
  mutedXs,
  page,
} from '@/components/ui';
import { getTopApps } from '@/lib/hive';
import { useAccounts } from '@/lib/use-accounts';

export const Route = createFileRoute('/')({
  component: Home,
});

// The landing page was a heading, one sentence and a button, which told a
// first-time visitor nothing about what Hivesigner is or why the thing asking
// for their key can be trusted. It now answers three questions: what it does,
// where the keys live, and who already uses it.

function Point({
  title,
  body,
  icon,
}: {
  title: string;
  body: string;
  icon: React.ReactNode;
}) {
  return (
    <div className={`${card} flex flex-col gap-2`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand-ink">
        {icon}
      </div>
      <h3 className="m-0 text-[15px] font-semibold">{title}</h3>
      <p className={`${mutedXs} leading-[1.5]`}>{body}</p>
    </div>
  );
}

const iconProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function Home() {
  const { t } = useTranslation();
  const { usernames } = useAccounts();
  // "Get started" should start something: a first-time visitor goes to key
  // import, a returning one to their accounts.
  const primary = usernames.length > 0 ? '/accounts' : '/import';

  const { data: featured = [] } = useQuery({
    queryKey: ['top-apps'],
    queryFn: getTopApps,
    staleTime: 10 * 60_000,
  });

  return (
    <section className={page}>
      {/* Hero. Capped to a readable measure rather than stretched across the
          full shell on a desktop. */}
      <div className="flex flex-col gap-4 py-2 sm:py-6">
        <h1 className="m-0 max-w-3xl text-[28px] leading-[1.15] font-bold sm:text-4xl">
          {t('index.tagline')}
        </h1>
        <p
          className={`${muted} max-w-2xl text-[15px] leading-[1.6] sm:text-base`}
        >
          {t('index.lede')}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to={primary} className={btnPrimary}>
            {t('index.get_started')}
          </Link>
          <Link to="/apps" className={btnSecondary}>
            {t('index.browse_apps')}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Point
          title={t('index.keys_title')}
          body={t('index.keys_body')}
          icon={
            <svg {...iconProps} aria-hidden="true">
              <rect x="4" y="10" width="16" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          }
        />
        <Point
          title={t('index.review_title')}
          body={t('index.review_body')}
          icon={
            <svg {...iconProps} aria-hidden="true">
              <path d="M4 5h16M4 12h10M4 19h7" />
              <path d="m15 17 2 2 4-4" />
            </svg>
          }
        />
        <Point
          title={t('index.scope_title')}
          body={t('index.scope_body')}
          icon={
            <svg {...iconProps} aria-hidden="true">
              <path d="M12 3 4 6v5.5c0 4.6 3.2 7.6 8 8.5 4.8-.9 8-3.9 8-8.5V6l-8-3Z" />
            </svg>
          }
        />
      </div>

      {/* Who already uses it. Nothing renders while the list is loading or if
          the RPC fails, rather than an empty box with a heading over it. */}
      {featured.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className={h2}>{t('index.powering')}</h2>
            <Link
              to="/apps"
              className="text-[13px] font-semibold text-brand-ink"
            >
              {t('index.see_all_apps')}
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {featured.map((app) => (
              <Link
                key={app}
                to="/authorize/$username"
                params={{ username: app }}
                className={`${cardTight} flex items-center gap-2 py-2 text-[13px] font-semibold text-ink no-underline hover:border-line-strong`}
              >
                <Avatar username={app} size="sm" />
                <span className="[unicode-bidi:isolate]">@{app}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div
        className={`${cardTight} flex flex-wrap items-center justify-between gap-3`}
      >
        <span className={mutedXs}>{t('index.developers_cta')}</span>
        <Link
          to="/developers"
          className="text-[13px] font-semibold text-brand-ink"
        >
          {t('footer.developers')}
        </Link>
      </div>

      {/* NOT a <nav>: AppNav in the shell is the navigation landmark, and a
          second one here made the landing page report two. */}
      <div className="flex flex-wrap gap-3.5 text-[13.5px]">
        <Link to="/signmessage">{t('footer.sign_message')}</Link>
        <Link to="/verifymessage">{t('footer.verify_message')}</Link>
      </div>
    </section>
  );
}
