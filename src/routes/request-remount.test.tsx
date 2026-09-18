import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Another request on the same route is another screen (remountDeps on the
// request routes). A screen kept alive across an in-app move from request A
// to request B on the same route (a different search, or the same params, so
// the router's own match key does not change) carries A's state into B: the
// success screen of a transaction already signed stands on B's URL, and the
// grant page announces an app as authorized that it never granted. It also
// keeps A as the request its leave latch compares against. This pins it with
// the REAL router and the app's own route tree, since a mocked router cannot
// navigate at all.
//
// Mocked: the chain (a broadcast is the assertion, an account read the grant
// needs), the app profile card (a chain read of its own) and nothing else.
const chain = vi.hoisted(() => ({
  broadcastOperations: vi.fn(),
  getAccount: vi.fn(),
}));
vi.mock('@/lib/hive', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/hive')>()),
  getAccount: chain.getAccount,
  getProfiles: async () => ({}),
  // The sign screen asks for the HP rate on mount; a vote does not need it.
  getVestsToSp: async () => 0.0005,
}));
vi.mock('@/lib/sign-tx', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/sign-tx')>()),
  broadcastOperations: chain.broadcastOperations,
}));
vi.mock('@/components/AppProfile', () => ({ AppProfile: () => null }));

import { PrivateKey } from '@ecency/sdk/hive';
import { _resetKeyCache, addAccount } from '@/lib/accounts';
import { parseSearch, stringifySearch } from '@/lib/search';
import i18n from '../i18n';
import { routeTree } from '../routeTree.gen';

const MASTER = 'P5-test-master-password';
const active = PrivateKey.fromLogin('alice', MASTER, 'active');
const posting = PrivateKey.fromLogin('alice', MASTER, 'posting');
const pub = (k: PrivateKey) => k.createPublic().toString();

const alice = {
  name: 'alice',
  owner: { weight_threshold: 1, account_auths: [], key_auths: [] },
  active: {
    weight_threshold: 1,
    account_auths: [],
    key_auths: [[pub(active), 1]],
  },
  posting: {
    weight_threshold: 1,
    account_auths: [],
    key_auths: [[pub(posting), 1]],
  },
  memo_key: pub(posting),
  json_metadata: '{}',
  posting_json_metadata: '{}',
};

/** The app as index.tsx builds it, started at `url`. */
function renderApp(url: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [url] }),
    pathParamsAllowedCharacters: ['@'],
    parseSearch,
    stringifySearch,
  });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <StrictMode>
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
  return router;
}

const vote = (permlink: string) => ({
  voter: 'alice',
  author: 'someone',
  permlink,
  weight: '10000',
});

/** The operation the one broadcast carried. */
function broadcastOp(): [string, Record<string, unknown>] {
  expect(chain.broadcastOperations).toHaveBeenCalledTimes(1);
  return chain.broadcastOperations.mock.calls[0][0][0];
}

beforeEach(async () => {
  localStorage.clear();
  _resetKeyCache();
  chain.broadcastOperations.mockReset().mockResolvedValue({ id: 'tx' });
  chain.getAccount.mockReset();
  chain.getAccount.mockImplementation(async (name: string) =>
    name === 'alice' ? alice : null,
  );
  // The router restores scroll on navigation; jsdom has no scrolling.
  vi.stubGlobal('scrollTo', vi.fn());
  // Unlocked from the start: no passcode, so the store holds the keys.
  await addAccount('alice', {
    posting: posting.toString(),
    active: active.toString(),
  });
});

