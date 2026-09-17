import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';

// Which key a consent or grant screen needs, and what happens when the
// account on this device lacks it (#135). Unlike AuthorizeConsent.test, the
// account store, the credential check and the token are all REAL here: the
// point is that a key added in place reaches storage, re-renders the screen
// and is the key that signs. Only the chain is faked.
vi.mock('@tanstack/react-router', async () =>
  (await import('../test-router-mock')).routerMock(),
);
const chain = vi.hoisted(() => ({
  granted: false,
  getAccount: vi.fn(),
  broadcastOperations: vi.fn(),
  assign: vi.fn(),
}));
vi.mock('@/lib/hive', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/hive')>()),
  getAccount: chain.getAccount,
}));
vi.mock('@/lib/sign-tx', () => ({
  broadcastOperations: chain.broadcastOperations,
}));
vi.mock('@/lib/grant', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/grant')>()),
  // The real one sleeps 2s between chain reads.
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
  accountIsEncrypted,
  addAccount,
  getKeys,
  lockAccount,
  unlockAccount,
} from '@/lib/accounts';
import { decodeToken } from '@/lib/message-token';
import type { AuthRequest } from '@/lib/oauth';
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
const alice = () => ({
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
    account_auths: chain.granted ? [['ecency.app', 1]] : [],
    key_auths: [[pub(posting), 1]],
  },
  memo_key: pub(memo),
  posting_json_metadata: '{}',
});

