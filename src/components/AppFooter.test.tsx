import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '../i18n';

vi.mock('@tanstack/react-router', async () =>
  (await import('../test-router-mock')).routerMock(),
);

import { AppFooter } from './AppFooter';

describe('AppFooter', () => {
  it('links every destination that is not a section of the app', () => {
    render(<AppFooter />);
    const hrefs = screen
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'));
    for (const to of [
      '/apps',
      '/accounts',
      '/signs',
      '/authorized-apps',
      '/signmessage',
      '/verifymessage',
      '/developers',
      '/settings',
      '/about',
      'https://docs.hivesigner.com/',
      'https://github.com/ecency/hivesigner-ui',
    ]) {
      expect(hrefs, `missing ${to}`).toContain(to);
    }
  });

  it('opens external links safely', () => {
    render(<AppFooter />);
    for (const a of screen.getAllByRole('link')) {
      if (a.getAttribute('href')?.startsWith('http')) {
        expect(a).toHaveAttribute('target', '_blank');
        expect(a.getAttribute('rel')).toContain('noopener');
      }
    }
  });

  it('credits Ecency in a readable sentence and is not a nav landmark', () => {
    render(<AppFooter />);
    expect(screen.getByText(/built with/i).textContent).toMatch(
      /Built with ♥ by the Ecency team/,
    );
    expect(screen.getByText('Ecency').closest('a')).toHaveAttribute(
      'href',
      'https://ecency.com',
    );
    expect(screen.queryByRole('navigation')).toBeNull();
  });
});
