import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import './globals.css';
import './i18n';
import { parseSearch, stringifySearch } from './lib/search';
import { routeTree } from './routeTree.gen';

const router = createRouter({
  routeTree,
  // Hive uses the @author form everywhere; keep it literal rather than
  // percent-encoded, matching the current app's URLs.
  pathParamsAllowedCharacters: ['@'],
  // Keep search values as raw strings; the default JSON parsing corrupts
  // operation params (see lib/search.ts).
  parseSearch,
  stringifySearch,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

const rootElement = document.getElementById('root');
if (rootElement && !rootElement.innerHTML) {
  document.documentElement.setAttribute('data-build', __BUILD_SHA__);
  ReactDOM.createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
}
