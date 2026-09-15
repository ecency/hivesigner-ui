import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import './globals.css';
import './i18n';
import { autoUnlockPlaintext, migrateLegacyKeychain } from './lib/accounts';
import { parseSearch, stringifySearch } from './lib/search';
import { initErrorReporting } from './lib/sentry';
import { routeTree } from './routeTree.gen';

// Before anything else, so a failure during startup is still reported.
initErrorReporting();

// Accounts saved before April 2021 live under the original `keychain` key. The
// Nuxt plugin that moved them into `vuex__accounts` went with the Nuxt app, so
// this carries them over instead. MUST run before autoUnlockPlaintext, which
// only looks at the new key.
migrateLegacyKeychain();

// Plaintext (no-passcode) accounts carry no security by staying locked; load
// their keys at startup so signing works after a reload. Encrypted accounts
// still require their passcode.
autoUnlockPlaintext();

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
