import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '../i18n';

// The current route, mutable per test: the header hides its call to action on
// the landing page, where the hero already carries one.
const router = vi.hoisted(() => ({ pathname: '/about' }));

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    ...rest
  }: {
    children: unknown;
    to: string;
  } & Record<string, unknown>) => (
    <a href={to} {...rest}>
      {children as never}
    </a>
  ),
  useRouterState: ({ select }: { select: (s: unknown) => unknown }) =>
    select({ location: { pathname: router.pathname } }),
}));

import { AppHeader } from './AppHeader';

describe('AppHeader', () => {
  it('shows the brand', () => {
    router.pathname = '/about';
    render(<AppHeader />);
    expect(screen.getByText('Hivesigner')).toBeInTheDocument();
  });

  // The lock and domain exist so a user can tell the real site from a
  // lookalike. It used to print a hardcoded "hivesigner.com", which meant the
  // cue was wrong on staging and on any other deployment - and a cue that
  // claims the wrong origin is worse than no cue, because forging exactly that
  // reassurance is what a phishing clone does. It must report the host the page
  // is actually served from.
  it('shows the host the page is really served from, not a constant', () => {
    render(<AppHeader />);
    // Rendered twice on purpose (one placement per layout, the other hidden
    // by CSS), so "at least one" is the assertion, not "exactly one".
    expect(
      screen.getAllByText(window.location.hostname).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText('hivesigner.com')).not.toBeInTheDocument();
  });

  it('offers the theme switch, exactly once', () => {
    render(<AppHeader />);
    expect(
      screen.getAllByRole('button', { name: /light|dark|device/i }),
    ).toHaveLength(1);
  });

  // ONE bar now holds the navigation too. The nav must be present here at
  // every width; the root layout test checks it is never hidden by a
  // breakpoint utility.
  it('contains the navigation', () => {
    render(<AppHeader />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('shows a call to action everywhere except the landing page', () => {
    router.pathname = '/about';
    const { unmount } = render(<AppHeader />);
    expect(screen.getByRole('link', { name: /get started/i })).toHaveAttribute(
      'href',
      '/import',
    );
    unmount();

    router.pathname = '/';
    render(<AppHeader />);
    expect(
      screen.queryByRole('link', { name: /get started/i }),
    ).not.toBeInTheDocument();
  });
});
