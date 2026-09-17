import {
  createRootRoute,
  Outlet,
  useRouterState,
} from '@tanstack/react-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppFooter } from '@/components/AppFooter';
import { AppHeader } from '@/components/AppHeader';
import { gutter } from '@/components/ui';
import { applyPageMeta } from '@/lib/page-meta';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  // Title, description, robots and canonical follow the route. One place, so
  // no screen can forget it; see lib/page-meta.ts for the table.
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // The tab title is in the page's language, and changes with it.
  const { t } = useTranslation();
  useEffect(() => {
    // The define is absent under vitest, which has no build step; the page's
    // own origin is the right answer there and a fine fallback anywhere.
    applyPageMeta(
      pathname,
      typeof __SITE_URL__ === 'string' && __SITE_URL__
        ? __SITE_URL__
        : window.location.origin,
      (key) => t(key),
    );
  }, [pathname, t]);

  return (
    // The bars run the FULL width of the viewport and only their contents are
    // centred. Capping the bars themselves made the whole app read as a narrow
    // card pasted onto a blank page on anything wider than a tablet.
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      {/* Brand, the ONE nav landmark, host cue, theme and call to action, in a
          single bar. See AppHeader for how it wraps rather than duplicating. */}
      <AppHeader />
      <main className="flex-1">
        <div className={gutter}>
          <Outlet />
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
