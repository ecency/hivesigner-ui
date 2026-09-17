import { Link, useRouterState } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { AppNav } from '@/components/AppNav';
import { Brand } from '@/components/Brand';
import { ThemeToggle } from '@/components/ThemeToggle';
import { gutter } from '@/components/ui';
import { useAccounts } from '@/lib/use-accounts';

/**
 * The host this page is actually served from.
 *
 * NOT a constant. The lock and domain are an anti-phishing affordance: they
 * exist so a user can tell the real site from a lookalike. Printing a fixed
 * "hivesigner.com" made the cue lie on every other deployment (staging showed
 * it too), which is worse than showing nothing, because it is exactly the
 * reassurance a lookalike would forge.
 */
function currentHost(): string {
  try {
    return window.location.hostname || '';
  } catch {
    return '';
  }
}

/**
 * ONE bar: brand, navigation, the host cue, the theme switch and a call to
 * action. It used to be two stacked bars (brand, then nav), which read as
 * chrome on top of chrome and cost 41px of every phone screen.
 *
 * Layout by wrapping, not by duplicating: the nav is a single element that
 * sits inline beside the brand from `lg` up and wraps onto its own full-width
 * row below that. One <nav> landmark at every width, never hidden.
 */
export function AppHeader() {
  const { t } = useTranslation();
  const host = currentHost();
  const { usernames } = useAccounts();
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  // The hero already carries the primary action on the landing page, so the
  // header does not repeat it there. Elsewhere it is the one persistent way to
  // "start": key import for a newcomer, the account list for a returning user.
  const showCta = pathname !== '/';
  const ctaTo = usernames.length > 0 ? '/accounts' : '/import';

  return (
    <header className="border-b border-line bg-surface">
      {/* Three children in ONE wrapping row. On a phone or tablet the nav
          takes `basis-full` + `order-last`, so it wraps under the brand and the
          controls as a full-width row; from `lg` it sits between them. Every
          element renders exactly once, so there is one nav landmark and one
          theme button in the DOM at every width. */}
      <div
        className={`${gutter} flex flex-wrap items-center gap-x-4 lg:gap-x-8`}
      >
        <div className="flex min-w-0 flex-col gap-0.5 py-2.5 lg:py-3">
          <Brand />
          {/* On a phone or tablet the host cue sits UNDER the brand. Beside it,
              a long hostname (staging.hivesigner.com) did not fit next to the
              theme button at 320px, wrapped, and the header grew a third row.
              Rendered again in the desktop group below; this one is hidden
              from lg, that one until lg, so exactly one is ever visible. */}
          <div className="lg:hidden">
            <HostCue host={host} />
          </div>
        </div>

        {/* `min-w-0` at EVERY width, not only from lg. A flex item defaults to
            `min-width: auto`, and although the nav inside is a scroll container,
            its content still counts toward this wrapper's min-content size - so
            without it the wrapper refused to shrink below the row of links and
            the whole page scrolled sideways by the difference at 320px. */}
        <div className="order-last -mt-px min-w-0 basis-full border-t border-line lg:order-none lg:mt-0 lg:flex-1 lg:basis-auto lg:border-0">
          <AppNav />
        </div>

        <div className="ms-auto flex min-w-0 items-center gap-2 py-2.5 lg:ms-0 lg:gap-3 lg:py-3">
          <div className="hidden lg:block">
            <HostCue host={host} />
          </div>
          <ThemeToggle />
          {showCta && (
            // The hero carries the primary action on a phone, and the bar has
            // no room for it beside the host cue at 320px, so it appears from
            // `sm`. Not an ancestor of the nav: hiding it is fine.
            <Link
              to={ctaTo}
              className="hidden h-9 shrink-0 items-center justify-center rounded-lg bg-brand px-3.5 text-[13px] font-semibold text-white no-underline transition-colors hover:bg-brand-hover sm:inline-flex"
            >
              {t('index.get_started')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function HostCue({ host }: { host: string }) {
  if (!host) return null;
  return (
    <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted">
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        className="shrink-0"
        aria-hidden="true"
      >
        <rect
          x="5"
          y="11"
          width="14"
          height="9"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M8 11V8a4 4 0 0 1 8 0v3"
          stroke="currentColor"
          strokeWidth="1.7"
        />
      </svg>
      {/* NOT truncated: `truncate` cuts the END of the string, which is
          exactly the registrable domain a user needs to read -
          "hivesigner.com.attacker..." would render as "hivesigner.com…".
          A long host wraps instead, so the cue is always shown in full.
          isolate: a hostname is attacker-influenced text in the very
          case this cue exists for, and a bidi override inside it could
          otherwise reorder the bar around it. */}
      <span
        className="font-mono break-all [unicode-bidi:isolate]"
        translate="no"
      >
        {host}
      </span>
    </div>
  );
}
