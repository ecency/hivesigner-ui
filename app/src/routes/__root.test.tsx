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

/** Every responsive `hidden` utility that could remove an element at a width. */
const HIDES_AT_BREAKPOINT = /(?:^|\s)(?:sm|md|lg|xl|2xl):hidden(?:\s|$)/;

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
        HIDES_AT_BREAKPOINT.test(cls),
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