function wrap(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
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

const keyField = () =>
  // The label also wraps the hint, so its text is longer than the name.
  screen.getByLabelText(
    i18n.t('authorize.active_key_label', { account: 'alice' }),
    { exact: false },
  );
const addButton = () =>
  screen.getByRole('button', { name: i18n.t('authorize.add_active_key') });

beforeEach(() => {
  localStorage.clear();
  _resetKeyCache();
  chain.granted = false;
  chain.getAccount.mockReset();
  chain.getAccount.mockImplementation(async (name: string) =>
    name === 'ecency.app' ? appAccount : name === 'alice' ? alice() : null,
  );
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

function issuedToken() {
  const url = new URL(chain.assign.mock.calls[0][0]);
  return decodeToken(url.searchParams.get('code') ?? '');
}

describe('consent with only an active key on this device', () => {
  it('logs in to an app that already holds the grant, signing the token with the active key', async () => {
    chain.granted = true;
    await addAccount('alice', { active: active.toString() });
    renderConsent();
    const button = await screen.findByRole('button', { name: /authorize/i });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.setup().click(button);
    await waitFor(() => expect(chain.assign).toHaveBeenCalledTimes(1));
    const token = issuedToken();
    expect(token?.signer).toBe(pub(active));
    expect(token?.payload.authority).toBe('active');
    expect(chain.broadcastOperations).not.toHaveBeenCalled();
  });

  it('grants a new app with the active key and issues the token', async () => {
    await addAccount('alice', { active: active.toString() });
    renderConsent();
    const button = await screen.findByRole('button', { name: /authorize/i });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.setup().click(button);
    await waitFor(() => expect(chain.assign).toHaveBeenCalledTimes(1));
    expect(chain.broadcastOperations).toHaveBeenCalledWith(
      [expect.arrayContaining(['account_update'])],
      active.toString(),
      'alice',
    );
    expect(issuedToken()?.signer).toBe(pub(active));
  });
});

describe('consent with only a posting key on this device', () => {
  it('logs in to an app that already holds the grant with the posting key, asking for nothing', async () => {
    chain.granted = true;
    await addAccount('alice', { posting: posting.toString() });
    renderConsent();
    const button = await screen.findByRole('button', { name: /authorize/i });
    await waitFor(() => expect(button).toBeEnabled());
    expect(screen.queryByTestId('add-active-key')).toBeNull();
    await userEvent.setup().click(button);
    await waitFor(() => expect(chain.assign).toHaveBeenCalledTimes(1));
    expect(issuedToken()?.signer).toBe(pub(posting));
  });

  it('asks for the active key in place for a first-time grant, then grants with it and signs the token with posting', async () => {
    await addAccount('alice', { posting: posting.toString() });
    renderConsent();
    const user = userEvent.setup();
    await screen.findByTestId('add-active-key');
    // No Authorize to press yet: it would only fail.
    expect(screen.queryByRole('button', { name: /^authorize$/i })).toBeNull();
    expect(screen.getByText(/first-time authorization/i)).toBeInTheDocument();

    // The posting key is not the active key: refused, nothing stored.
    await user.type(keyField(), posting.toString());
    await user.click(addButton());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      i18n.t('authorize.not_active_key', { account: 'alice' }),
    );
    expect(getKeys('alice')?.active).toBeUndefined();

    await user.clear(keyField());
    await user.type(keyField(), active.toString());
    await user.click(addButton());
    await screen.findByRole('button', { name: /^authorize$/i });
    expect(screen.queryByTestId('add-active-key')).toBeNull();
    // Stored, not just held for this render: it survives a lock and unlock.
    lockAccount('alice');
    expect((await unlockAccount('alice')).active).toBe(active.toString());

    // The lock re-rendered the screen, so look the button up again.
    await user.click(
      await screen.findByRole('button', { name: /^authorize$/i }),
    );
    await waitFor(() => expect(chain.assign).toHaveBeenCalledTimes(1));
    expect(chain.broadcastOperations).toHaveBeenCalledTimes(1);
    expect(chain.broadcastOperations.mock.calls[0][1]).toBe(active.toString());
    expect(issuedToken()?.signer).toBe(pub(posting));
  });

  it('takes a master password but keeps only the active and posting keys from it', async () => {
    await addAccount('alice', { posting: posting.toString() });
    renderConsent();
    const user = userEvent.setup();
    await screen.findByTestId('add-active-key');
    await user.type(keyField(), MASTER);
    await user.click(addButton());
    await screen.findByRole('button', { name: /^authorize$/i });
    const keys = getKeys('alice');
    expect(keys?.active).toBe(active.toString());
    expect(keys?.posting).toBe(posting.toString());
    expect(keys?.owner).toBeUndefined();
  });

  it('asks for the passcode of a protected account and keeps it protected', async () => {
    await addAccount('alice', { posting: posting.toString() }, 'pass1234');
    renderConsent();
    const user = userEvent.setup();
    await screen.findByTestId('add-active-key');
    const passcode = screen.getByLabelText(
      i18n.t('authorize.active_key_passcode', { account: 'alice' }),
      { exact: false },
    );
    // Password managers are told to leave both fields alone (#136).
    expect(passcode).toHaveAttribute('data-1p-ignore');
    expect(keyField()).toHaveAttribute('autocomplete', 'off');

    await user.type(keyField(), active.toString());
    await user.type(passcode, 'wrong-one');
    await user.click(addButton());
    expect(
      await screen.findByRole('alert', {}, { timeout: 10_000 }),
    ).toHaveTextContent(i18n.t('authorize.wrong_passcode'));
    expect(getKeys('alice')?.active).toBeUndefined();

    await user.clear(passcode);
    await user.type(passcode, 'pass1234');
    await user.click(addButton());
    await screen.findByRole(
      'button',
      { name: /^authorize$/i },
      { timeout: 10_000 },
    );
    expect(accountIsEncrypted('alice')).toBe(true);
    lockAccount('alice');
    const reread = await unlockAccount('alice', 'pass1234');
    expect(reread.active).toBe(active.toString());
    expect(reread.posting).toBe(posting.toString());
  }, 30_000);

  it('does not ask for a key on behalf of a callback the app never registered', async () => {
    await addAccount('alice', { posting: posting.toString() });
    renderConsent({ redirectUri: 'https://evil.example/auth' });
    const button = await screen.findByRole('button', { name: /^authorize$/i });
    expect(button).toBeDisabled();
    expect(screen.queryByTestId('add-active-key')).toBeNull();
  });
});

describe('consent with neither posting nor active on this device', () => {
  it('sends the user to add one, carrying the request along', async () => {
    chain.granted = true;
    await addAccount('alice', { memo: memo.toString() });
    renderConsent();
    const link = await screen.findByRole('link', {
      name: i18n.t('authorize.add_key_to_continue', { account: 'alice' }),
    });
    expect(link).toHaveAttribute('href', '/import');
    expect(link.getAttribute('data-search')).toContain('/oauth2/authorize');
  });
});

describe('the grant page with only a posting key on this device', () => {
  it('continues when the app already holds the grant, rather than asking to unlock', async () => {
    chain.granted = true;
    await addAccount('alice', { posting: posting.toString() });
    wrap(<GrantAction appName="ecency.app" mode="grant" query={{}} />);
    expect(
      await screen.findByRole('link', { name: /continue/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /unlock/i })).toBeNull();
  });

  it('asks for the active key in place, then grants with it', async () => {
    await addAccount('alice', { posting: posting.toString() });
    wrap(<GrantAction appName="ecency.app" mode="grant" query={{}} />);
    const user = userEvent.setup();
    await screen.findByTestId('add-active-key');
    expect(screen.queryByRole('link', { name: /unlock/i })).toBeNull();
    await user.type(keyField(), active.toString());
    await user.click(addButton());
    await user.click(
      await screen.findByRole('button', { name: /^authorize$/i }),
    );
    await waitFor(() =>
      expect(chain.broadcastOperations).toHaveBeenCalledTimes(1),
    );
    expect(chain.broadcastOperations.mock.calls[0][1]).toBe(active.toString());
  });
});
