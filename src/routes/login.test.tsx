import { render, screen, waitFor } from '@testing-library/react';
import type { ComponentType } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';

// /login served TWO flows in the Nuxt app and both are contract: app consent
// (client_id + redirect_uri) issues a token, while a bare /login or
// `?redirect=/profile` is a LOCAL login-and-return needing no app registration.
const h = vi.hoisted(() => ({
  search: {} as Record<string, string>,
  accounts: {
    usernames: [] as string[],
    selectedAccount: null as string | null,
    unlocked: [] as string[],
  },
  navigate: vi.fn(),
  consent: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: unknown) => ({
    ...(opts as object),
    useSearch: () => h.search,
  }),
  Link: ({ children, to, search }: Record<string, unknown>) => (
    <a
      href={`${String(to)}${search ? `?next=${String((search as { next?: string }).next)}` : ''}`}
    >
      {children as never}
    </a>
  ),
  useNavigate: () => h.navigate,
  useRouter: () => ({
    state: { location: { pathname: '/login', searchStr: '' } },
    subscribe: () => () => {},
  }),
}));
vi.mock('@/lib/use-accounts', () => ({ useAccounts: () => h.accounts }));
// The consent screen is covered by its own tests; here we only care WHICH flow
// /login picks.
vi.mock('@/components/AuthorizeConsent', () => ({
  AuthorizeConsent: (props: unknown) => {
    h.consent(props);
    return <div>CONSENT SCREEN</div>;
  },
}));

import { Route } from './login';

const Login = (Route as unknown as { component: ComponentType }).component;

beforeEach(() => {
  h.search = {};
  h.accounts = { usernames: [], selectedAccount: null, unlocked: [] };
  h.navigate.mockReset();
  h.consent.mockReset();
  vi.stubGlobal('location', { origin: 'https://signer.example' });
});

describe('/login flow selection', () => {
  it('a bare /login is the LOCAL flow, not app consent', () => {
    render(<Login />);
    expect(h.consent).not.toHaveBeenCalled();
    expect(screen.queryByText('CONSENT SCREEN')).toBeNull();
  });

  it('?redirect=/profile is LOCAL and needs no app registration', () => {
    h.search = { redirect: '/profile' };
    h.accounts = {
      usernames: ['alice'],
      selectedAccount: 'alice',
      unlocked: [],
    };
    render(<Login />);
    expect(h.consent).not.toHaveBeenCalled();
    // It names the target, the account, and unlocks right here (#145).
    expect(screen.getByText(/\/profile/)).toBeInTheDocument();
    expect(screen.getByTestId('current-account')).toHaveTextContent('@alice');
    expect(
      screen.getByRole('button', { name: /^sign in$/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^unlock$/i })).toBeNull();
  });

  it('navigates straight to the target when an account is already unlocked', async () => {
    h.search = { redirect: '/profile' };
    h.accounts = {
      usernames: ['alice'],
      selectedAccount: 'alice',
      unlocked: ['alice'],
    };
    render(<Login />);
    await waitFor(() =>
      expect(h.navigate).toHaveBeenCalledWith({
        to: '/profile',
        search: {},
        replace: true,
      }),
    );
  });

  it('a bare /login with an unlocked account goes home', async () => {
    h.accounts = {
      usernames: ['alice'],
      selectedAccount: 'alice',
      unlocked: ['alice'],
    };
    render(<Login />);
    await waitFor(() =>
      expect(h.navigate).toHaveBeenCalledWith({
        to: '/',
        search: {},
        replace: true,
      }),
    );
  });

  it("keeps the target's own query when it moves on", async () => {
    h.search = { redirect: '/profile?tab=keys' };
    h.accounts = {
      usernames: ['alice'],
      selectedAccount: 'alice',
      unlocked: ['alice'],
    };
    render(<Login />);
    await waitFor(() =>
      expect(h.navigate).toHaveBeenCalledWith({
        to: '/profile',
        search: { tab: 'keys' },
        replace: true,
      }),
    );
  });

  it('with accounts but none chosen, links to choose one as "Log in"', () => {
    h.search = { redirect: '/profile' };
    h.accounts = {
      usernames: ['alice', 'bob'],
      selectedAccount: null,
      unlocked: [],
    };
    render(<Login />);
    // The account list only picks now; the passcode is asked back here.
    const link = screen.getByRole('link', { name: i18n.t('footer.login') });
    expect(link.getAttribute('href')).toMatch(/^\/accounts\?next=\/profile/);
    expect(screen.queryByRole('link', { name: /^unlock$/i })).toBeNull();
  });

  it('discards an off-site redirect instead of following it', async () => {
    h.search = { redirect: '/\\evil.example/x' };
    h.accounts = {
      usernames: ['alice'],
      selectedAccount: 'alice',
      unlocked: ['alice'],
    };
    render(<Login />);
    await waitFor(() => expect(h.navigate).toHaveBeenCalled());
    expect(h.navigate).toHaveBeenCalledWith({
      to: '/',
      search: {},
      replace: true,
    });
  });

  it('client_id + redirect_uri is APP CONSENT', () => {
    h.search = {
      client_id: 'theapp',
      redirect_uri: 'https://app.example/cb',
      scope: 'posting',
    };
    render(<Login />);
    expect(screen.getByText('CONSENT SCREEN')).toBeInTheDocument();
    expect(h.consent).toHaveBeenCalledWith(
      expect.objectContaining({
        req: expect.objectContaining({
          clientId: 'theapp',
          redirectUri: 'https://app.example/cb',
          scope: 'posting',
        }),
      }),
    );
  });

  it('an absolute redirect= is a callback, so it stays app consent', () => {
    h.search = { clientId: 'theapp', redirect: 'https://app.example/cb' };
    render(<Login />);
    expect(screen.getByText('CONSENT SCREEN')).toBeInTheDocument();
    expect(h.consent.mock.calls[0][0].req.redirectUri).toBe(
      'https://app.example/cb',
    );
  });

  it('a redirect= pointing at /login-request is the OAuth detour, not local', () => {
    h.search = { redirect: '/login-request/theapp?scope=posting' };
    render(<Login />);
    expect(screen.getByText('CONSENT SCREEN')).toBeInTheDocument();
  });
});

describe('/login nested legacy request', () => {
  it('unpacks a redirect that carries the real request inside it', async () => {
    // login.vue built hive://login-request/<clientId>?<query> and carried it as
    // `redirect` through the grant detour, so the client id is in that PATH and
    // the callback and scope are in its query. Without unpacking, consent got an
    // empty AuthRequest and authorization could not complete.
    h.search = {
      redirect:
        '/login-request/theapp?scope=posting&redirect_uri=https://app.example/cb&state=xyz',
    };
    render(<Login />);
    expect(screen.getByText('CONSENT SCREEN')).toBeInTheDocument();
    const req = h.consent.mock.calls[0][0].req;
    expect(req.clientId).toBe('theapp');
    expect(req.redirectUri).toBe('https://app.example/cb');
    expect(req.scope).toBe('posting');
    expect(req.state).toBe('xyz');
  });

  it('lets an outer param override the nested copy', async () => {
    h.search = {
      redirect: '/login-request/theapp?redirect_uri=https://stale.example/cb',
      redirect_uri: 'https://live.example/cb',
    };
    render(<Login />);
    expect(h.consent.mock.calls[0][0].req.redirectUri).toBe(
      'https://live.example/cb',
    );
  });
});
