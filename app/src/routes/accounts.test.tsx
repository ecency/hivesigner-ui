import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const rs = vi.hoisted(() => ({
  search: {} as { next?: string },
  navigate: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: unknown) => ({
    ...(opts as object),
    useSearch: () => rs.search,
  }),
  Link: ({ children }: { children: unknown }) => children,
  useNavigate: () => rs.navigate,
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
    rs.navigate.mockReset();
    assign.mockReset();
    vi.stubGlobal('location', {
      assign,
      origin: 'https://signer.example',
      pathname: '/accounts',
      search: '',
    });
  });

  /** alice selected, bob present but not in memory (as after a reload). */
  async function twoAccounts() {
    await addAccount('alice', { posting: '5Ka' });
    await addAccount('bob', { posting: '5Kb' });
    selectAccount('alice');
    lockAccount('bob');
  }

  it('returns CLIENT-SIDE, so the just-unlocked keys survive', async () => {
    // Decrypted keys are in memory only. A document navigation would reload the
    // app, re-lock the account and bounce the user back here forever, so this
    // must never touch window.location.
    rs.search = { next: '/oauth2/authorize?client_id=theapp' };
    await twoAccounts();
    render(<Accounts />);
    await userEvent.click(screen.getByRole('button', { name: /unlock/i }));
    await waitFor(() => expect(rs.navigate).toHaveBeenCalled());
    expect(rs.navigate).toHaveBeenCalledWith({
      to: '/oauth2/authorize',
      search: { client_id: 'theapp' },
    });
    expect(assign).not.toHaveBeenCalled();
    expect(isUnlocked('bob')).toBe(true);
  });

  it('refuses every off-site next, including backslash forms', async () => {
    // `/\\evil.example/x` and `\\/evil.example` resolve to an EXTERNAL origin
    // even though they start with a single '/', so a startsWith check is not
    // enough; `/..//evil.example` stays same-origin but resolves to a
    // protocol-relative path.
    for (const bad of [
      'https://evil.example/x',
      '//evil.example/x',
      '/\\evil.example/after-unlock',
      '\\/evil.example',
      '/..//evil.example',
    ]) {
      localStorage.clear();
      _resetKeyCache();
      rs.search = { next: bad };
      rs.navigate.mockReset();
      assign.mockReset();
      await twoAccounts();
      const view = render(<Accounts />);
      await userEvent.click(screen.getByRole('button', { name: /unlock/i }));
      await waitFor(() => expect(getState().selectedAccount).toBe('bob'));
      expect(rs.navigate, `next=${bad}`).not.toHaveBeenCalled();
      expect(assign, `next=${bad}`).not.toHaveBeenCalled();
      view.unmount();
    }
  });

  it('still returns for a plain internal path with no query', async () => {
    rs.search = { next: '/authorized-apps' };
    await twoAccounts();
    render(<Accounts />);
    await userEvent.click(screen.getByRole('button', { name: /unlock/i }));
    await waitFor(() =>
      expect(rs.navigate).toHaveBeenCalledWith({
        to: '/authorized-apps',
        search: {},
      }),
    );
  });
});

describe('plaintext unlock failure', () => {
  it('shows the error even though the passcode form never opens', async () => {
    // A corrupt persisted plaintext keystore rejects in unlockAccount. The row
    // stays in its normal state (unlocking is false), so an error rendered only
    // inside the passcode form would never be seen.
    await addAccount('alice', { posting: '5Ka' });
    await addAccount('bob', { posting: '5Kb' });
    selectAccount('alice');
    lockAccount('bob');
    // Corrupt bob's stored blob.
    const raw = JSON.parse(localStorage.getItem('vuex__accounts') as string);
    // Detected as the legacy PLAINTEXT format (it ends with the marker) but its
    // hex body is junk, so readKeys rejects without opening a passcode form.
    raw.accountsKeychains.bob.password = 'zzdecrypted';
    localStorage.setItem('vuex__accounts', JSON.stringify(raw));

    render(<Accounts />);
    await userEvent.click(screen.getByRole('button', { name: /unlock/i }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    // And it did not silently select the account it could not unlock.
    expect(getState().selectedAccount).toBe('alice');
  });
});
