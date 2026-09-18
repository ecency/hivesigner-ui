import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';

// Leaving a request screen while its unlock runs, with a REAL router. Routes
// are lazy chunks in the app, and the router keeps the screen mounted while
// the next page's chunk loads, so "the screen unmounted" arrives too late to
// stop a grant or a token. The other tests mock the router and unmount the
// screen at once, which cannot show this. Real account store, real keystore
// with a gate on readKeys so the unlock can be held in flight, fake chain.
const chain = vi.hoisted(() => ({
  granted: false,
  getAccount: vi.fn(),
  broadcastOperations: vi.fn(),
  assign: vi.fn(),
  unlockGate: null as null | Promise<void>,
  readGate: null as null | Promise<void>,
}));
vi.mock('@/lib/hive', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/hive')>()),
  getAccount: chain.getAccount,
}));
vi.mock('@/lib/keystore', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/keystore')>();
  return {
    ...real,
    readKeys: async (field: string, passcode?: string) => {
      if (chain.unlockGate) await chain.unlockGate;
      return real.readKeys(field, passcode);
    },
  };
});
vi.mock('@/lib/sign-tx', () => ({
  broadcastOperations: chain.broadcastOperations,
}));
vi.mock('@/lib/grant', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/grant')>()),
  waitForGrant: async () => chain.granted,
}));
vi.mock('@/components/AppProfile', () => ({ AppProfile: () => null }));
vi.mock('@sentry/browser', () => ({
  captureFeedback: vi.fn(),
  getClient: () => undefined,
}));

import { PrivateKey } from '@ecency/sdk/hive';
import {
  _resetKeyCache,
  addAccount,
  getKeys,
  lockAccount,
} from '@/lib/accounts';
import { AuthorizeConsent } from './AuthorizeConsent';
import { GrantAction } from './GrantAction';

const MASTER = 'P5-test-master-password';
const active = PrivateKey.fromLogin('alice', MASTER, 'active');
const posting = PrivateKey.fromLogin('alice', MASTER, 'posting');
const pub = (k: PrivateKey) => k.createPublic().toString();

const appAccount = {
  name: 'ecency.app',
  posting_json_metadata: JSON.stringify({
    profile: { name: 'Ecency', redirect_uris: ['https://ecency.com/auth'] },
  }),
};
const alice = () => ({
  name: 'alice',
  owner: { weight_threshold: 1, account_auths: [], key_auths: [] },
  active: {
    weight_threshold: 1,
    account_auths: [],
    key_auths: [[pub(active), 1]],
  },
  posting: {
    weight_threshold: 1,
    account_auths: chain.granted ? [['ecency.app', 1]] : [],
    key_auths: [[pub(posting), 1]],
  },
  memo_key: pub(posting),
  json_metadata: '{}',
  posting_json_metadata: '{}',
});

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

/** The app's shape in miniature: the request screen, and a lazy /accounts
    whose chunk loads only when `accountsChunk` resolves. */
