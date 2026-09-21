import { render, screen } from '@testing-library/react';
import type { ComponentType } from 'react';
import { describe, expect, it, vi } from 'vitest';
import '../i18n';

// The navigation regression this pins: AppNav was rendered ONLY inside a
// `sm:hidden` wrapper with no desktop counterpart, so the persistent navigation
// vanished at 640px and above - the opposite of what it was added to fix. jsdom
// does not apply media queries, so a plain "is it in the DOM" assertion passed
// while desktop was broken. These tests inspect the responsive visibility
// utilities on the nav and its ancestors instead.
const where = vi.hoisted(() => ({
  pathname: '/about',
  settled: undefined as string | undefined,
}));
vi.mock('@tanstack/react-router', () => ({
  createRootRoute: (opts: unknown) => opts,
  Outlet: () => <div data-testid="outlet" />,
  Link: ({ children, to }: { children: unknown; to: string }) => (
    <a href={to}>{children as never}</a>
  ),
  useRouterState: ({ select }: { select: (s: unknown) => unknown }) =>
    select({
      location: { pathname: where.pathname },
      resolvedLocation: { pathname: where.settled ?? where.pathname },
    }),
  useNavigate: () => () => {},
}));

import { _resetShownPage, showDocPage } from '@/docs/shown';
import { Route } from './__root';

const RootLayout = (Route as unknown as { component: ComponentType }).component;

/**
 * Ways a utility class can remove an element at some viewport width. The first
 * version of this test matched only `sm:hidden`, and a review showed it missed
 * `max-sm:hidden` (hidden BELOW the breakpoint), `sm:invisible`, `sm:sr-only`,
 * `sm:h-0 sm:overflow-hidden` and arbitrary-media variants such as
 * `min-[640px]:hidden`. Any of these would reintroduce the same bug invisibly.
 */
const HIDING_UTILITY =
  /(?:^|\s)(?:(?:max-)?(?:sm|md|lg|xl|2xl)|min-\[[^\]]+\]|\[@media[^\]]*\]):(?:hidden|invisible|sr-only|h-0|w-0|opacity-0|scale-0)(?:\s|$)/;

describe('persistent navigation', () => {
  it('renders the nav with the destinations the Nuxt app offered', () => {
    render(<RootLayout />);
    const nav = screen.getByRole('navigation');
    for (const label of [/apps/i, /accounts/i, /signer/i, /docs/i]) {
      expect(
        screen
          .getAllByRole('link')
          .some((a) => label.test(a.textContent ?? '')),
        `missing nav link ${label}`,
      ).toBe(true);
    }
    expect(nav).toBeInTheDocument();
  });

  it('is never hidden at a breakpoint, on the nav or any ancestor', () => {
    render(<RootLayout />);
    let el: HTMLElement | null = screen.getByRole('navigation');
    while (el) {
      const cls = el.className || '';
      expect(
        HIDING_UTILITY.test(cls),
        `navigation is hidden at a breakpoint by "${cls}"`,
      ).toBe(false);
      expect(/(?:^|\s)hidden(?:\s|$)/.test(cls), `hidden by "${cls}"`).toBe(
        false,
      );
      el = el.parentElement;
    }
  });

  it('titles the document for the current route', () => {
    render(<RootLayout />);
    expect(document.title).toBe('About · Hivesigner');
  });

  it('leaves a docs page its own title, canonical and indexing', () => {
    // What the docs page wrote; it runs first, as a child's effect does.
    document.head.innerHTML =
      '<link rel="canonical" href="https://hivesigner.com/docs/tokens">';
    document.title = 'Tokens · Hivesigner';
    where.pathname = '/docs/tokens';
    try {
      render(<RootLayout />);
    } finally {
      where.pathname = '/about';
    }
    expect(document.title).toBe('Tokens · Hivesigner');
    expect(document.querySelector('link[rel="canonical"]')).not.toBeNull();
    expect(document.querySelector('meta[name="robots"]')).toBeNull();
  });

  it('tells the docs when the reader is on a page outside them', () => {
    // A docs page first: the next docs page is the first one shown.
    _resetShownPage();
    where.pathname = '/docs/tokens';
    render(<RootLayout />).unmount();
    expect(showDocPage('/docs/faq')).toBe(false);
    // On the way to another page, before it shows: nothing yet, as the
    // reader may still stay.
    where.pathname = '/about';
    where.settled = '/docs/faq';
    render(<RootLayout />).unmount();
    expect(showDocPage('/docs/faq')).toBe(false);
    // Once it shows, coming back to the docs is a move, to the same page too.
    where.settled = undefined;
    render(<RootLayout />);
    expect(showDocPage('/docs/faq')).toBe(true);
    _resetShownPage();
  });

  it('renders exactly one nav landmark, not a mobile and desktop duplicate', () => {
    render(<RootLayout />);
    expect(screen.getAllByRole('navigation')).toHaveLength(1);
  });
});
