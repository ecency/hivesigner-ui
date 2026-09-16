import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
import { ConsentPreview } from '@/components/ConsentPreview';
import {
  btnPrimary,
  btnSecondary,
  card,
  cardTight,
  h2,
  muted,
  mutedXs,
} from '@/components/ui';
import { fetchAppDirectory } from '@/lib/app-directory';
import { appDirectoryKey } from '@/lib/query-keys';
import { useAccounts } from '@/lib/use-accounts';

export const Route = createFileRoute('/')({
  component: Home,
});

// The landing page answers three questions for a first-time visitor: what
// Hivesigner does, where the keys live, and who already uses it - and SHOWS
// the thing it is describing, a permission request, rather than only talking
// about it. Every section stacks on a phone and spreads out from `sm`/`lg`.
//
// Each promise is made ONCE. An earlier version said "keys stay on your
// device / review what you sign / posting only" three times over (a row of
// chips under the hero, three cards, then the trust strip) and the page read
// as padding. The lede states them, the illustration shows them and the
// trust strip at the foot restates them in four words each. Nothing between.

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

const ShieldIcon = (
  <svg {...iconProps} aria-hidden="true">
    <path d="M12 3 4 6v5.5c0 4.6 3.2 7.6 8 8.5 4.8-.9 8-3.9 8-8.5V6l-8-3Z" />
  </svg>
);
const CodeIcon = (
  <svg {...iconProps} width={26} height={26} aria-hidden="true">
    <path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />
  </svg>
);
const LaptopIcon = (
  <svg {...iconProps} aria-hidden="true">
    <rect x="3" y="5" width="18" height="12" rx="2" />
    <path d="M2 19h20" />
  </svg>
);
const GitIcon = (
  <svg {...iconProps} aria-hidden="true">
    <circle cx="6" cy="6" r="2.5" />
    <circle cx="6" cy="18" r="2.5" />
    <circle cx="18" cy="8" r="2.5" />
    <path d="M6 8.5v7M18 10.5c0 3-3 4-6 4.5-2 .3-4 1-5.5 2" />
  </svg>
);
const DocIcon = (
  <svg {...iconProps} aria-hidden="true">
    <path d="M7 3h7l5 5v13H7V3Z" />
    <path d="M14 3v5h5M10 13h6M10 17h6" />
  </svg>
);

