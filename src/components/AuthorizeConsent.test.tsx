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
vi.mock('@/lib/accounts', () => ({ getKeys: () => h.keys }));
vi.mock('@/lib/hive', () => ({ getAccount: h.getAccount }));
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
    expect(screen.getByText(/authorizing as/i)).toHaveTextContent('@alice');
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
  });

  it('refuses a request that names no app or no callback', async () => {
    renderConsent({ clientId: undefined });
    expect(await screen.findByRole('alert')).toHaveTextContent(/incomplete/i);
    // Nothing to approve; the only control is the user's Report button.
    expect(screen.queryByRole('button', { name: /authorize/i })).toBeNull();
    expect(screen.getByRole('button', { name: /report/i })).toBeInTheDocument();
    const { unmount } = renderConsent({ redirectUri: undefined });
    expect((await screen.findAllByRole('alert')).length).toBeGreaterThan(0);
    unmount();
  });

  it('sends a visitor without an account to import, carrying the request along', async () => {
    h.accounts = { selectedAccount: '', unlocked: [], usernames: [] } as never;
    renderConsent({});
    const link = await screen.findByRole('link', { name: /continue/i });
    expect(link).toHaveAttribute('href', '/import');
    expect(link.getAttribute('data-search')).toContain('/oauth2/authorize');
    h.accounts = {
      selectedAccount: 'alice',
      unlocked: ['alice'],
      usernames: ['alice'],
    };
  });
});
