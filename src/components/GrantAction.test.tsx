import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '../i18n';

// The legacy grant detour: production still sends people to
// `/authorize/<app>?redirect_uri=/login-request/...`. Once the app holds the
// grant, Continue must carry them back into that login, not to the account
// list, or the sign-in they started is lost.
const navigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    search,
  }: {
    children: unknown;
    to: string;
    search?: Record<string, string>;
  }) => (
    <a href={to} data-search={JSON.stringify(search ?? {})}>
      {children as never}
    </a>
  ),
  useNavigate: () => navigate,
  useRouter: () => ({
    state: { location: { pathname: '/', searchStr: '' } },
    subscribe: () => () => {},
  }),
}));
vi.mock('@/lib/use-accounts', () => ({
  useAccounts: () => ({
    selectedAccount: 'alice',
    unlocked: ['alice'],
    usernames: ['alice'],
  }),
}));
vi.mock('@/lib/accounts', () => ({
  getKeys: () => ({ active: '5JactiveKey', posting: '5JpostingKey' }),
  stillSelected: (name: string) => name === 'alice',
}));
vi.mock('@/lib/hive', () => ({
  getAccount: async () => ({
    name: 'alice',
    posting: {
      weight_threshold: 1,
      account_auths: [['ecency.app', 1]],
      key_auths: [],
    },
    active: { weight_threshold: 1, account_auths: [], key_auths: [] },
    posting_json_metadata: '{}',
  }),
}));
vi.mock('@/components/AppProfile', () => ({ AppProfile: () => null }));

import { GrantAction } from './GrantAction';

const detour =
  '/login-request/ecency.app?client_id=ecency.app&redirect_uri=https%3A%2F%2Fecency.com%2Fauth&response_type=code&scope=posting';

function renderWith(
  query: Record<string, string>,
  mode: 'grant' | 'revoke' = 'grant',
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <GrantAction appName="ecency.app" mode={mode} query={query} />
    </QueryClientProvider>,
  );
}

describe('GrantAction with a callback', () => {
  it('continues into the login request the user came from once the grant exists', async () => {
    renderWith({ redirect_uri: detour });
    const link = await screen.findByRole('link', { name: /continue/i });
    expect(link).toHaveAttribute('href', '/login');
    expect(JSON.parse(link.getAttribute('data-search') ?? '{}')).toEqual({
      redirect: detour,
    });
  });

  it('continues to the account list when there is no callback', async () => {
    renderWith({});
    const link = await screen.findByRole('link', { name: /continue/i });
    expect(link).toHaveAttribute('href', '/accounts');
  });

  // A revoke that carried the same callback would otherwise land on a posting
  // consent for the app just revoked, whose approval re-grants it.
  it('ignores a callback on revoke and goes to the authorized apps list', async () => {
    renderWith({ redirect_uri: detour }, 'revoke');
    const cancel = await screen.findByRole('link', { name: /cancel/i });
    expect(cancel).toHaveAttribute('href', '/authorized-apps');
    for (const a of screen.getAllByRole('link')) {
      expect(a).not.toHaveAttribute('href', '/login');
    }
  });
});
