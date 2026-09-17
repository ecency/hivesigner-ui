import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';

// The consent screen on its own, with a real query client and real token
// building, so the screen is tested through what a visitor sees and what the
// app receives. The OAuth and login ROUTE tests cover the flows around it
// (cancellation latch, grant-before-token ordering); this pins the screen.
vi.mock('@tanstack/react-router', async () =>
  (await import('../test-router-mock')).routerMock(),
);
const h = vi.hoisted(() => ({
  accounts: {
    selectedAccount: 'alice',
    unlocked: ['alice'],
    usernames: ['alice'],
  },
  keys: { posting: '', active: '' } as Record<string, string>,
  getAccount: vi.fn(),
  broadcastOperations: vi.fn(),
  assign: vi.fn(),
}));
vi.mock('@/lib/use-accounts', () => ({ useAccounts: () => h.accounts }));
vi.mock('@/lib/accounts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/accounts')>()),
  getKeys: () => h.keys,
}));
vi.mock('@/lib/hive', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/hive')>()),
  getAccount: h.getAccount,
}));
vi.mock('@/lib/sign-tx', () => ({
  broadcastOperations: h.broadcastOperations,
}));

const sig = vi.hoisted(() => ({ report: vi.fn() }));
vi.mock('@/lib/integration-signal', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/integration-signal')>()),
  reportIntegrationIssue: sig.report,
}));
vi.mock('@sentry/browser', () => ({
  captureFeedback: vi.fn(),
  getClient: () => undefined,
}));

import { PrivateKey } from '@ecency/sdk/hive';
import { decodeToken } from '@/lib/message-token';
import type { AuthRequest } from '@/lib/oauth';
import { AuthorizeConsent } from './AuthorizeConsent';

const posting = PrivateKey.fromSeed('consent-test-posting');

const appAccount = {
  name: 'ecency.app',
  posting_json_metadata: JSON.stringify({
    profile: { name: 'Ecency', redirect_uris: ['https://ecency.com/auth'] },
  }),
};
const userAccount = (grants: string[]) => ({
  name: 'alice',
  posting: {
    weight_threshold: 1,
    account_auths: grants.map((g) => [g, 1]),
    key_auths: [[posting.createPublic().toString(), 1]],
  },
  active: { weight_threshold: 1, account_auths: [], key_auths: [] },
  posting_json_metadata: '{}',
});

function renderConsent(req: Partial<AuthRequest>) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const full: AuthRequest = {
    clientId: 'ecency.app',
    redirectUri: 'https://ecency.com/auth',
    scope: 'posting',
    responseType: 'code',
    ...req,
  };
  return render(
    <QueryClientProvider client={client}>
      <AuthorizeConsent req={full} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  h.keys = { posting: posting.toString(), active: '' };
  h.getAccount.mockReset();
  h.broadcastOperations.mockReset();
  h.assign.mockReset();
  vi.stubGlobal('location', {
    assign: h.assign,
    pathname: '/oauth2/authorize',
    search: '',
    origin: 'https://hivesigner.test',
  });
  h.getAccount.mockImplementation(async (name: string) =>
    name === 'ecency.app' ? appAccount : userAccount(['ecency.app']),
  );
});

