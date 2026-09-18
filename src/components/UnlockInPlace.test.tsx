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
