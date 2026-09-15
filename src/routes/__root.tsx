import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Trans } from 'react-i18next';
import { AppHeader } from '@/components/AppHeader';
import { AppNav } from '@/components/AppNav';
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
      <AppHeader />
      {/* ONE nav, in its own bar, visible at EVERY width. It was previously
          wrapped in `sm:hidden` with no desktop counterpart, so the navigation
          disappeared at 640px and above. One instance also avoids a duplicate
          <nav> landmark. */}
      <div className="border-b border-line bg-surface">
        <div className={gutter}>
          <AppNav />
        </div>
      </div>
      <main className="flex-1">
        <div className={gutter}>
          <Outlet />
        </div>
      </main>
      <footer className="mt-8 border-t border-line">
        <div className={`${gutter} py-5 text-center text-[12.5px] text-muted`}>
          {/* ONE key for the whole sentence: split into "Built with", "by the"
              and "team" it would be untranslatable, because word order moves. */}
          <Trans
            i18nKey="footer.built_by"
            components={{
              heart: <span className="text-brand" aria-hidden="true" />,
              link: (
                // The text here is a fallback only: Trans replaces the children
                // with whatever the translation puts between <link> and </link>.
                <a
                  href="https://ecency.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-brand-ink"
                >
                  Ecency
                </a>
              ),
            }}
          />
        </div>
      </footer>
    </div>
  );
}
