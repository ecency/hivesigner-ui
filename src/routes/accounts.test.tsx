import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';

const rs = vi.hoisted(() => ({
  search: {} as { next?: string },
  navigate: vi.fn(),
  readKeys: vi.fn(),
}));
// Picking an account never opens it here: the screen that needs the keys
// asks for the passcode in place. Every read of a keystore is counted.
vi.mock('@/lib/keystore', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/keystore')>();
  return {
    ...real,
    readKeys: (field: string, passcode?: string) => {
      rs.readKeys();
      return real.readKeys(field, passcode);
    },
  };
});

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: unknown) => ({
    ...(opts as object),
    useSearch: () => rs.search,
  }),
  Link: ({
    children,
    to,
    search,
  }: {
    children: unknown;
    to: string;
    search?: Record<string, string>;
  }) => (
    <a href={to} data-search={search ? JSON.stringify(search) : undefined}>
      {children as never}
    </a>
  ),
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

const rows = () => screen.getAllByTestId('account-row');
const names = () => rows().map((r) => r.querySelector('bdi')?.textContent);
const row = (name: string) =>
  rows().find((r) => r.textContent?.includes(`@${name}`)) as HTMLElement;
/** The row's own button: picking the account. */
const pick = (name: string) =>
  within(row(name)).getByRole('button', { name: new RegExp(`^@${name}\\b`) });

beforeEach(() => {
  localStorage.clear();
  _resetKeyCache();
  rs.search = {};
  rs.navigate.mockReset();
  rs.readKeys.mockReset();
});

describe('the list (#146)', () => {
  it('is one column, A to Z, with the account in use marked', async () => {
    await addAccount('carol', { posting: '5Kc' });
    await addAccount('alice', { posting: '5Ka' });
    await addAccount('bob', { posting: '5Kb' });
    selectAccount('bob');
    render(<Accounts />);
    expect(names()).toEqual(['@alice', '@bob', '@carol']);
    expect(pick('bob')).toHaveAttribute('aria-current', 'true');
    expect(pick('alice')).not.toHaveAttribute('aria-current');
  });

  it('says "No passcode" only for an account stored without one, and nothing else', async () => {
    await addAccount('alice', { posting: '5Ka' });
    await addAccount('bob', { active: '5Kbob' }, 'pass');
    render(<Accounts />);
    const noPasscode = i18n.t('accounts.no_passcode');
    expect(row('alice')).toHaveTextContent(noPasscode);
    expect(row('bob')).not.toHaveTextContent(noPasscode);
    // The row is the choice: no Unlock or Switch buttons beside it, only
    // the one that removes it.
    expect(within(row('bob')).getAllByRole('button')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: /^unlock$/i })).toBeNull();
  });

  it('picks a locked account with one click, without asking for its passcode', async () => {
    await addAccount('alice', { posting: '5Ka' });
    await addAccount('bob', { active: '5Kbob' }, 'pass');
    lockAccount('bob');
    selectAccount('alice');
    rs.readKeys.mockReset();
    render(<Accounts />);
    await userEvent.click(pick('bob'));
    expect(getState().selectedAccount).toBe('bob');
    // Chosen, not opened: the screen that signs asks for the passcode.
    expect(isUnlocked('bob')).toBe(false);
    expect(rs.readKeys).not.toHaveBeenCalled();
    expect(document.querySelector('input[type="password"]')).toBeNull();
    // Nothing else was logged out.
    expect(isUnlocked('alice')).toBe(true);
  });
});

describe('a long list gets a filter', () => {
  async function accounts(list: string[]) {
    for (const n of list) await addAccount(n, { posting: `5K${n}` });
  }

  it('not for five accounts', async () => {
    await accounts(['a1', 'a2', 'a3', 'a4', 'a5']);
    render(<Accounts />);
    expect(screen.queryByRole('searchbox')).toBeNull();
  });

  it('from six on, finding by part of the name, with or without @', async () => {
    await accounts(['alice', 'bob', 'carol', 'dave', 'erin', 'frank']);
    const user = userEvent.setup();
    render(<Accounts />);
    const filter = screen.getByRole('searchbox', {
      name: i18n.t('accounts.search'),
    });
    await user.type(filter, 'AR');
    expect(names()).toEqual(['@carol']);
    await user.clear(filter);
    await user.type(filter, '@fra');
    expect(names()).toEqual(['@frank']);
    await user.clear(filter);
    await user.type(filter, 'zzz');
    expect(screen.queryAllByTestId('account-row')).toHaveLength(0);
    expect(screen.getByText(i18n.t('signs.nothing_matches'))).toBeVisible();
  });
});

