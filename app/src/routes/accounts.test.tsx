import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const rs = vi.hoisted(() => ({ search: {} as { next?: string } }));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: unknown) => ({
    ...(opts as object),
    useSearch: () => rs.search,
  }),
  Link: ({ children }: { children: unknown }) => children,
}));

import {
  _resetKeyCache,
  addAccount,
  getState,
  isUnlocked,
  lockAccount,
  selectAccount,
} from '@/lib/accounts';
import { Route } from './accounts';

const Accounts = (Route as unknown as { component: ComponentType }).component;

beforeEach(() => {
  localStorage.clear();
  _resetKeyCache();
});

describe('accounts switcher', () => {
  it('switches to a plaintext account on click without dropping others', async () => {
    await addAccount('alice', { posting: '5Ka' });
    await addAccount('bob', { posting: '5Kb' });
    // alice was selected (added first); switch to... alice is current, switch bob shown.
    const user = userEvent.setup();
    render(<Accounts />);

    // bob is not current -> has a switch control.
    const bobSwitch = screen.getByRole('button', { name: /switch/i });
    await user.click(bobSwitch);
    expect(getState().selectedAccount).toBe('bob');
    expect(isUnlocked('alice')).toBe(true); // not dropped
  });

  it('asks for a passcode before switching to a locked encrypted account', async () => {
    await addAccount('alice', { posting: '5Ka' });
    await addAccount('bob', { active: '5Kbob' }, 'pass');
    // Lock bob so it must be unlocked, and make alice the current account.
    lockAccount('bob');
    selectAccount('alice');

    const user = userEvent.setup();
    render(<Accounts />);

    // bob shows Unlock, not Switch.
    await user.click(screen.getByRole('button', { name: /^unlock$/i }));
    // A passcode field appears; wrong passcode shows an error.
    const field = document.querySelector('input[type="password"]');
    expect(field).toBeTruthy();
    await user.type(field as HTMLElement, 'wrong');
    await user.click(
      screen.getAllByRole('button', { name: /^unlock$/i }).at(-1)!,
    );
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(getState().selectedAccount).toBe('alice');

    // Right passcode unlocks and switches.
    await user.clear(field as HTMLElement);
    await user.type(field as HTMLElement, 'pass');
    await user.click(
      screen.getAllByRole('button', { name: /^unlock$/i }).at(-1)!,
    );
    await waitFor(() => expect(getState().selectedAccount).toBe('bob'));
    expect(isUnlocked('bob')).toBe(true);
  });
});

describe('returning to the flow that required an unlock', () => {
  const assign = vi.fn();

  beforeEach(() => {
    rs.search = {};
    assign.mockReset();
    vi.stubGlobal('location', { assign, pathname: '/accounts', search: '' });
  });

  /** alice selected, bob present but not in memory (as after a reload). */
  async function twoAccounts() {
    await addAccount('alice', { posting: '5Ka' });
    await addAccount('bob', { posting: '5Kb' });
    selectAccount('alice');
    lockAccount('bob');
  }

  it('returns to an internal next path after unlocking', async () => {
    // The OAuth consent screen sends the user here and must get them back, or
    // the authorization request is lost and the app has to start over.
    rs.search = { next: '/oauth2/authorize?client_id=theapp' };
    await twoAccounts();
    render(<Accounts />);
    await userEvent.click(screen.getByRole('button', { name: /unlock/i }));
    await waitFor(() => expect(getState().selectedAccount).toBe('bob'));
    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith('/oauth2/authorize?client_id=theapp'),
    );
  });

  it('refuses an off-site next, which would be an open redirect', async () => {
    for (const bad of ['https://evil.example/x', '//evil.example/x']) {
      localStorage.clear();
      _resetKeyCache();
      rs.search = { next: bad };
      assign.mockReset();
      await twoAccounts();
      const view = render(<Accounts />);
      await userEvent.click(screen.getByRole('button', { name: /unlock/i }));
      await waitFor(() => expect(getState().selectedAccount).toBe('bob'));
      expect(assign).not.toHaveBeenCalled();
      view.unmount();
    }
  });
});