describe('a second request on the same route is a fresh screen', () => {
  it('sign: approving on request A broadcasts (the harness can broadcast)', async () => {
    renderApp('/sign/vote?' + new URLSearchParams(vote('first')));
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /approve/i }));
    await waitFor(() => expect(broadcastOp()[1].permlink).toBe('first'));
  });

  it("sign: request B after A was signed is B to confirm, not A's success", async () => {
    const router = renderApp(
      '/sign/vote?' + new URLSearchParams(vote('first')),
    );
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /approve/i }));
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      /success/i,
    );
    // In-app, as a link on the page would: the same route with another
    // search, so the router reuses the match unless the route says otherwise.
    await router.navigate({
      to: '/sign/$',
      params: { _splat: 'vote' },
      search: vote('second'),
    });
    await screen.findByText(/"permlink": "second"/);
    await user.click(screen.getByRole('button', { name: /approve/i }));
    await waitFor(() =>
      expect(chain.broadcastOperations).toHaveBeenCalledTimes(2),
    );
    expect(chain.broadcastOperations.mock.calls[1][0][0][1].permlink).toBe(
      'second',
    );
  });

  it('grant: another app after one was granted is not announced as authorized', async () => {
    const router = renderApp('/authorize/new.app');
    const user = userEvent.setup();
    const authorize = async () => {
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: /^authorize$/i }),
        ).toBeEnabled(),
      );
      await user.click(screen.getByRole('button', { name: /^authorize$/i }));
    };
    await authorize();
    expect(await screen.findByRole('status')).toHaveTextContent(
      /@new\.app is authorized/i,
    );
    // Same route, other params: the router reuses the component unless the
    // route says otherwise.
    await router.navigate({
      to: '/authorize/$username',
      params: { username: 'other.app' },
    });
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/authorize/other.app'),
    );
    // other.app was never granted: the screen asks, it does not announce.
    await authorize();
    await waitFor(() =>
      expect(chain.broadcastOperations).toHaveBeenCalledTimes(2),
    );
  });
});

describe('more request routes: another request is a fresh screen', () => {
  /** alice with both apps already authorized on posting. */
  const granted = {
    ...alice,
    posting: {
      ...alice.posting,
      account_auths: [
        ['new.app', 1],
        ['other.app', 1],
      ],
    },
  };
  const app = (name: string) => ({
    name,
    posting_json_metadata: JSON.stringify({
      profile: { name, redirect_uris: ['https://app.example/cb'] },
    }),
  });
  let aliceFails = false;
  beforeEach(() => {
    aliceFails = false;
    chain.getAccount.mockImplementation(async (name: string) => {
      if (name === 'alice') {
        if (aliceFails) throw new Error('node down');
        return granted;
      }
      return name.endsWith('.app') ? app(name) : null;
    });
  });

  const consent = (clientId: string) =>
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: 'https://app.example/cb',
      scope: 'posting',
    });

  for (const route of ['/oauth2/authorize', '/login'] as const) {
    it(`${route}: a failure on one request is not shown on the next`, async () => {
      const router = renderApp(`${route}?${consent('new.app')}`);
      const user = userEvent.setup();
      const signIn = await screen.findByRole('button', { name: /^sign in$/i });
      await waitFor(() => expect(signIn).toBeEnabled());
      aliceFails = true;
      await user.click(signIn);
      expect(await screen.findByRole('alert')).toHaveTextContent(
        i18n.t('authorize.read_failed'),
      );
      aliceFails = false;
      // In-app, the same route with another request.
      await router.navigate({
        to: route,
        search: Object.fromEntries(consent('other.app')),
      } as never);
      await waitFor(() =>
        expect(router.state.location.search).toMatchObject({
          client_id: 'other.app',
        }),
      );
      await screen.findByRole('button', { name: /^sign in$/i });
      expect(screen.queryByRole('alert')).toBeNull();
    });
  }

  it('revoke: another app after one was revoked is not announced as revoked', async () => {
    const router = renderApp('/revoke/new.app');
    const user = userEvent.setup();
    const revoke = async () => {
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /^revoke$/i })).toBeEnabled(),
      );
      await user.click(screen.getByRole('button', { name: /^revoke$/i }));
    };
    await revoke();
    expect(await screen.findByRole('status')).toHaveTextContent(
      /@new\.app is revoked/i,
    );
    await router.navigate({
      to: '/revoke/$username',
      params: { username: 'other.app' },
    });
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/revoke/other.app'),
    );
    // other.app was never revoked: the screen asks, it does not announce.
    await revoke();
    await waitFor(() =>
      expect(chain.broadcastOperations).toHaveBeenCalledTimes(2),
    );
  });
});