describe('removing an account', () => {
  it('asks first, and keeps it when the user says no', async () => {
    await addAccount('alice', { posting: '5Ka' });
    await addAccount('bob', { posting: '5Kb' });
    const confirm = vi.fn(() => false);
    vi.stubGlobal('confirm', confirm);
    render(<Accounts />);
    const remove = () =>
      screen.getByRole('button', {
        name: `${i18n.t('accounts.delete')} @bob`,
      });
    await userEvent.click(remove());
    expect(confirm).toHaveBeenCalled();
    expect(getState().usernames).toContain('bob');
    confirm.mockReturnValue(true);
    await userEvent.click(remove());
    expect(getState().usernames).not.toContain('bob');
    expect(names()).toEqual(['@alice']);
  });
});

describe('returning to the flow that sent the user here', () => {
  const assign = vi.fn();

  beforeEach(() => {
    assign.mockReset();
    vi.stubGlobal('location', {
      assign,
      origin: 'https://signer.example',
      pathname: '/accounts',
      search: '',
    });
  });

  async function twoAccounts() {
    await addAccount('alice', { posting: '5Ka' });
    await addAccount('bob', { posting: '5Kb' });
    selectAccount('alice');
  }

  it('returns CLIENT-SIDE, so the keys in memory survive', async () => {
    // Decrypted keys are in memory only. A document navigation would reload
    // the app and drop them, so this must never touch window.location.
    rs.search = { next: '/oauth2/authorize?client_id=theapp' };
    await twoAccounts();
    render(<Accounts />);
    await userEvent.click(pick('bob'));
    expect(rs.navigate).toHaveBeenCalledWith({
      to: '/oauth2/authorize',
      search: { client_id: 'theapp' },
    });
    expect(assign).not.toHaveBeenCalled();
    expect(getState().selectedAccount).toBe('bob');
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
      await twoAccounts();
      const view = render(<Accounts />);
      await userEvent.click(pick('bob'));
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
    await userEvent.click(pick('bob'));
    expect(rs.navigate).toHaveBeenCalledWith({
      to: '/authorized-apps',
      search: {},
    });
  });

  it('stays on the list when there is nothing to return to', async () => {
    await twoAccounts();
    render(<Accounts />);
    await userEvent.click(pick('bob'));
    expect(getState().selectedAccount).toBe('bob');
    expect(rs.navigate).not.toHaveBeenCalled();
    expect(pick('bob')).toHaveAttribute('aria-current', 'true');
  });
});

describe('adding an account from a request keeps the request', () => {
  // A user who came here from a consent or sign request, and finds the
  // account they want is not on the device, follows "Add another account".
  // Without `next` on that link the import finished on the account list and
  // the request was gone.
  it('both add-account links carry next when there is one', async () => {
    await addAccount('alice', { posting: '5Ka' });
    rs.search = { next: '/sign/vote?voter=alice' };
    render(<Accounts />);
    const links = screen.getAllByRole('link', { name: /add another/i });
    expect(links.length).toBeGreaterThan(0);
    for (const l of links) {
      expect(l).toHaveAttribute('href', '/import');
      expect(JSON.parse(l.getAttribute('data-search') ?? '{}')).toEqual({
        next: '/sign/vote?voter=alice',
      });
    }
  });

  it('with no accounts at all, the only link still carries next', () => {
    rs.search = { next: '/oauth2/authorize?client_id=theapp' };
    render(<Accounts />);
    for (const l of screen.getAllByRole('link', { name: /add another/i })) {
      expect(JSON.parse(l.getAttribute('data-search') ?? '{}').next).toBe(
        '/oauth2/authorize?client_id=theapp',
      );
    }
  });

  it('adds no next key when there is nothing to return to', async () => {
    await addAccount('alice', { posting: '5Ka' });
    render(<Accounts />);
    for (const l of screen.getAllByRole('link', { name: /add another/i })) {
      expect(JSON.parse(l.getAttribute('data-search') ?? '{}')).toEqual({});
    }
  });
});