/** A trust-strip item: icon, title, one-line body. */
function TrustItem({
  title,
  body,
  icon,
  href,
}: {
  title: string;
  body: string;
  icon: React.ReactNode;
  href?: string;
}) {
  const inner = (
    <>
      <span className="mt-0.5 shrink-0 text-ink">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold text-ink">
          {title}
        </span>
        <span className={`${mutedXs} block`}>{body}</span>
      </span>
    </>
  );
  const cls = 'flex items-start gap-3 no-underline';
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

function Home() {
  const { t } = useTranslation();
  const { usernames } = useAccounts();
  // The primary action should START something: a first-time visitor goes to
  // key import, a returning one to their accounts.
  const hasAccounts = usernames.length > 0;
  const primaryTo = hasAccounts ? '/accounts' : '/import';

  // The SAME query as /apps, with no per-route variation. An earlier version
  // passed an option here that made this route fetch a deliberately incomplete
  // answer and then cache it under the shared key, so clicking through to /apps
  // showed an empty directory for ten minutes. One key, one answer.
  const { data: index } = useQuery({
    queryKey: appDirectoryKey(),
    queryFn: () => fetchAppDirectory(),
    staleTime: 10 * 60_000,
  });
  const featured = index?.featured ?? [];

  return (
    <div className="flex flex-col gap-8 py-6 sm:gap-10 sm:py-10">
      {/* HERO. Copy left, the illustration right from `lg`; stacked below. The
          decorative glow is clipped by the section so it can never widen the
          page: a 320px phone must not scroll sideways because of a gradient. */}
      {/* `-mx-2 px-2`: the clip edge sits 8px OUTSIDE the text, because a bold
          glyph can draw a pixel or two left of its origin and the first letter
          of the eyebrow was losing exactly that to `overflow-hidden`. */}
      <section className="relative isolate -mx-2 overflow-hidden rounded-2xl px-2">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 -z-10 h-[420px] w-[420px] rounded-full bg-brand/15 blur-3xl"
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 120 120"
          className="pointer-events-none absolute top-6 right-2 -z-10 h-[260px] w-[260px] text-brand/10 lg:right-[38%]"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
        >
          <path d="M60 6 106 33v54L60 114 14 87V33L60 6Z" />
          <path d="M60 34 82 47v26L60 86 38 73V47l22-13Z" />
        </svg>

        <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
          <div className="flex flex-col gap-5">
            <div className="text-[11.5px] font-semibold tracking-[0.18em] text-muted uppercase">
              {t('index.eyebrow')}
            </div>
            <h1 className="m-0 text-[32px] leading-[1.08] font-bold tracking-tight sm:text-[44px] lg:text-[52px]">
              {t('index.hero_title')}
              <br />
              <span className="text-brand-ink">
                {t('index.hero_title_accent')}
              </span>
            </h1>
            <p
              className={`${muted} max-w-xl text-[16px] leading-[1.6] sm:text-[17px]`}
            >
              {t('index.lede')}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to={primaryTo} className={btnPrimary}>
                {hasAccounts ? t('index.your_accounts') : t('index.set_up')}
                <svg
                  {...iconProps}
                  width={16}
                  height={16}
                  className="ml-2"
                  aria-hidden="true"
                >
                  <path d="M5 12h14m-6-6 6 6-6 6" />
                </svg>
              </Link>
              <Link to="/apps" className={btnSecondary}>
                {t('index.browse_apps')}
              </Link>
            </div>
          </div>

          <div className="w-full max-w-md lg:ml-auto lg:max-w-none">
            <ConsentPreview />
          </div>
        </div>
      </section>

      {/* WHO ALREADY USES IT. Nothing renders while the list is loading or if
          the directory is unreachable, rather than an empty box with a heading
          over it. */}
      {featured.length > 0 && (
        <section className="flex flex-col gap-3">
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
            {featured.map((username) => (
              <Link
                key={username}
                to="/authorize/$username"
                params={{ username }}
                className={`${cardTight} flex items-center gap-2 py-2 text-[13px] font-semibold text-ink no-underline hover:border-line-strong`}
              >
                <Avatar username={username} size="sm" />
                <span className="[unicode-bidi:isolate]">@{username}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FOR DEVELOPERS. */}
      <section
        className={`${card} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6`}
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
          {CodeIcon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[11.5px] font-semibold tracking-[0.18em] text-muted uppercase">
            {t('index.dev_eyebrow')}
          </div>
          <h2 className="m-0 mt-1 text-[20px] font-bold sm:text-[22px]">
            {t('index.dev_title')}
          </h2>
          <p className={`${muted} mt-1 leading-[1.55]`}>
            {t('index.dev_body')}
          </p>
        </div>
        <Link
          to="/developers"
          className={`${btnSecondary} h-11 shrink-0 text-[14px]`}
        >
          {t('index.dev_cta')}
        </Link>
      </section>

      {/* TRUST STRIP. Two across on a phone, four on a desktop. */}
      <section className="grid grid-cols-1 gap-5 border-t border-line pt-7 sm:grid-cols-2 lg:grid-cols-4">
        <TrustItem
          title={t('index.trust_local_title')}
          body={t('index.trust_local_body')}
          icon={LaptopIcon}
        />
        <TrustItem
          title={t('index.trust_open_title')}
          body={t('index.trust_open_body')}
          icon={GitIcon}
          href="https://github.com/ecency/hivesigner-ui"
        />
        <TrustItem
          title={t('index.trust_scope_title')}
          body={t('index.trust_scope_body')}
          icon={ShieldIcon}
        />
        <TrustItem
          title={t('index.trust_preview_title')}
          body={t('index.trust_preview_body')}
          icon={DocIcon}
        />
      </section>
    </div>
  );
}
