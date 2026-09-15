import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '@/components/ThemeToggle';
import { gutter } from '@/components/ui';

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

// Brand bar shared by every screen.
export function AppHeader() {
  const { t } = useTranslation();
  const host = currentHost();

  return (
    <header className="border-b border-line bg-surface">
      {/* `flex-wrap` and `min-w-0` on BOTH sides: the hostname is now whatever
          host the page is served from, not a fixed 14 characters, and the
          right-hand group used to be `shrink-0`, so a long host pushed the
          brand to nothing and then overflowed the bar. */}
      <div
        className={`${gutter} flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3`}
      >
        <Link
          to="/"
          className="flex min-w-0 items-center gap-2 text-ink no-underline"
          aria-label={t('index.title')}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            className="shrink-0"
            aria-hidden="true"
          >
            <path
              d="M12 2 4 5v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V5l-8-3Z"
              fill="#E31337"
            />
            <path
              d="m9 12 2 2 4-4"
              stroke="#fff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="truncate text-base font-bold">Hivesigner</span>
        </Link>

        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {host && (
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
              <span className="font-mono break-all [unicode-bidi:isolate]">
                {host}
              </span>
            </div>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
