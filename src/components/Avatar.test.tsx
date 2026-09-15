import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar, avatarUrl } from './Avatar';

describe('avatarUrl', () => {
  it('builds a proxy URL for a real account name', () => {
    expect(avatarUrl('ecency.app')).toBe(
      'https://i.ecency.com/u/ecency.app/avatar/small',
    );
    expect(avatarUrl('ecency.app', 'lg')).toBe(
      'https://i.ecency.com/u/ecency.app/avatar/medium',
    );
  });

  // Account names reach this from the chain and from URL path params. A name
  // that is not a Hive name is refused rather than escaped: there is no account
  // to show, and building a URL out of it is how a path escape gets in.
  it('refuses anything that is not a Hive account name', () => {
    for (const bad of [
      '../../etc/passwd',
      'UPPER',
      'a',
      '',
      'has space',
      'x'.repeat(40),
      'ecency.app/../other',
      '.leading-dot',
    ]) {
      expect(avatarUrl(bad), bad).toBeNull();
    }
  });

  it('only ever points at the host the CSP allows', () => {
    // nginx.conf pins img-src to this origin; another host would be blocked in
    // the browser with nothing in the UI to explain the missing picture.
    expect(avatarUrl('ecency.app')).toMatch(/^https:\/\/i\.ecency\.com\//);
  });
});

describe('Avatar', () => {
  it('renders the image for a valid account', () => {
    const { container } = render(<Avatar username="ecency.app" />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', avatarUrl('ecency.app'));
    // Decorative: the account name is always rendered as text beside it, so an
    // alt would make a screen reader announce the name twice.
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('falls back to the initial when the name cannot have an avatar', () => {
    render(<Avatar username="NOT A NAME" />);
    expect(screen.getByText('N')).toBeInTheDocument();
  });

  // i.ecency.com 404s for an account that never uploaded a picture. Leaving the
  // <img> in place would show a broken-image icon next to a username on a
  // signing screen, which reads as something being wrong with the account.
  it('falls back to the initial when the image fails to load', () => {
    const { container } = render(<Avatar username="ecency.app" />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    if (img) fireEvent.error(img);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('e')).toBeInTheDocument();
  });
});
