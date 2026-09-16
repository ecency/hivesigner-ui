import { createRootRoute, Outlet } from '@tanstack/react-router';
import { AppFooter } from '@/components/AppFooter';
import { AppHeader } from '@/components/AppHeader';
import { gutter } from '@/components/ui';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
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
