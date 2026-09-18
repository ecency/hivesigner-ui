import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// The app names the account it expects in the login URL (the SDK's
// getLoginURL(state, account), #83). The REAL router and route tree: the
// param is read before the screen renders and taken out of the URL.
vi.mock('@/lib/hive', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/hive')>()),
  getAccount: async () => null,
  getProfiles: async () => ({}),
}));
vi.mock('@/components/AppProfile', () => ({ AppProfile: () => null }));

import {
  _resetKeyCache,
  addAccount,
  getState,
  selectAccount,
} from '@/lib/accounts';
import { parseSearch, stringifySearch } from '@/lib/search';
import { routeTree } from '../routeTree.gen';

function renderApp(url: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [url] }),
    pathParamsAllowedCharacters: ['@'],
    parseSearch,
    stringifySearch,
  });
  render(
    <StrictMode>
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
  return router;
}

const request = (extra: Record<string, string>) =>
  `/oauth2/authorize?${new URLSearchParams({
    client_id: 'app',
    redirect_uri: 'https://app.example/cb',
    scope: 'login',
    state: 's1',
    ...extra,
  })}`;

beforeEach(async () => {
  localStorage.clear();
  _resetKeyCache();
  vi.stubGlobal('scrollTo', vi.fn());
  await addAccount('alice', { posting: '5Kalice' });
  await addAccount('bob', { posting: '5Kbob' });
  selectAccount('alice');
});

describe('/oauth2/authorize?account=', () => {
  it('chooses the named account and takes the param out of the URL', async () => {
    const router = renderApp(request({ account: 'bob' }));
    expect(await screen.findByText('@bob')).toBeInTheDocument();
    expect(getState().selectedAccount).toBe('bob');
    await waitFor(() =>
      expect(router.state.location.search).toEqual({
        client_id: 'app',
        redirect_uri: 'https://app.example/cb',
        scope: 'login',
        state: 's1',
      }),
    );
  });

  it('finds "@Bob" as bob', async () => {
    renderApp(request({ account: '@Bob ' }));
    expect(await screen.findByText('@bob')).toBeInTheDocument();
    expect(getState().selectedAccount).toBe('bob');
  });

  it('reads select_account, the name in the SDK README, as well', async () => {
    const router = renderApp(request({ select_account: 'bob' }));
    expect(await screen.findByText('@bob')).toBeInTheDocument();
    await waitFor(() =>
      expect(router.state.location.search).not.toHaveProperty('select_account'),
    );
  });

  it('reads select_account when account is empty', async () => {
    renderApp(request({ account: '', select_account: 'bob' }));
    expect(await screen.findByText('@bob')).toBeInTheDocument();
    expect(getState().selectedAccount).toBe('bob');
  });

  it('keeps the choice for an account that is not on this device', async () => {
    const router = renderApp(request({ account: 'carol' }));
    expect(await screen.findByText('@alice')).toBeInTheDocument();
    expect(getState().selectedAccount).toBe('alice');
    await waitFor(() =>
      expect(router.state.location.search).not.toHaveProperty('account'),
    );
  });

  it('ignores a name the device only has as an Object member', async () => {
    for (const account of ['constructor', '__proto__', 'toString']) {
      const router = renderApp(request({ account }));
      expect(await screen.findByText('@alice')).toBeInTheDocument();
      await waitFor(() =>
        expect(router.state.location.search).not.toHaveProperty('account'),
      );
      expect(getState().selectedAccount).toBe('alice');
      expect(
        JSON.parse(localStorage.getItem('vuex__accounts') as string)
          .selectedAccount,
      ).toBe('alice');
      cleanup();
    }
  });

  it("a return to the request keeps the user's own pick", async () => {
    const router = renderApp(request({ account: 'bob' }));
    expect(await screen.findByText('@bob')).toBeInTheDocument();
    // Picked on the account list, then back to the request by its URL, as
    // the list's `next` does.
    const back = router.state.location.href;
    await act(() => router.navigate({ to: '/accounts' }));
    act(() => selectAccount('alice'));
    await act(() => router.navigate({ href: back }));
    expect(await screen.findByText('@alice')).toBeInTheDocument();
    expect(getState().selectedAccount).toBe('alice');
  });
});
