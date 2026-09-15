import { render } from '@testing-library/react';
import type { ComponentType } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// /login-request/* is part of the published contract (the hivesigner SDK builds
// `hive://login-request/<clientId>?...`), so what it forwards to /login matters.
const h = vi.hoisted(() => ({
  splat: '' as string | undefined,
  search: {} as Record<string, string>,
  nav: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: unknown) => ({
    ...(opts as object),
    useParams: () => ({ _splat: h.splat }),
    useSearch: () => h.search,
  }),
  Navigate: (props: unknown) => {
    h.nav(props);
    return null;
  },
}));

import { Route } from './login-request.$';

const LoginRequest = (Route as unknown as { component: ComponentType })
  .component;

beforeEach(() => {
  h.splat = '';
  h.search = {};
  h.nav.mockReset();
});

describe('/login-request/* redirector', () => {
  it('moves the client id from the path into the query, keeping other params', () => {
    h.splat = 'theapp';
    h.search = { redirect_uri: 'https://app.example/cb', state: 'xyz' };
    render(<LoginRequest />);
    expect(h.nav).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '/login',
        replace: true,
        search: {
          redirect_uri: 'https://app.example/cb',
          state: 'xyz',
          clientId: 'theapp',
        },
      }),
    );
  });

  it('uses only the FIRST path segment as the client id', () => {
    // _clientId.vue took one segment; the _.vue catch-all matched deeper paths.
    h.splat = 'theapp/extra/junk';
    render(<LoginRequest />);
    expect(h.nav.mock.calls[0][0].search.clientId).toBe('theapp');
  });

  it('falls back to a clientId or client_id already in the query', () => {
    h.splat = '';
    h.search = { client_id: 'fromquery' };
    render(<LoginRequest />);
    expect(h.nav.mock.calls[0][0].search.clientId).toBe('fromquery');
  });

  it('forwards an empty request without inventing a client id', () => {
    h.splat = undefined;
    render(<LoginRequest />);
    expect(h.nav.mock.calls[0][0].search).toEqual({});
    expect(h.nav.mock.calls[0][0].search.clientId).toBeUndefined();
  });
});
