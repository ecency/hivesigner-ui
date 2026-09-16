import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '../i18n';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: unknown; to: string }) => (
    <a href={to}>{children as never}</a>
  ),
}));

import { ConsentPreview } from './ConsentPreview';

// The landing page SHOWS a permission request. Two things keep that honest:
// it is a picture (no control a visitor could mistake for the real thing),
// and the abilities it lists are framed as consequences of ONE grant, because
// Hive has one posting authority and Hivesigner has two scopes, nothing finer.
describe('ConsentPreview', () => {
  it('is a picture: the card is aria-hidden and contains no control', () => {
    const { container } = render(<ConsentPreview />);
    const card = container.querySelector('[aria-hidden="true"]');
    expect(card).not.toBeNull();
    expect(card?.querySelectorAll('button, a, input, select')).toHaveLength(0);
    // The visible "Authorize" is therefore not a button.
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('frames the abilities as one posting-authority grant, titles only', () => {
    render(<ConsentPreview />);
    expect(
      screen.getByText(/with your posting authority/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/post and comment/i)).toBeInTheDocument();
    // The explanations and the one-grant footnote are on the real consent
    // screen (AuthorizeConsent.test pins them there); the picture shows only
    // the shape of a request.
    expect(screen.queryByText(/publish posts and comments/i)).toBeNull();
    expect(screen.queryByText(/one posting-authority grant/i)).toBeNull();
  });

  it('shows a placeholder account, never a real one', () => {
    render(<ConsentPreview />);
    expect(screen.getByText('@your-account')).toBeInTheDocument();
  });

  it('links revocation to where it actually lives', () => {
    render(<ConsentPreview />);
    expect(screen.getByRole('link', { name: /revoke/i })).toHaveAttribute(
      'href',
      '/authorized-apps',
    );
  });
});
