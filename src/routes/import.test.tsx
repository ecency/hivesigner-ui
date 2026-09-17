import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the chain layer so the form runs offline. getAccount returns an account
// whose posting key_auths hold the test key's pubkey; resolveCredential is real.
const POSTING_WIF = '5KT3LKgkovUYzQVSX3WpEGZ4rdazyotpi6piwvdFMxx9eiv8gRL';
const POSTING_PUB = 'STM4tb8Quiasc1qFoxqAkA72zug5bTUbZxAFBzDV43LXoBBRZdXkS';

// vi.mock is hoisted above declarations, so the mock fns must be too.
const { navigate, getAccount } = vi.hoisted(() => ({
  navigate: vi.fn(),
  getAccount: vi.fn(),
}));

const rs = vi.hoisted(() => ({ search: {} as { next?: string } }));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: unknown) => ({
    ...(opts as object),
    useSearch: () => rs.search,
  }),
  useNavigate: () => navigate,
}));

vi.mock('@/lib/hive', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/hive')>('@/lib/hive');
  return { ...actual, getAccount };
});

import { addAccount, getKeys, getState, isUnlocked } from '@/lib/accounts';
import { Route } from './import';

const Import = (Route as unknown as { component: ComponentType }).component;

function account() {
  const auth = (keys: [string, number][] = []) => ({
    weight_threshold: 1,
    account_auths: [],
    key_auths: keys,
  });
  return {
    name: 'alice',
    memo_key: 'STM7mem',
    owner: auth(),
    active: auth(),
    posting: auth([[POSTING_PUB, 1]]),
    json_metadata: '',
    posting_json_metadata: '',
  };
}

beforeEach(() => {
  rs.search = {};
  localStorage.clear();
  navigate.mockClear();
  getAccount.mockReset();
});

describe('import screen', () => {
  it('adds an account when the key belongs to it, then navigates', async () => {
    getAccount.mockResolvedValue(account());
    const user = userEvent.setup();
    render(<Import />);

    await user.type(
      screen.getByRole('textbox', { name: /username/i }),
      'alice',
    );
    await user.type(
      document.querySelector('input[name="password"]')!,
      POSTING_WIF,
    );
    // Uncheck the passcode for a plaintext add (simpler assertion).
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button'));

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: '/accounts' }),
    );
    expect(isUnlocked('alice')).toBe(true);
    expect(getKeys('alice')).toEqual({ posting: POSTING_WIF });
  });

  it('shows an error when the key does not belong to the account', async () => {
    getAccount.mockResolvedValue(account());
    const user = userEvent.setup();
    render(<Import />);

    await user.type(
      screen.getByRole('textbox', { name: /username/i }),
      'alice',
    );
    await user.type(
      document.querySelector('input[name="password"]')!,
      '5Kwrongkeyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    );
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button'));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows an error for an unknown account', async () => {
    getAccount.mockResolvedValue(null);
    const user = userEvent.setup();
    render(<Import />);

    await user.type(
      screen.getByRole('textbox', { name: /username/i }),
      'ghost',
    );
    await user.type(
      document.querySelector('input[name="password"]')!,
      POSTING_WIF,
    );
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button'));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});

describe('import carries the flow it was sent from', () => {
  async function fillAndSubmit() {
    getAccount.mockResolvedValue(account());
    const user = userEvent.setup();
    render(<Import />);
    await user.type(
      screen.getByRole('textbox', { name: /username/i }),
      'alice',
    );
    await user.type(
      document.querySelector('input[name="password"]')!,
      POSTING_WIF,
    );
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button'));
  }

  it('returns to ?next= after a successful import, not /accounts', async () => {
    // A first-time user arriving from an app consent screen would otherwise lose
    // the authorization request and the app would have to start over.
    rs.search = { next: '/oauth2/authorize?client_id=theapp' };
    await fillAndSubmit();
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: '/oauth2/authorize',
        search: { client_id: 'theapp' },
      }),
    );
  });

  it('refuses an off-site next and falls back to /accounts', async () => {
    rs.search = { next: 'https://evil.example/x' };
    await fillAndSubmit();
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: '/accounts' }),
    );
  });
});

describe('the imported account becomes current', () => {
  it('selects the account just imported, even when another was selected', async () => {
    // Importing Bob to satisfy a consent request that Alice cannot sign must
    // switch to Bob, or returning to the request still uses Alice and prompts
    // for an import again.
    await addAccount('alice', { posting: '5Kother' });
    expect(getState().selectedAccount).toBe('alice');

    getAccount.mockResolvedValue(account());
    const user = userEvent.setup();
    render(<Import />);
    await user.type(
      screen.getByRole('textbox', { name: /username/i }),
      'hivesignertest',
    );
    await user.type(
      document.querySelector('input[name="password"]')!,
      POSTING_WIF,
    );
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button'));

    await waitFor(() =>
      expect(getState().selectedAccount).toBe('hivesignertest'),
    );
  });
});

describe('import and password managers (#136)', () => {
  it('offers the username and key as the login, and keeps the passcode out of it', () => {
    render(<Import />);
    const form = document.querySelector('form') as HTMLFormElement;
    const key = document.querySelector(
      'input[name="password"]',
    ) as HTMLInputElement;
    const passcode = document.querySelector(
      'input[name="passcode"]',
    ) as HTMLInputElement;
    expect(key).toHaveAttribute('autocomplete', 'current-password');
    expect(key.form).toBe(form);
    expect(screen.getByRole('textbox', { name: /username/i })).toHaveAttribute(
      'autocomplete',
      'username',
    );
    // No longer "new-password": that is what made the pair read as a
    // password change of the saved key.
    expect(passcode).toHaveAttribute('autocomplete', 'one-time-code');
    expect(passcode).toHaveAttribute('data-1p-ignore', 'true');
    expect(passcode.form).not.toBe(form);
    expect(Array.from(form.elements)).not.toContain(passcode);
  });

  it('adds the account on Enter in the passcode field, and empties it before leaving', async () => {
    getAccount.mockResolvedValue(account());
    let passcodeAtNavigation: string | null | undefined;
    navigate.mockImplementation(() => {
      passcodeAtNavigation = (
        document.querySelector('input[name="passcode"]') as HTMLInputElement
      )?.value;
    });
    const user = userEvent.setup();
    render(<Import />);
    await user.type(
      screen.getByRole('textbox', { name: /username/i }),
      'alice',
    );
    await user.type(
      document.querySelector('input[name="password"]') as HTMLElement,
      POSTING_WIF,
    );
    await user.type(
      document.querySelector('input[name="passcode"]') as HTMLElement,
      'pass1234{Enter}',
    );
    await waitFor(() => expect(navigate).toHaveBeenCalled(), {
      timeout: 10_000,
    });
    expect(isUnlocked('alice')).toBe(true);
    expect(passcodeAtNavigation).toBe('');
  }, 30_000);
});
