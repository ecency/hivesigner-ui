import { useTranslation } from 'react-i18next';
import type { Theme } from '@/lib/theme';
import { useTheme } from '@/lib/use-theme';

// Header control: ONE button that cycles system -> light -> dark -> system.
// The header has to hold the brand and the domain cue on a 320px phone, so a
// three-way segmented control does not fit there. Settings carries the explicit
// three-way choice for anyone who wants to see all the options at once.
const NEXT: Record<Theme, Theme> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};

/**
 * The icon for a theme VALUE, not for how the page currently looks. `system`
 * gets a monitor rather than the resolved mode: "follows your device" is a
 * different state from "light" even when the two look the same right now, and
 * the settings list has to draw all three at once.
 */
export function ThemeIcon({ theme }: { theme: Theme }) {
  if (theme === 'system') {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="3"
          y="4"
          width="18"
          height="12"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M8 20h8M12 16v4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (theme === 'dark') {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M20 14.5A8.2 8.2 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const next = NEXT[theme];

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      // The accessible name says what pressing it DOES, and the visible state
      // is announced too, so a screen reader user is not left guessing which of
      // the three the icon means.
      aria-label={`${t(`theme.${theme}`)}. ${t('theme.switch_to', {
        theme: t(`theme.${next}`),
      })}`}
      title={t('theme.switch_to', { theme: t(`theme.${next}`) })}
      className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-line bg-surface text-muted hover:bg-subtle hover:text-ink"
    >
      <ThemeIcon theme={theme} />
    </button>
  );
}
