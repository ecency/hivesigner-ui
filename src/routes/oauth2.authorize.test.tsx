import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ComponentType, StrictMode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { oauthAppProfileKey } from '@/lib/query-keys';

// Regression tests for the OAuth consent screen. The two findings these pin:
//  - cancelling while the pre-grant account refetch is in flight must NOT go on
//    to broadcast an account_update (granting posting authority is irreversible);
//  - the "abandoned" latch must be cleared on effect setup, or Strict Mode's
//    setup -> cleanup -> setup leaves it stuck and every approval silently ends
//    without issuing a token.
const h = vi.hoisted(() => ({
  search: {} as Record<string, string>,
  accounts: { selectedAccount: 'alice', unlocked: ['alice'] },
  keys: { posting: '5Kposting', active: '5Kactive' } as Record<
    string,
    string
  > | null,
  account: null as unknown,
  profile: null as unknown,
  /** Resolves the pending refetchAccount() call, so a test can interleave. */
  releaseRefetch: undefined as undefined | (() => void),
  refetchAccount: vi.fn(),
  hasGrant: vi.fn(),
  getAccount: vi.fn(),
  broadcastOperations: vi.fn(),
  assign: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: unknown) => ({
    ...(opts as object),
    useSearch: () => h.search,
  }),
  Link: ({ children }: { children: unknown }) => children,
}));
// Two queries run here (app profile, selected account); dispatch on queryKey.
//
// Through the BUILDER, not a hardcoded string. A literal here silently sent the
// profile query down the account branch when the real key was renamed, handing
// the component an account object where it expected an app profile - the same
// stringly-typed hazard that crashed the consent screen in production.
vi.mock('@tanstack/react-query', () => ({
  useQuery: (opts: { queryKey: unknown[] }) =>
    opts.queryKey[0] === oauthAppProfileKey('x')[0]
      ? { data: h.profile, isLoading: false }
      : { data: h.account, refetch: h.refetchAccount },
}));
vi.mock('@/lib/use-accounts', () => ({ useAccounts: () => h.accounts }));
vi.mock('@/lib/accounts', () => ({ getKeys: () => h.keys }));
vi.mock('@/lib/hive', () => ({ getAccount: h.getAccount }));
vi.mock('@/lib/grant', () => ({
  // The real waitForGrant lives in this module and calls the module's OWN
  // hasGrant, which this mock replaces, so it has to be modelled here: poll
  // the mocked account and the mocked hasGrant, quickly.
  waitForGrant: async (username: string, clientId: string) => {
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => setTimeout(r, 20));
      const acc = await h.getAccount(username);
      if (acc && h.hasGrant(acc.posting, clientId)) return true;
    }
    return false;
  },
  hasGrant: h.hasGrant,
  buildGrantOperation: () => ['account_update', { account: 'alice' }],
}));
vi.mock('@/lib/sign-tx', () => ({
  broadcastOperations: h.broadcastOperations,
}));
// Keep the real request normalisation and registration check; stub only the
// chain read and the token/redirect construction.
vi.mock('@/lib/oauth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/oauth')>()),
  loadAppProfile: vi.fn(),
  buildAuthToken: () => 'TOKEN',
  buildRedirectUrl: () => 'https://app.example/cb?access_token=TOKEN',
}));

import { Route } from './oauth2.authorize';

const Authorize = (Route as unknown as { component: ComponentType }).component;

beforeEach(() => {
  h.search = {
    client_id: 'theapp',
    redirect_uri: 'https://app.example/cb',
    scope: 'posting',
  };
  h.accounts = { selectedAccount: 'alice', unlocked: ['alice'] };
  h.keys = { posting: '5Kposting', active: '5Kactive' };
  h.account = { name: 'alice', posting: { account_auths: [], key_auths: [] } };
  h.profile = { name: 'The App', redirectUris: ['https://app.example/cb'] };
  h.hasGrant.mockReset().mockReturnValue(false);
  h.broadcastOperations.mockReset().mockResolvedValue({ id: 'tx1' });
  h.refetchAccount.mockReset().mockResolvedValue({ data: h.account });
  h.assign.mockReset();
  vi.stubGlobal('location', { assign: h.assign });
});

describe('oauth consent screen', () => {
  it('does NOT grant posting authority when the screen is left mid-refetch', async () => {
    // Hold the pre-grant refetch open so we can cancel while it is pending.
    h.refetchAccount.mockImplementation(
      () =>
        new Promise((resolve) => {
          h.releaseRefetch = () => resolve({ data: h.account });
        }),
    );
    const user = userEvent.setup();
    const view = render(<Authorize />);
    await user.click(screen.getByRole('button', { name: /authorize/i }));
    await waitFor(() => expect(h.refetchAccount).toHaveBeenCalled());

    // The user leaves (Cancel / navigation) while the refetch is still open.
    view.unmount();
    h.releaseRefetch?.();
    await new Promise((r) => setTimeout(r, 0));

    // Granting is an on-chain write: withdrawn consent must stop it.
    expect(h.broadcastOperations).not.toHaveBeenCalled();
    expect(h.assign).not.toHaveBeenCalled();
  });

  it('grants, CONFIRMS on chain, then issues the token', async () => {
    // The previous version asserted only that broadcastOperations ran, while
    // getAccount was a bare mock so waitForGrant could never succeed and no
    // token was ever issued: it passed with the grant-before-token ordering
    // broken. Model the chain catching up instead, and assert the redirect.
    let broadcasted = false;
    h.broadcastOperations.mockImplementation(async () => {
      broadcasted = true;
      return { id: 'tx1' };
    });
    // The grant appears only after the broadcast, which is the real sequence.
    h.hasGrant.mockImplementation(() => broadcasted);
    h.getAccount.mockResolvedValue({
      name: 'alice',
      posting: { account_auths: [], key_auths: [] },
    });

    const user = userEvent.setup();
    render(<Authorize />);
    await user.click(screen.getByRole('button', { name: /authorize/i }));
    await waitFor(() => expect(h.broadcastOperations).toHaveBeenCalled());
    // waitForGrant polls every 2s, so allow one interval.
    await waitFor(
      () =>
        expect(h.assign).toHaveBeenCalledWith(
          'https://app.example/cb?access_token=TOKEN',
        ),
      { timeout: 6000 },
    );
    // Exactly one grant broadcast: the poll must not re-broadcast.
    expect(h.broadcastOperations).toHaveBeenCalledTimes(1);
  });

  it('still issues a token under Strict Mode (the latch resets on setup)', async () => {
    // No grant needed, so approval goes straight to token issuance. Strict Mode
    // double-invokes the effect: a cleanup-only latch would abort this.
    h.hasGrant.mockReturnValue(true);
    const user = userEvent.setup();
    render(<Authorize />, { wrapper: StrictMode });
    // Already granted: a sign-in.
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() =>
      expect(h.assign).toHaveBeenCalledWith(
        'https://app.example/cb?access_token=TOKEN',
      ),
    );
    expect(h.broadcastOperations).not.toHaveBeenCalled();
  });

  it('shows the real client_id and callback host, not only the app self-name', async () => {
    render(<Authorize />);
    // profile.name is the app account's own metadata, so the unforgeable
    // identifiers must be on screen too.
    expect((await screen.findAllByText(/@theapp/)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/app\.example/).length).toBeGreaterThan(0);
  });

  it('blocks approval when the redirect_uri is not registered', async () => {
    h.profile = { name: 'The App', redirectUris: ['https://other.example/cb'] };
    render(<Authorize />);
    expect(
      await screen.findByText(/redirect url is not registered/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /authorize/i })).toBeDisabled();
  });
});