describe('AuthorizeConsent', () => {
  it('names the app, its account and the callback host, and lists what posting authority allows as one grant', async () => {
    renderConsent({});
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      /Ecency/,
    );
    expect(screen.getByText('@ecency.app')).toBeInTheDocument();
    expect(screen.getByText('ecency.com')).toBeInTheDocument();
    expect(
      screen.getByText(
        i18n.t('index.preview_with_posting', { app: 'ecency.app' }),
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(
      screen.getByText(i18n.t('index.preview_one_grant')),
    ).toBeInTheDocument();
    // The account the token will be issued for is named, so a wrong selection is visible.
    expect(screen.getByTestId('current-account')).toHaveTextContent('@alice');
  });

  it('describes a login-only request as exactly that, with no abilities list', async () => {
    renderConsent({ scope: 'login', responseType: 'token' });
    expect(
      await screen.findByText(i18n.t('authorize.scope_login')),
    ).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('refuses a callback the app has not registered, disables approval, and reports app and host only', async () => {
    sig.report.mockReset();
    renderConsent({ redirectUri: 'https://evil.example/auth?state=SECRET' });
    expect(
      await screen.findByText(i18n.t('authorize.redirect_not_registered')),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(sig.report).toHaveBeenCalledWith('redirect_not_registered', {
        app: 'ecency.app',
        callback_host: 'evil.example',
      }),
    );
    expect(JSON.stringify(sig.report.mock.calls)).not.toContain('SECRET');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /authorize/i })).toBeDisabled(),
    );
  });

  it('issues a code the app can verify and sends the user to the registered callback', async () => {
    renderConsent({ state: 'xyz' });
    const button = await screen.findByRole('button', { name: /authorize/i });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.setup().click(button);
    await waitFor(() => expect(h.assign).toHaveBeenCalledTimes(1));
    const url = new URL(h.assign.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe('https://ecency.com/auth');
    expect(url.searchParams.get('state')).toBe('xyz');
    expect(url.searchParams.get('username')).toBe('alice');
    const decoded = decodeToken(url.searchParams.get('code') ?? '');
    expect(decoded?.payload.authors).toEqual(['alice']);
    expect(decoded?.payload.signed_message).toMatchObject({
      type: 'code',
      app: 'ecency.app',
    });
    expect(decoded?.signer).toBe(posting.createPublic().toString());
    // The grant already existed, so nothing was broadcast.
    expect(h.broadcastOperations).not.toHaveBeenCalled();
  });

  it('warns that a first-time posting authorization needs the active key once', async () => {
    h.getAccount.mockImplementation(async (name: string) =>
      name === 'ecency.app' ? appAccount : userAccount([]),
    );
    renderConsent({});
    expect(
      await screen.findByText(/first-time authorization/i),
    ).toHaveTextContent(/active key once/i);
    // With no active key on the device, it is asked for right there.
    expect(screen.getByTestId('add-active-key')).toBeInTheDocument();
  });

  it('confirms the username for a site with no app account: a bare login token to its callback', async () => {
    h.getAccount.mockImplementation(async () => userAccount([]));
    renderConsent({
      clientId: undefined,
      redirectUri: 'https://hivesearcher.example/cb',
      scope: 'posting', // named, but with no app it can only be a login
      responseType: 'token',
      state: 's1',
    });
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      /hivesearcher\.example/,
    );
    expect(
      screen.getByText(i18n.t('authorize.scope_login')),
    ).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    const button = await screen.findByRole('button', { name: /authorize/i });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.setup().click(button);
    await waitFor(() => expect(h.assign).toHaveBeenCalledTimes(1));
    const url = new URL(h.assign.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe('https://hivesearcher.example/cb');
    expect(url.searchParams.get('username')).toBe('alice');
    expect(url.searchParams.get('state')).toBe('s1');
    const decoded = decodeToken(url.searchParams.get('access_token') ?? '');
    expect(decoded?.payload.signed_message).toEqual({ type: 'login' });
    expect(decoded?.signer).toBe(posting.createPublic().toString());
    expect(h.broadcastOperations).not.toHaveBeenCalled();
  });

  it('answers a no-app request with a login token as access_token even when a code was asked for', async () => {
    h.getAccount.mockImplementation(async () => userAccount([]));
    renderConsent({
      clientId: undefined,
      redirectUri: 'https://hivesearcher.example/cb',
      scope: 'login,offline',
      responseType: 'code',
    });
    const button = await screen.findByRole('button', { name: /authorize/i });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.setup().click(button);
    await waitFor(() => expect(h.assign).toHaveBeenCalledTimes(1));
    const url = new URL(h.assign.mock.calls[0][0]);
    expect(url.searchParams.get('code')).toBeNull();
    const decoded = decodeToken(url.searchParams.get('access_token') ?? '');
    expect(decoded?.payload.signed_message).toEqual({ type: 'login' });
  });

  it('refuses a callback that is not a web URL, with its own message and signal', async () => {
    sig.report.mockReset();
    renderConsent({
      clientId: undefined,
      redirectUri: 'javascript:alert(1)',
      scope: 'login',
    });
    expect(
      await screen.findByText(i18n.t('authorize.callback_invalid')),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(i18n.t('authorize.callback_insecure')),
    ).toBeNull();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /authorize/i })).toBeDisabled(),
    );
    expect(sig.report).toHaveBeenCalledWith('callback_invalid', {});
  });

  it('refuses a plain-http callback for a site with no app account', async () => {
    sig.report.mockReset();
    renderConsent({
      clientId: undefined,
      redirectUri: 'http://hivesearcher.example/cb',
      scope: 'login',
    });
    expect(
      await screen.findByText(i18n.t('authorize.callback_insecure')),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /authorize/i })).toBeDisabled(),
    );
    expect(sig.report).toHaveBeenCalledWith('callback_insecure', {
      callback_host: 'hivesearcher.example',
    });
  });

  it('refuses a request that names no callback', async () => {
    renderConsent({ clientId: undefined, redirectUri: undefined });
    expect(await screen.findByRole('alert')).toHaveTextContent(/incomplete/i);
    // Nothing to approve; the only control is the user's Report button.
    expect(screen.queryByRole('button', { name: /authorize/i })).toBeNull();
    expect(screen.getByRole('button', { name: /report/i })).toBeInTheDocument();
  });

  it('shows the selected account with its avatar and a way to switch, keeping the request', async () => {
    h.getAccount.mockImplementation(async (name: string) =>
      name === 'ecency.app' ? appAccount : userAccount(['ecency.app']),
    );
    renderConsent({});
    const chip = await screen.findByTestId('current-account');
    expect(chip).toHaveTextContent(/authorizing as/i);
    expect(chip).toHaveTextContent('@alice');
    expect(chip.querySelector('img')).toHaveAttribute(
      'src',
      expect.stringContaining('/u/alice/avatar/'),
    );
    const link = screen.getByRole('link', { name: /switch/i });
    expect(link).toHaveAttribute('href', '/accounts');
    expect(link.getAttribute('data-search')).toContain('/oauth2/authorize');
  });

  it('shows the account even while it is locked, so the unlock button names the right one', async () => {
    h.accounts = {
      selectedAccount: 'alice',
      unlocked: [],
      usernames: ['alice'],
    };
    renderConsent({});
    expect(await screen.findByTestId('current-account')).toHaveTextContent(
      '@alice',
    );
    expect(screen.getByRole('link', { name: /unlock/i })).toBeInTheDocument();
    h.accounts = {
      selectedAccount: 'alice',
      unlocked: ['alice'],
      usernames: ['alice'],
    };
  });

  it('sends a visitor without an account to import, carrying the request along', async () => {
    h.accounts = { selectedAccount: '', unlocked: [], usernames: [] } as never;
    renderConsent({});
    const link = await screen.findByRole('link', { name: /continue/i });
    expect(link).toHaveAttribute('href', '/import');
    expect(link.getAttribute('data-search')).toContain('/oauth2/authorize');
    // No account, nothing to name.
    expect(screen.queryByTestId('current-account')).toBeNull();
    h.accounts = {
      selectedAccount: 'alice',
      unlocked: ['alice'],
      usernames: ['alice'],
    };
  });
});
