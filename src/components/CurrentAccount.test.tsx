import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';

vi.mock('@tanstack/react-router', async () =>
  (await import('../test-router-mock')).routerMock(),
);

import {
  _resetKeyCache,
  addAccount,
  getState,
  selectAccount,
} from '@/lib/accounts';
import { CurrentAccount } from './CurrentAccount';

describe('CurrentAccount', () => {
  beforeEach(async () => {
    localStorage.clear();
    _resetKeyCache();
    await addAccount('stid', { posting: '5Ks' });
    await addAccount('bob', { active: '5Kbob' }, 'pass');
    await addAccount('alice', { posting: '5Ka' });
    selectAccount('stid');
  });

  const toggle = () =>
    screen.getByRole('button', { name: i18n.t('login.switch_an_account') });

  it('shows the avatar, the name and a switch that stays on this screen', () => {
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
    // A disclosure, not a link away (#146).
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: /switch/i })).toBeNull();
    expect(screen.queryAllByTestId('account-row')).toHaveLength(0);
  });

  it('opens the accounts here, and picking one switches in place', async () => {
    const user = userEvent.setup();
    render(
      <CurrentAccount
        username="stid"
        label="Authorizing as"
        next="/oauth2/authorize?client_id=ecency.app"
      />,
    );
    await user.click(toggle());
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
    const rows = screen.getAllByTestId('account-row');
    expect(rows.map((r) => r.querySelector('bdi')?.textContent)).toEqual([
      '@alice',
      '@bob',
      '@stid',
    ]);
    // Opened by the user: focus moves into the list.
    expect(document.activeElement).toBe(within(rows[0]).getByRole('button'));
    // Adding one that is not on the device comes back to this request.
    const add = screen.getByRole('link', { name: /add another/i });
    expect(add).toHaveAttribute('href', '/import');
    expect(JSON.parse(add.getAttribute('data-search') ?? '{}')).toEqual({
      next: '/oauth2/authorize?client_id=ecency.app',
    });
    // A locked account is picked like any other; the screen asks for its
    // passcode in place.
    await user.click(within(rows[1]).getByRole('button'));
    expect(getState().selectedAccount).toBe('bob');
    expect(screen.queryAllByTestId('account-row')).toHaveLength(0);
    expect(document.activeElement).toBe(toggle());
  });

  it('can start open, without taking the focus', () => {
    render(
      <CurrentAccount
        username="stid"
        label="Selected"
        next="/sign/x"
        defaultOpen
      />,
    );
    expect(screen.getAllByTestId('account-row')).toHaveLength(3);
    expect(document.activeElement).toBe(document.body);
  });

  it('drops the switch while the screen is busy, but keeps naming the account', async () => {
    const user = userEvent.setup();
    const view = render(
      <CurrentAccount username="stid" label="Signing as" next="/sign/x" />,
    );
    await user.click(toggle());
    view.rerender(
      <CurrentAccount username="stid" label="Signing as" next="/sign/x" busy />,
    );
    expect(screen.getByTestId('current-account')).toHaveTextContent('@stid');
    expect(screen.queryByRole('button', { name: /switch/i })).toBeNull();
    expect(screen.queryAllByTestId('account-row')).toHaveLength(0);
  });

  it('opens again after a pick that still cannot do what the screen asks', async () => {
    const user = userEvent.setup();
    const view = render(
      <CurrentAccount username="stid" label="Selected" next="/x" defaultOpen />,
    );
    const pick = (name: string) =>
      user.click(screen.getByRole('button', { name: new RegExp(`^@${name}`) }));
    await pick('bob');
    // The screen re-renders for bob, who cannot sign it either.
    view.rerender(
      <CurrentAccount username="bob" label="Selected" next="/x" defaultOpen />,
    );
    expect(screen.getAllByTestId('account-row')).toHaveLength(3);
    // alice can: the screen stops asking, and the list stays closed.
    await pick('alice');
    view.rerender(
      <CurrentAccount username="alice" label="Signing as" next="/x" />,
    );
    expect(screen.queryAllByTestId('account-row')).toHaveLength(0);
  });

  it('a list left open when the screen goes busy stays closed after it', async () => {
    const user = userEvent.setup();
    const view = render(
      <CurrentAccount username="stid" label="Authorizing as" next="/x" />,
    );
    await user.click(toggle());
    view.rerender(
      <CurrentAccount username="stid" label="Authorizing as" next="/x" busy />,
    );
    // The action failed: the screen is not busy any more, and the failure is
    // what the user should read, not the list again.
    view.rerender(
      <CurrentAccount username="stid" label="Authorizing as" next="/x" />,
    );
    expect(screen.queryAllByTestId('account-row')).toHaveLength(0);
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
  });

  it('wraps a long name rather than cutting off the part that tells accounts apart', () => {
    render(
      <CurrentAccount
        username="abcdefghijklmnop"
        label="Signing as"
        next="/sign/x"
      />,
    );
    // The text sits in a <bdi> for its direction; the block around it wraps.
    const name = screen.getByText('@abcdefghijklmnop').parentElement;
    expect(name?.className).toContain('break-all');
    expect(name?.className).not.toContain('truncate');
  });

  it('still names the account when the name cannot have an avatar', () => {
    render(<CurrentAccount username="x" label="Signing as" next="/sign/x" />);
    const chip = screen.getByTestId('current-account');
    expect(chip.querySelector('img')).toBeNull();
    expect(chip).toHaveTextContent('@x');
  });
});
