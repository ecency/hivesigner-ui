import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

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
}));

import { AppHeader } from './AppHeader';

describe('AppHeader', () => {
  it('shows the brand', () => {
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
    expect(screen.getByText(window.location.hostname)).toBeInTheDocument();
    expect(screen.queryByText('hivesigner.com')).not.toBeInTheDocument();
  });

  it('offers the theme switch', () => {
    render(<AppHeader />);
    expect(
      screen.getByRole('button', { name: /light|dark|device/i }),
    ).toBeInTheDocument();
  });
});
