import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';

// The request screens unlock in place (#145), and an unlock can take seconds
// (scrypt, or a legacy triplesec record). What the user does while it runs,
// and what the screen promised before the click, must still hold when it
// finishes. Real account store, real keystore with a gate on readKeys so an
// unlock can be held in flight, fake chain.
vi.mock('@tanstack/react-router', async () =>
  (await import('../test-router-mock')).routerMock(),
);
const chain = vi.hoisted(() => ({
  granted: false,
  getAccount: vi.fn(),
  broadcastOperations: vi.fn(),
  assign: vi.fn(),
  // Holds every unlock until released.
  unlockGate: null as null | Promise<void>,
  // Holds the alice account read until released.
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
  selectAccount,
  unlockAccount,
} from '@/lib/accounts';
import { writeKeys } from '@/lib/keystore';
import type { AuthRequest } from '@/lib/oauth';
import { accountKey } from '@/lib/query-keys';
import { AuthorizeConsent } from './AuthorizeConsent';
import { GrantAction } from './GrantAction';

const MASTER = 'P5-test-master-password';
const owner = PrivateKey.fromLogin('alice', MASTER, 'owner');
const active = PrivateKey.fromLogin('alice', MASTER, 'active');
const posting = PrivateKey.fromLogin('alice', MASTER, 'posting');
const memo = PrivateKey.fromLogin('alice', MASTER, 'memo');
const pub = (k: PrivateKey) => k.createPublic().toString();

const appAccount = {
  name: 'ecency.app',
  posting_json_metadata: JSON.stringify({
    profile: { name: 'Ecency', redirect_uris: ['https://ecency.com/auth'] },
  }),
};
const alice = (granted = chain.granted) => ({
  name: 'alice',
  owner: {
    weight_threshold: 1,
    account_auths: [],
    key_auths: [[pub(owner), 1]],
  },
  active: {
    weight_threshold: 1,
    account_auths: [],
    key_auths: [[pub(active), 1]],
  },
  posting: {
    weight_threshold: 1,
    account_auths: granted ? [['ecency.app', 1]] : [],
    key_auths: [[pub(posting), 1]],
  },
  memo_key: pub(memo),
  posting_json_metadata: '{}',
  json_metadata: '{}',
});

let client: QueryClient;
function wrap(ui: ReactNode) {
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}
function renderConsent(req: Partial<AuthRequest> = {}) {
  return wrap(
    <AuthorizeConsent
      req={{
        clientId: 'ecency.app',
        redirectUri: 'https://ecency.com/auth',
        scope: 'posting',
        responseType: 'code',
        ...req,
      }}
    />,
  );
}
const passcodeField = () => screen.getByLabelText(i18n.t('accounts.passcode'));

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

beforeEach(() => {
  localStorage.clear();
  _resetKeyCache();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
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
  vi.stubGlobal('location', {
    assign: chain.assign,
    pathname: '/oauth2/authorize',
    search: '?client_id=ecency.app',
    origin: 'https://hivesigner.test',
  });
});

async function protectedAndLocked(keys: { posting?: string; active?: string }) {
  await addAccount('alice', keys, 'correct-passcode');
  lockAccount('alice');
}

describe('leaving the screen while the unlock runs', () => {
  it('grant page: Cancel during the unlock broadcasts nothing', async () => {
    await protectedAndLocked({ active: active.toString() });
    const gate = deferred();
    chain.unlockGate = gate.promise;
    const view = wrap(<GrantAction appName="ecency.app" mode="grant" />);
    const user = userEvent.setup();
    const button = await screen.findByRole('button', { name: /^authorize$/i });
    await user.type(passcodeField(), 'correct-passcode');
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);
    // The unlock is still running; the user presses Cancel and the screen
    // is gone.
    expect(chain.broadcastOperations).not.toHaveBeenCalled();
    view.unmount();
    gate.resolve();
    await waitFor(() => expect(getKeys('alice')?.active).toBeTruthy());
    // Give the continuation every chance to run.
    await new Promise((r) => setTimeout(r, 20));
    expect(chain.broadcastOperations).not.toHaveBeenCalled();
  });

  it('consent (login scope): Cancel during the unlock issues no token', async () => {
    await protectedAndLocked({ posting: posting.toString() });
    const gate = deferred();
    chain.unlockGate = gate.promise;
    const view = renderConsent({ scope: 'login', responseType: 'token' });
    const user = userEvent.setup();
    const button = await screen.findByRole('button', { name: /^sign in$/i });
    await user.type(passcodeField(), 'correct-passcode');
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);
    view.unmount();
    gate.resolve();
    await waitFor(() => expect(getKeys('alice')?.posting).toBeTruthy());
    await new Promise((r) => setTimeout(r, 20));
    expect(chain.assign).not.toHaveBeenCalled();
  });

  it('consent (first-time grant): Cancel during the unlock grants nothing', async () => {
    await protectedAndLocked({
      posting: posting.toString(),
      active: active.toString(),
    });
    const gate = deferred();
    chain.unlockGate = gate.promise;
    const view = renderConsent();
    const user = userEvent.setup();
    const button = await screen.findByRole('button', { name: /^authorize$/i });
    await user.type(passcodeField(), 'correct-passcode');
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);
    view.unmount();
    gate.resolve();
    await waitFor(() => expect(getKeys('alice')?.active).toBeTruthy());
    await new Promise((r) => setTimeout(r, 50));
    expect(chain.broadcastOperations).not.toHaveBeenCalled();
    expect(chain.assign).not.toHaveBeenCalled();
  });
});

