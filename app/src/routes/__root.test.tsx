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
vi.mock('@tanstack/react-router', () => ({
  createRootRoute: (opts: unknown) => opts,
  Outlet: () => <div data-testid="outlet" />,
  Link: ({ children, to }: { children: unknown; to: string }) => (
    <a href={to}>{children as never}</a>
  ),
}));

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
    for (const label of [/apps/i, /accounts/i, /signer/i, /about/i, /docs/i]) {
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

  it('renders exactly one nav landmark, not a mobile and desktop duplicate', () => {
    render(<RootLayout />);
    expect(screen.getAllByRole('navigation')).toHaveLength(1);
  });
});
