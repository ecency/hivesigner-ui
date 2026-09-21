// A minimal @tanstack/react-router stand-in for component tests. Routes are
// file-based; tests render the route's component directly and only need Link
// to be an anchor, createFileRoute to hand back the options, and the search
// and params hooks to be controllable.
import { vi } from 'vitest';

// Mutable per test. The mock factories below read it lazily, so a test can
// set the search or params before rendering.
export const routerState = {
  search: {} as Record<string, string>,
  params: {} as Record<string, string>,
  navigate: vi.fn(),
  pathname: '/',
  hash: '',
};

export function routerMock() {
  return {
    createFileRoute: () => (opts: unknown) => ({
      ...(opts as object),
      useSearch: () => routerState.search,
      useParams: () => routerState.params,
    }),
    createRootRoute: (opts: unknown) => opts,
    Link: ({
      children,
      to,
      params,
      search,
      ...rest
    }: {
      children: unknown;
      to: string;
      params?: Record<string, string>;
      search?: Record<string, string>;
    } & Record<string, unknown>) => {
      const href = params
        ? Object.entries(params).reduce(
            (p, [k, v]) =>
              k === '_splat' ? p.replace(/\$$/, v) : p.replace(`$${k}`, v),
            to,
          )
        : to;
      const { className, ...attrs } = rest as { className?: string };
      return (
        <a
          href={href}
          className={className}
          data-search={search ? JSON.stringify(search) : undefined}
          {...(attrs as Record<string, string>)}
        >
          {children as never}
        </a>
      );
    },
    Navigate: ({ to }: { to: string }) => <div data-navigate={to} />,
    Outlet: () => <div data-testid="outlet" />,
    useNavigate: () => routerState.navigate,
    // For the leave latch: no navigation ever starts here, so it is set only
    // when the component unmounts. The real-router tests cover the rest.
    useRouter: () => ({
      state: { location: { pathname: routerState.pathname, searchStr: '' } },
      subscribe: () => () => {},
      navigate: routerState.navigate,
    }),
    useRouterState: ({ select }: { select: (s: unknown) => unknown }) =>
      select({
        location: { pathname: routerState.pathname, hash: routerState.hash },
      }),
  };
}