describe('an authority that changes while the unlock runs', () => {
  it('grant page: the broadcast keeps what was granted elsewhere meanwhile', async () => {
    await protectedAndLocked({ active: active.toString() });
    // Another app is granted from elsewhere while the passcode is checked.
    let elsewhere = false;
    chain.getAccount.mockImplementation(async (name: string) => {
      if (name !== 'alice') return name === 'ecency.app' ? appAccount : null;
      const account = alice();
      if (elsewhere) account.posting.account_auths = [['other.app', 1]];
      return account;
    });
    const gate = deferred();
    chain.unlockGate = gate.promise;
    wrap(<GrantAction appName="ecency.app" mode="grant" />);
    const user = userEvent.setup();
    const button = await screen.findByRole('button', { name: /^authorize$/i });
    await user.type(passcodeField(), 'correct-passcode');
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);
    elsewhere = true;
    gate.resolve();
    await waitFor(() => expect(chain.broadcastOperations).toHaveBeenCalled());
    const [[op]] = chain.broadcastOperations.mock.calls[0];
    expect(op[1].posting.account_auths).toEqual([
      ['ecency.app', 1],
      ['other.app', 1],
    ]);
  });
});

describe('a screen that said nothing new is granted', () => {
  it('never grants on that click when the fresh read finds the grant gone, and asks again', async () => {
    // Unlocked, no passcode, posting + active on the device.
    await addAccount('alice', {
      posting: posting.toString(),
      active: active.toString(),
    });
    // The cache still holds the account WITH the grant: /authorized-apps
    // shares this key and its refetch after a revoke can read a lagging node,
    // or the grant was revoked from another device while the tab sat open.
    client.setQueryData(accountKey('alice'), alice(true));
    // The chain no longer has the grant; the background read on mount is held
    // until after the click, as a slow node would.
    chain.granted = false;
    const gate = deferred();
    chain.readGate = gate.promise;
    renderConsent();
    const user = userEvent.setup();
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      /sign in to/i,
    );
    expect(screen.getByText(/nothing new is granted/i)).toBeInTheDocument();
    expect(screen.queryByText(/first-time authorization/i)).toBeNull();
    const button = screen.getByRole('button', { name: /^sign in$/i });
    expect(button).toBeEnabled();
    await user.click(button);
    gate.resolve();
    // The refetch lands: the screen must turn into the first-time request
    // and ask again, not grant behind a line that said it would not.
    expect(
      await screen.findByText(/first-time authorization/i),
    ).toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 50));
    expect(chain.broadcastOperations).not.toHaveBeenCalled();
    expect(chain.assign).not.toHaveBeenCalled();
  });
});

