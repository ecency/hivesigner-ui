import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Regression tests for the sign route wiring (findings: no_broadcast must not
// broadcast; HP requests must wait for a real rate). Real parseSignRequest runs;
// only the chain side effects and account state are mocked.
const h = vi.hoisted(() => ({
  splat: 'vote',
  search: {} as Record<string, string>,
  vests: { rate: 1, ready: true },
  accounts: { selectedAccount: 'alice', unlocked: ['alice'] },
  keys: { posting: '5Kposting', active: '5Kactive' } as Record<
    string,
    string
  > | null,
  signOperations: vi.fn(),
  broadcastOperations: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: unknown) => ({
    ...(opts as object),
    useParams: () => ({ _splat: h.splat }),
    useSearch: () => h.search,
  }),
  Link: ({ children }: { children: unknown }) => children,
}));
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: h.vests, isSuccess: h.vests.ready }),
}));
vi.mock('@/lib/hive', () => ({ getVestsToSp: vi.fn() }));
vi.mock('@/lib/use-accounts', () => ({ useAccounts: () => h.accounts }));
vi.mock('@/lib/accounts', () => ({ getKeys: () => h.keys }));
// Mock only the signing/broadcast calls. resolveSigner stays REAL: the route
// uses it to resolve __signer for display, and the whole point is that display
// and signing share one resolver, so stubbing it would hide a divergence.
vi.mock('@/lib/sign-tx', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/sign-tx')>()),
  signOperations: h.signOperations,
  broadcastOperations: h.broadcastOperations,
}));

import { Route } from './sign.$';

const Sign = (Route as unknown as { component: ComponentType }).component;

beforeEach(() => {
  h.splat = 'vote';
  h.search = { author: 'a', permlink: 'p', weight: '10000' };
  h.vests = { rate: 1, ready: true };
  h.accounts = { selectedAccount: 'alice', unlocked: ['alice'] };
  h.keys = { posting: '5Kposting', active: '5Kactive' };
  h.signOperations
    .mockReset()
    .mockResolvedValue({ id: 'tx1', signature: 'SIG' });
  h.broadcastOperations.mockReset().mockResolvedValue({ id: 'tx1' });
});

describe('sign route', () => {
  it('broadcasts a normal vote on approve', async () => {
    const user = userEvent.setup();
    render(<Sign />);
    await user.click(screen.getByRole('button', { name: /approve/i }));
    await waitFor(() => expect(h.broadcastOperations).toHaveBeenCalled());
    expect(h.signOperations).not.toHaveBeenCalled();
  });

  it('a no_broadcast request signs but never broadcasts', async () => {
    // ?nb via an encoded op is awkward here; drive it through the vote path with
    // a no_broadcast flag by encoding is covered in lib tests. Here we assert the
    // route branch: set nb through the search the parser reads.
    h.splat = 'vote';
    // Build an nb request: the parser reads no_broadcast from a hive-uri; simulate
    // by using the op form. Use a signed op with nb through the encoded path.
    const { encodeOp } = await import('@/lib/hive-uri');
    const uri = encodeOp(
      ['vote', { voter: 'alice', author: 'a', permlink: 'p', weight: 1 }],
      { no_broadcast: true },
    );
    const [path, qs] = uri.replace('hive://sign/', '').split('?');
    h.splat = path;
    h.search = Object.fromEntries(new URLSearchParams(qs));
    const user = userEvent.setup();
    render(<Sign />);
    await user.click(screen.getByRole('button', { name: /sign/i }));
    await waitFor(() => expect(h.signOperations).toHaveBeenCalled());
    expect(h.broadcastOperations).not.toHaveBeenCalled();
  });

  it('warns when the request acts as an account other than the selected one', async () => {
    // A transfer whose `from` is a treasury the user co-manages: without this
    // warning it reads as the user spending their own funds.
    h.splat = 'transfer';
    h.search = { from: 'treasury', to: 'attacker', amount: '10.000 HIVE' };
    render(<Sign />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/@treasury/);
    expect(screen.getByRole('alert')).toHaveTextContent(/not @alice/);
  });

  it('shows no actor warning when the operation acts as the selected account', async () => {
    h.splat = 'transfer';
    h.search = { from: 'alice', to: 'bob', amount: '1.000 HIVE' };
    render(<Sign />);
    await screen.findByRole('button', { name: /approve/i });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('resolves __signer in the rendered summary instead of showing the token', async () => {
    // No `from` given: the schema defaults it to __signer.
    h.splat = 'transfer';
    h.search = { to: 'bob', amount: '2.000 HIVE' };
    render(<Sign />);
    await screen.findByRole('button', { name: /approve/i });
    expect(document.body.textContent).not.toContain('__signer');
    expect(document.body.textContent).toContain('@alice');
  });

  it('blocks approval of an HP request until the rate has loaded', async () => {
    h.search = { to: 'bob', amount: '1 HP' };
    h.splat = 'transfer';
    h.vests = { rate: 1, ready: false }; // rate not loaded yet
    render(<Sign />);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(
      screen.getByText(/loading the current hive power rate/i),
    ).toBeInTheDocument();
  });
});