function renderAt(url: string, accountsChunk: Promise<void>) {
  const root = createRootRoute({ component: () => <Outlet /> });
  const grant = createRoute({
    getParentRoute: () => root,
    path: '/authorize/$username',
    component: function Grant() {
      const { username } = grant.useParams();
      return <GrantAction appName={username} mode="grant" />;
    },
  });
  const consent = createRoute({
    getParentRoute: () => root,
    path: '/oauth2/authorize',
    component: () => (
      <AuthorizeConsent
        req={{
          clientId: 'ecency.app',
          redirectUri: 'https://ecency.com/auth',
          scope: 'posting',
          responseType: 'code',
        }}
      />
    ),
  });
  const accounts = createRoute({
    getParentRoute: () => root,
    path: '/accounts',
    component: lazyRouteComponent(() =>
      accountsChunk.then(() => ({
        default: () => <h1>account list</h1>,
      })),
    ),
  });
  const router = createRouter({
    routeTree: root.addChildren([grant, consent, accounts]),
    history: createMemoryHistory({ initialEntries: [url] }),
  });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

const passcodeField = () => screen.getByLabelText(i18n.t('accounts.passcode'));
const settle = () => new Promise((r) => setTimeout(r, 30));
const aliceReads = () =>
  chain.getAccount.mock.calls.filter(([n]) => n === 'alice').length;

beforeEach(async () => {
  localStorage.clear();
  _resetKeyCache();
  chain.granted = false;
  chain.unlockGate = null;
  chain.readGate = null;
  chain.getAccount.mockReset();
  chain.getAccount.mockImplementation(async (name: string) => {
    if (name === 'ecency.app') return appAccount;
    if (name === 'alice') {
      if (chain.readGate) await chain.readGate;
      return alice();
    }
    return null;
  });
  chain.broadcastOperations.mockReset();
  chain.broadcastOperations.mockImplementation(async () => {
    chain.granted = true;
    return { id: 'tx' };
  });
  chain.assign.mockReset();
  // The router restores scroll on navigation; jsdom has no scrolling.
  vi.stubGlobal('scrollTo', vi.fn());
  vi.stubGlobal('location', {
    ...window.location,
    assign: chain.assign,
    pathname: '/oauth2/authorize',
    search: '',
  });
  await addAccount(
    'alice',
    { posting: posting.toString(), active: active.toString() },
    'correct-passcode',
  );
  lockAccount('alice');
});

describe('Cancel pressed while the unlock runs, the next page still loading', () => {
  it('grant page: grants when the user stays (the harness can broadcast)', async () => {
    renderAt('/authorize/ecency.app', deferred().promise);
    const user = userEvent.setup();
    const button = await screen.findByRole('button', { name: /^authorize$/i });
    await user.type(passcodeField(), 'correct-passcode');
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);
    await waitFor(() => expect(chain.broadcastOperations).toHaveBeenCalled());
  });

  it('grant page: broadcasts nothing and reads nothing more', async () => {
    const chunk = deferred();
    const unlock = deferred();
    chain.unlockGate = unlock.promise;
    renderAt('/authorize/ecency.app', chunk.promise);
    const user = userEvent.setup();
    const button = await screen.findByRole('button', { name: /^authorize$/i });
    await user.type(passcodeField(), 'correct-passcode');
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);
    await user.click(screen.getByRole('link', { name: /cancel/i }));
    // The account list is still loading: this screen is still up.
    await settle();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /authorize/i,
    );
    const reads = aliceReads();
    unlock.resolve();
    await waitFor(() => expect(getKeys('alice')?.active).toBeTruthy());
    await settle();
    expect(chain.broadcastOperations).not.toHaveBeenCalled();
    // Stopped before even reading the account for the grant.
    expect(aliceReads()).toBe(reads);
    chunk.resolve();
    expect(
      await screen.findByRole('heading', { name: 'account list' }),
    ).toBeInTheDocument();
  });

  it('grant page: Cancel during the read before the grant broadcasts nothing', async () => {
    renderAt('/authorize/ecency.app', deferred().promise);
    const user = userEvent.setup();
    const button = await screen.findByRole('button', { name: /^authorize$/i });
    await user.type(passcodeField(), 'correct-passcode');
    await waitFor(() => expect(button).toBeEnabled());
    // The read the grant is built from is held until after Cancel.
    const read = deferred();
    chain.readGate = read.promise;
    const reads = aliceReads();
    await user.click(button);
    await waitFor(() => expect(aliceReads()).toBeGreaterThan(reads));
    await user.click(screen.getByRole('link', { name: /cancel/i }));
    read.resolve();
    await settle();
    expect(chain.broadcastOperations).not.toHaveBeenCalled();
  });

  it('consent: hands the app no token and grants nothing', async () => {
    const chunk = deferred();
    const unlock = deferred();
    chain.unlockGate = unlock.promise;
    renderAt('/oauth2/authorize', chunk.promise);
    const user = userEvent.setup();
    const button = await screen.findByRole('button', { name: /^authorize$/i });
    await user.type(passcodeField(), 'correct-passcode');
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);
    await user.click(screen.getByRole('link', { name: /cancel/i }));
    await settle();
    unlock.resolve();
    await waitFor(() => expect(getKeys('alice')?.active).toBeTruthy());
    await settle();
    expect(chain.broadcastOperations).not.toHaveBeenCalled();
    expect(chain.assign).not.toHaveBeenCalled();
  });

  it('coming back before the next page loaded leaves the screen working', async () => {
    const chunk = deferred();
    const router = renderAt('/authorize/ecency.app', chunk.promise);
    const user = userEvent.setup();
    const button = await screen.findByRole('button', { name: /^authorize$/i });
    await user.click(screen.getByRole('link', { name: /cancel/i }));
    await settle();
    router.history.back();
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/authorize/ecency.app'),
    );
    await settle();
    await user.type(passcodeField(), 'correct-passcode');
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);
    await waitFor(() => expect(chain.broadcastOperations).toHaveBeenCalled());
  });

  it('an in-page fragment is not leaving: the screen still acts', async () => {
    const router = renderAt('/authorize/ecency.app', deferred().promise);
    const user = userEvent.setup();
    const button = await screen.findByRole('button', { name: /^authorize$/i });
    // A hand-edited URL or an external link with a #fragment: same request.
    router.history.push('/authorize/ecency.app#details');
    await waitFor(() => expect(router.state.location.hash).toBe('details'));
    await settle();
    await user.type(passcodeField(), 'correct-passcode');
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);
    await waitFor(() => expect(chain.broadcastOperations).toHaveBeenCalled());
  });
});