describe('the passcode typed to unlock, held for the active key', () => {
  const activeKeyField = () =>
    screen.getByLabelText(
      i18n.t('authorize.active_key_label', { account: '@alice' }),
      { exact: false },
    );
  const addButton = () =>
    screen.getByRole('button', { name: i18n.t('authorize.add_active_key') });

  it('asks for the passcode after all when the record was protected again under another one meanwhile', async () => {
    await protectedAndLocked({ posting: posting.toString() });
    renderConsent();
    const user = userEvent.setup();
    await user.type(
      await screen.findByLabelText(i18n.t('accounts.passcode')),
      'correct-passcode',
    );
    await user.click(screen.getByRole('button', { name: /^authorize$/i }));
    await screen.findByTestId('add-active-key');
    // Another tab removes the account and adds it again under another passcode.
    const persisted = JSON.parse(
      localStorage.getItem('vuex__accounts') ?? '{}',
    );
    persisted.accountsKeychains.alice = {
      password: await writeKeys(
        { posting: posting.toString() },
        'other-passcode',
      ),
    };
    localStorage.setItem('vuex__accounts', JSON.stringify(persisted));
    await user.type(activeKeyField(), active.toString());
    await user.click(addButton());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      i18n.t('authorize.wrong_passcode'),
    );
    // Nothing was written under the held passcode.
    _resetKeyCache();
    await expect(unlockAccount('alice', 'correct-passcode')).rejects.toThrow();
    // And the form now asks for the passcode that does open it.
    const field = screen.getByLabelText(
      i18n.t('authorize.active_key_passcode', { account: '@alice' }),
      { exact: false },
    );
    await user.type(field, 'other-passcode');
    await user.click(addButton());
    // Stored: the form gives way to the action it was blocking.
    await waitFor(() =>
      expect(screen.queryByTestId('add-active-key')).toBeNull(),
    );
    lockAccount('alice');
    expect((await unlockAccount('alice', 'other-passcode')).active).toBe(
      active.toString(),
    );
  }, 30_000);

  it('asks once when a sign-in judged on a cached grant turns into a first-time grant', async () => {
    await protectedAndLocked({ posting: posting.toString() });
    client.setQueryData(accountKey('alice'), alice(true));
    const gate = deferred();
    chain.readGate = gate.promise;
    renderConsent();
    const user = userEvent.setup();
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      /sign in to/i,
    );
    await user.type(passcodeField(), 'correct-passcode');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));
    gate.resolve();
    await screen.findByText(/first-time authorization/i);
    const form = await screen.findByTestId('add-active-key');
    expect(form.querySelector('input[name=unlock-passcode]')).toBeNull();
    expect(chain.broadcastOperations).not.toHaveBeenCalled();
  });
});

describe('another tab selects someone else while the unlock runs', () => {
  const bobPosting = PrivateKey.fromSeed('bob-posting');
  // bob holds the grant already; alice does not.
  const bob = () => ({
    ...alice(true),
    name: 'bob',
    posting: {
      weight_threshold: 1,
      account_auths: [['ecency.app', 1]],
      key_auths: [[pub(bobPosting), 1]],
    },
  });

  async function twoAccountsFreshTab() {
    await addAccount(
      'alice',
      { posting: posting.toString(), active: active.toString() },
      'correct-passcode',
    );
    await addAccount('bob', { posting: bobPosting.toString() }, 'bob-passcode');
    // A tab opened just now: nothing chosen in it yet, both locked.
    _resetKeyCache();
    chain.getAccount.mockImplementation(async (name: string) =>
      name === 'ecency.app'
        ? appAccount
        : name === 'alice'
          ? alice()
          : name === 'bob'
            ? bob()
            : null,
    );
  }
  function otherTabSelects(name: string) {
    const state = JSON.parse(localStorage.getItem('vuex__accounts') ?? '{}');
    state.selectedAccount = name;
    localStorage.setItem('vuex__accounts', JSON.stringify(state));
  }

  it('consent: no grant and no token for the account the screen no longer shows', async () => {
    await twoAccountsFreshTab();
    const gate = deferred();
    chain.unlockGate = gate.promise;
    renderConsent();
    const user = userEvent.setup();
    const button = await screen.findByRole('button', { name: /^authorize$/i });
    await user.type(passcodeField(), 'correct-passcode');
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);
    otherTabSelects('bob');
    gate.resolve();
    await waitFor(() =>
      expect(screen.getByTestId('current-account')).toHaveTextContent('@bob'),
    );
    await new Promise((r) => setTimeout(r, 50));
    expect(chain.broadcastOperations).not.toHaveBeenCalled();
    expect(chain.assign).not.toHaveBeenCalled();
  });

  it('grant page: nothing is built for the new account or signed with the old key', async () => {
    await twoAccountsFreshTab();
    const gate = deferred();
    chain.unlockGate = gate.promise;
    wrap(<GrantAction appName="new.app" mode="grant" />);
    const user = userEvent.setup();
    const button = await screen.findByRole('button', { name: /^authorize$/i });
    await user.type(passcodeField(), 'correct-passcode');
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);
    otherTabSelects('bob');
    gate.resolve();
    await waitFor(() => expect(getKeys('alice')).not.toBeNull());
    await new Promise((r) => setTimeout(r, 50));
    expect(chain.broadcastOperations).not.toHaveBeenCalled();
  });

  it('consent: the held passcode never reaches the other account', async () => {
    await protectedAndLocked({ posting: posting.toString() });
    await addAccount('bob', { posting: bobPosting.toString() }, 'bob-passcode');
    selectAccount('alice');
    chain.getAccount.mockImplementation(async (name: string) =>
      name === 'ecency.app'
        ? appAccount
        : name === 'alice'
          ? alice()
          : name === 'bob'
            ? { ...bob(), posting: { ...bob().posting, account_auths: [] } }
            : null,
    );
    renderConsent();
    const user = userEvent.setup();
    await user.type(
      await screen.findByLabelText(i18n.t('accounts.passcode')),
      'correct-passcode',
    );
    await user.click(screen.getByRole('button', { name: /^authorize$/i }));
    await screen.findByTestId('add-active-key');
    selectAccount('bob');
    await waitFor(() =>
      expect(screen.getByTestId('current-account')).toHaveTextContent('@bob'),
    );
    // bob is unlocked and lacks the active key: the form is his, and asks
    // for his passcode.
    const form = await screen.findByTestId('add-active-key');
    expect(form).toHaveTextContent('@bob');
    expect(form.querySelector('input[name=unlock-passcode]')).not.toBeNull();
  });
});

