import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '../i18n';

vi.mock('@tanstack/react-router', async () =>
  (await import('../test-router-mock')).routerMock(),
);

import { CurrentAccount } from './CurrentAccount';

describe('CurrentAccount', () => {
  it('shows the avatar, the name and a switch link that returns to the request', () => {
    render(
      <CurrentAccount
        username="stid"
        label="Authorizing as"
        next="/oauth2/authorize?client_id=ecency.app"
      />,
    );
    const chip = screen.getByTestId('current-account');
    expect(chip).toHaveTextContent('Authorizing as');
    expect(chip).toHaveTextContent('@stid');
    expect(chip.querySelector('img')).toHaveAttribute(
      'src',
      'https://i.ecency.com/u/stid/avatar/small',
    );
    const link = screen.getByRole('link', { name: /switch/i });
    expect(link).toHaveAttribute('href', '/accounts');
    expect(JSON.parse(link.getAttribute('data-search') ?? '{}')).toEqual({
      next: '/oauth2/authorize?client_id=ecency.app',
    });
  });

  it('still names the account when the name cannot have an avatar', () => {
    render(<CurrentAccount username="x" label="Signing as" next="/sign/x" />);
    const chip = screen.getByTestId('current-account');
    expect(chip.querySelector('img')).toBeNull();
    expect(chip).toHaveTextContent('@x');
  });
});
