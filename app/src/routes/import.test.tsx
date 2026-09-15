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

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: unknown) => opts,
  useNavigate: () => navigate,
}));

vi.mock('@/lib/hive', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/hive')>('@/lib/hive');
  return { ...actual, getAccount };
});

import { getKeys, isUnlocked } from '@/lib/accounts';
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
