import { createRootRoute, Outlet } from '@tanstack/react-router';
import { AppHeader } from '@/components/AppHeader';
import { AppNav } from '@/components/AppNav';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    // The shell was a hard 480px column, which is right on a phone and leaves a
    // desktop showing a narrow strip. It now widens with the viewport: phone
    // column, roomier on tablets, capped so text lines stay readable on a wide
    // monitor rather than stretching edge to edge.
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-[#f6f8fa] sm:max-w-2xl lg:max-w-4xl">
      <AppHeader />
      {/* ONE nav, in its own bar, visible at EVERY width. It was previously
          wrapped in `sm:hidden` with no desktop counterpart, so the navigation
          this component exists to restore disappeared at 640px and above - the
          exact regression it was meant to fix. One instance also avoids a
          duplicate <nav> landmark. */}
      <div className="border-b border-[#d1d9e0] bg-white">
        <AppNav />
      </div>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-[#d1d9e0] px-5 py-4 text-center text-[12.5px] text-[#59636e]">
        Built with <span className="text-[#E31337]">♥</span> by the{' '}
        <a
          href="https://ecency.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[#b90f2e]"
        >
          Ecency
        </a>{' '}
        team
      </footer>
    </div>
  );
}