describe('the read a grant is built from fails', () => {
  // The cached copy lists other.app, since revoked elsewhere. Built from it,
  // the account_update would give other.app its authority back.
  const cachedWithOther = () => ({
    ...alice(false),
    posting: {
      ...alice(false).posting,
      account_auths: [['other.app', 1]],
    },
  });

  it('consent: says so and grants nothing from the cached copy', async () => {
    await addAccount('alice', {
      posting: posting.toString(),
      active: active.toString(),
    });
    client.setQueryData(accountKey('alice'), cachedWithOther());
    chain.getAccount.mockImplementation(async (name: string) => {
      if (name === 'ecency.app') return appAccount;
      throw new Error('node down');
    });
    renderConsent();
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole('button', { name: /^authorize$/i }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      i18n.t('authorize.read_failed'),
    );
    expect(chain.broadcastOperations).not.toHaveBeenCalled();
  });

  it('grant page: says so and grants nothing from the cached copy', async () => {
    await addAccount('alice', { active: active.toString() });
    client.setQueryData(accountKey('alice'), cachedWithOther());
    chain.getAccount.mockImplementation(async () => {
      throw new Error('node down');
    });
    wrap(<GrantAction appName="ecency.app" mode="grant" />);
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole('button', { name: /^authorize$/i }),
    );
    expect(
      await screen.findByText(i18n.t('authorize.read_failed')),
    ).toBeInTheDocument();
    expect(chain.broadcastOperations).not.toHaveBeenCalled();
  });
});

describe('revoking through the unlock', () => {
  it('unlocks and revokes in one click', async () => {
    chain.granted = true;
    await protectedAndLocked({ active: active.toString() });
    wrap(<GrantAction appName="ecency.app" mode="revoke" />);
    const user = userEvent.setup();
    const button = await screen.findByRole('button', { name: /^revoke$/i });
    await user.type(passcodeField(), 'correct-passcode');
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);
    await waitFor(() => expect(chain.broadcastOperations).toHaveBeenCalled());
    const [[op], wif] = chain.broadcastOperations.mock.calls[0];
    expect(op[0]).toBe('account_update');
    expect(op[1].posting.account_auths).toEqual([]);
    expect(wif).toBe(active.toString());
  });
});

describe('a first-time grant on its way to the app', () => {
  it('stays a first-time request once its own grant lands', async () => {
    await addAccount('alice', {
      posting: posting.toString(),
      active: active.toString(),
    });
    renderConsent();
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole('button', { name: /^authorize$/i }),
    );
    await waitFor(() => expect(chain.assign).toHaveBeenCalledTimes(1));
    // The fresh read after the grant shows it, but this screen granted it:
    // it must not turn into "nothing new is granted" on the way out.
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /requesting access/i,
    );
    expect(screen.queryByText(/nothing new is granted/i)).toBeNull();
  });
});
