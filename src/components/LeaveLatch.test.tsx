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
import { render, screen, waitFor, within } from '@testing-library/react';
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
  grantGate: null as null | Promise<void>,
  readFails: false,
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
  waitForGrant: async () => {
    if (chain.grantGate) await chain.grantGate;
    return chain.granted;
  },
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
  selectAccount,
  unlockAccount,
} from '@/lib/accounts';
import { Route as LoginRoute } from '@/routes/login';
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
function renderAt(url: string | string[], accountsChunk: Promise<void>) {
  const root = createRootRoute({ component: () => <Outlet /> });
  const grant = createRoute({
    getParentRoute: () => root,
    path: '/authorize/$username',
    component: function Grant() {
      const { username } = grant.useParams();
      return (
        <GrantAction
          appName={username}
          mode="grant"
          query={grant.useSearch() as Record<string, string>}
        />
      );
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
  // The app's own /login screen (the same route id, so its hooks resolve).
  const login = createRoute({
    getParentRoute: () => root,
    path: '/login',
    component: LoginRoute.options.component,
  });
  const profile = createRoute({
    getParentRoute: () => root,
    path: '/profile',
    component: () => <h1>profile page</h1>,
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
    routeTree: root.addChildren([grant, consent, login, profile, accounts]),
    history: createMemoryHistory({
      initialEntries: [url].flat(),
      initialIndex: [url].flat().length - 1,
    }),
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
  chain.grantGate = null;
  chain.readFails = false;
  chain.getAccount.mockReset();
  chain.getAccount.mockImplementation(async (name: string) => {
    if (name === 'ecency.app') return appAccount;
    if (name === 'alice') {
      if (chain.readGate) await chain.readGate;
      if (chain.readFails) throw new Error('node down');
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

  it('grant page: Cancel during the read, then Back: the button works again', async () => {
    const router = renderAt('/authorize/ecency.app', deferred().promise);
    const user = userEvent.setup();
    const button = await screen.findByRole('button', { name: /^authorize$/i });
    await user.type(passcodeField(), 'correct-passcode');
    await waitFor(() => expect(button).toBeEnabled());
    const read = deferred();
    chain.readGate = read.promise;
    const reads = aliceReads();
    await user.click(button);
    await waitFor(() => expect(aliceReads()).toBeGreaterThan(reads));
    await user.click(screen.getByRole('link', { name: /cancel/i }));
    await settle();
    router.history.back();
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/authorize/ecency.app'),
    );
    chain.readGate = null;
    read.resolve();
    await settle();
    expect(chain.broadcastOperations).not.toHaveBeenCalled();
    // Not a dead button: that click is spent, a new one grants.
    const again = await screen.findByRole('button', { name: /^authorize$/i });
    await waitFor(() => expect(again).toBeEnabled());
    await user.click(again);
    await waitFor(() => expect(chain.broadcastOperations).toHaveBeenCalled());
  });

  it('consent: a read that fails after Cancel shows no error', async () => {
    renderAt('/oauth2/authorize', deferred().promise);
    const user = userEvent.setup();
    const button = await screen.findByRole('button', { name: /^authorize$/i });
    await user.type(passcodeField(), 'correct-passcode');
    await waitFor(() => expect(button).toBeEnabled());
    const read = deferred();
    chain.readGate = read.promise;
    const reads = aliceReads();
    await user.click(button);
    await waitFor(() => expect(aliceReads()).toBeGreaterThan(reads));
    await user.click(screen.getByRole('link', { name: /cancel/i }));
    chain.readFails = true;
    read.resolve();
    await settle();
    // Still on screen while the account list loads, and quiet.
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('consent: a read that fails when the user stays says so (the harness can)', async () => {
    renderAt('/oauth2/authorize', deferred().promise);
    const user = userEvent.setup();
    const button = await screen.findByRole('button', { name: /^authorize$/i });
    await user.type(passcodeField(), 'correct-passcode');
    await waitFor(() => expect(button).toBeEnabled());
    chain.readFails = true;
    await user.click(button);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      i18n.t('authorize.read_failed'),
    );
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

  it('an in-page fragment during the unlock is not leaving: the click still acts', async () => {
    const unlock = deferred();
    chain.unlockGate = unlock.promise;
    const router = renderAt('/authorize/ecency.app', deferred().promise);
    const user = userEvent.setup();
    const button = await screen.findByRole('button', { name: /^authorize$/i });
    await user.type(passcodeField(), 'correct-passcode');
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);
    // A hand-edited URL or an external link with a #fragment: same request.
    router.history.push('/authorize/ecency.app#details');
    await waitFor(() => expect(router.state.location.hash).toBe('details'));
    unlock.resolve();
    await waitFor(() => expect(chain.broadcastOperations).toHaveBeenCalled());
  });

  it('Cancel then Back during one unlock: that click is spent, a new one works', async () => {
    const chunk = deferred();
    const unlock = deferred();
    chain.unlockGate = unlock.promise;
    const router = renderAt('/authorize/ecency.app', chunk.promise);
    const user = userEvent.setup();
    const button = await screen.findByRole('button', { name: /^authorize$/i });
    await user.type(passcodeField(), 'correct-passcode');
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);
    await user.click(screen.getByRole('link', { name: /cancel/i }));
    await settle();
    router.history.back();
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/authorize/ecency.app'),
    );
    unlock.resolve();
    await waitFor(() => expect(getKeys('alice')?.active).toBeTruthy());
    await settle();
    // The user withdrew that click by leaving; coming back does not revive it.
    expect(chain.broadcastOperations).not.toHaveBeenCalled();
    // The screen still works for a click made now.
    await user.click(
      await screen.findByRole('button', { name: /^authorize$/i }),
    );
    await waitFor(() => expect(chain.broadcastOperations).toHaveBeenCalled());
  });
});

describe('local sign-in: the user sets off while the passcode is checked', () => {
  const signIn = async () => {
    const user = userEvent.setup();
    const button = await screen.findByRole('button', { name: /^sign in$/i });
    await user.type(passcodeField(), 'correct-passcode');
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);
    return user;
  };

  it('moves on to the target when the user stays (the harness can)', async () => {
    const router = renderAt('/login?redirect=%2Fprofile', deferred().promise);
    await signIn();
    expect(
      await screen.findByRole('heading', { name: 'profile page' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/profile');
  });

  it('leaving (the account list, say) wins over the sign-in finishing', async () => {
    const chunk = deferred();
    const unlock = deferred();
    chain.unlockGate = unlock.promise;
    const router = renderAt('/login?redirect=%2Fprofile', chunk.promise);
    await signIn();
    // A link elsewhere on the page (the header's Accounts): switching
    // itself happens in place and goes nowhere (#146).
    void router.navigate({ to: '/accounts' });
    await settle();
    unlock.resolve();
    await waitFor(() => expect(getKeys('alice')).toBeTruthy());
    await settle();
    expect(router.latestLocation.pathname).toBe('/accounts');
    chunk.resolve();
    expect(
      await screen.findByRole('heading', { name: 'account list' }),
    ).toBeInTheDocument();
    await settle();
    expect(router.state.location.pathname).toBe('/accounts');
  });

  it('another tab choosing a locked account meanwhile: asks for that one, goes nowhere', async () => {
    await addAccount('bob', { posting: posting.toString() }, 'bob-passcode');
    lockAccount('bob');
    selectAccount('alice');
    const unlock = deferred();
    chain.unlockGate = unlock.promise;
    const router = renderAt('/login?redirect=%2Fprofile', deferred().promise);
    await signIn();
    // What this tab adopts from another tab's choice.
    selectAccount('bob');
    unlock.resolve();
    await waitFor(() => expect(getKeys('alice')).toBeTruthy());
    await settle();
    expect(router.latestLocation.pathname).toBe('/login');
    expect(screen.getByTestId('current-account')).toHaveTextContent('@bob');
    expect(passcodeField()).toBeInTheDocument();
  });

  it('an account unlocked already moves on in place of the sign-in, so Back does not bounce', async () => {
    await unlockAccount('alice', 'correct-passcode');
    const router = renderAt(
      ['/authorize/ecency.app', '/login?redirect=%2Fprofile'],
      deferred().promise,
    );
    expect(
      await screen.findByRole('heading', { name: 'profile page' }),
    ).toBeInTheDocument();
    router.history.back();
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/authorize/ecency.app'),
    );
  });

  it('only an ellipsis while the target loads, no Continue', async () => {
    const chunk = deferred();
    const router = renderAt('/login?redirect=%2Faccounts', chunk.promise);
    await signIn();
    await waitFor(() =>
      expect(router.latestLocation.pathname).toBe('/accounts'),
    );
    await settle();
    expect(screen.queryByRole('link', { name: /continue/i })).toBeNull();
    expect(screen.getByText('…')).toBeInTheDocument();
    chunk.resolve();
    expect(
      await screen.findByRole('heading', { name: 'account list' }),
    ).toBeInTheDocument();
  });

  it('another tab choosing an account unlocked here: names it, moves on only on a click', async () => {
    // carol is open in this tab; after a reload this tab has made no choice
    // of its own, so the stored one (another tab's) is adopted on the unlock.
    await addAccount('carol', { posting: posting.toString() });
    selectAccount('alice');
    _resetKeyCache();
    await unlockAccount('carol');
    const unlock = deferred();
    chain.unlockGate = unlock.promise;
    const router = renderAt(
      ['/authorize/ecency.app', '/login?redirect=%2Fprofile'],
      deferred().promise,
    );
    const user = await signIn();
    const raw = JSON.parse(localStorage.getItem('vuex__accounts') as string);
    localStorage.setItem(
      'vuex__accounts',
      JSON.stringify({ ...raw, selectedAccount: 'carol' }),
    );
    unlock.resolve();
    await waitFor(() => expect(getKeys('alice')).toBeTruthy());
    await settle();
    expect(router.latestLocation.pathname).toBe('/login');
    expect(screen.getByTestId('current-account')).toHaveTextContent('@carol');
    await user.click(screen.getByRole('link', { name: /continue/i }));
    expect(
      await screen.findByRole('heading', { name: 'profile page' }),
    ).toBeInTheDocument();
    // In place of the sign-in: Back does not land on it.
    router.history.back();
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/authorize/ecency.app'),
    );
  });

  it('another tab choosing an account unlocked here, no click: names it, stays', async () => {
    await addAccount('carol', { posting: posting.toString() });
    selectAccount('alice');
    const router = renderAt('/login?redirect=%2Fprofile', deferred().promise);
    await screen.findByRole('button', { name: /^sign in$/i });
    selectAccount('carol');
    await settle();
    expect(router.latestLocation.pathname).toBe('/login');
    expect(screen.getByTestId('current-account')).toHaveTextContent('@carol');
    expect(screen.getByRole('link', { name: /continue/i })).toBeInTheDocument();
  });

  it('back before the list loaded: not sent on, but the way on is there', async () => {
    const unlock = deferred();
    chain.unlockGate = unlock.promise;
    const router = renderAt('/login?redirect=%2Fprofile', deferred().promise);
    const user = await signIn();
    // A link elsewhere on the page (the header's Accounts): switching
    // itself happens in place and goes nowhere (#146).
    void router.navigate({ to: '/accounts' });
    await settle();
    router.history.back();
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    unlock.resolve();
    await waitFor(() => expect(getKeys('alice')).toBeTruthy());
    await settle();
    expect(router.state.location.pathname).toBe('/login');
    expect(screen.getByTestId('current-account')).toHaveTextContent('@alice');
    await user.click(screen.getByRole('link', { name: /continue/i }));
    expect(
      await screen.findByRole('heading', { name: 'profile page' }),
    ).toBeInTheDocument();
  });
});

describe('Cancel pressed while the grant is confirmed on chain', () => {
  // The grant is out; what is left is waiting for it to show (up to 16s),
  // then the step that follows it: the token for the app, or the way back
  // to the login that sent the user here. A user who left meanwhile gets
  // neither.
  const consentUrl = '/oauth2/authorize';
  const grantUrl = `/authorize/ecency.app?${new URLSearchParams({
    redirect_uri: 'https://ecency.com/auth',
    scope: 'posting',
  })}`;

  async function authorizeAndHold(url: string, leaveFirst: boolean) {
    const confirmed = deferred();
    chain.grantGate = confirmed.promise;
    const router = renderAt(url, deferred().promise);
    const user = userEvent.setup();
    const button = await screen.findByRole('button', { name: /^authorize$/i });
    await user.type(passcodeField(), 'correct-passcode');
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);
    await waitFor(() => expect(chain.broadcastOperations).toHaveBeenCalled());
    if (leaveFirst) {
      await user.click(screen.getByRole('link', { name: /cancel/i }));
      await settle();
    }
    confirmed.resolve();
    await settle();
    return router;
  }

  it('consent: the app gets its token when the user stays (the harness can)', async () => {
    await authorizeAndHold(consentUrl, false);
    await waitFor(() => expect(chain.assign).toHaveBeenCalled());
  });

  it('consent: no token after Cancel', async () => {
    await authorizeAndHold(consentUrl, true);
    expect(chain.assign).not.toHaveBeenCalled();
  });

  it('grant page: back to the login when the user stays (the harness can)', async () => {
    const router = await authorizeAndHold(grantUrl, false);
    await waitFor(() => expect(router.latestLocation.pathname).toBe('/login'));
  });

  it('grant page: not pulled back to the login after Cancel', async () => {
    const router = await authorizeAndHold(grantUrl, true);
    expect(router.latestLocation.pathname).toBe('/accounts');
  });
});

describe('switching in place while the passcode is checked (#146)', () => {
  it('consent: acts for nobody, and shows the account picked', async () => {
    await addAccount('bob', { posting: posting.toString() });
    selectAccount('alice');
    const unlock = deferred();
    chain.unlockGate = unlock.promise;
    renderAt('/oauth2/authorize', deferred().promise);
    const user = userEvent.setup();
    const button = await screen.findByRole('button', { name: /^authorize$/i });
    await user.type(passcodeField(), 'correct-passcode');
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);
    await user.click(
      screen.getByRole('button', { name: /switch an account/i }),
    );
    const bob = screen
      .getAllByTestId('account-row')
      .find((r) => r.textContent?.includes('@bob')) as HTMLElement;
    await user.click(within(bob).getByRole('button'));
    unlock.resolve();
    await waitFor(() => expect(getKeys('alice')).toBeTruthy());
    await settle();
    expect(chain.broadcastOperations).not.toHaveBeenCalled();
    expect(chain.assign).not.toHaveBeenCalled();
    expect(screen.getByTestId('current-account')).toHaveTextContent('@bob');
  });
});
