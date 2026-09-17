import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/rspack';

const SITE_URL = (process.env.SITE_URL || 'https://hivesigner.com').replace(
  /\/+$/,
  '',
);

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    define: {
      // Baked at build time so the served bundle can say which build it is.
      __BUILD_SHA__: JSON.stringify(process.env.GIT_SHA || 'unknown'),
      // Sentry DSN. A DSN is public by design (it ships in the bundle), but it
      // is passed in at build time rather than committed so this public repo
      // does not carry it. Empty means reporting is off, which is the default
      // for local builds.
      __SENTRY_DSN__: JSON.stringify(process.env.SENTRY_DSN || ''),
      // The Hivesigner API, which serves the ranked app directory. Public and
      // unauthenticated. Overridable so a deployment can point elsewhere. There
      // is no fallback: if it is down the directory reports unreachable and
      // offers a retry (#116 removed the on-chain list).
      __API_URL__: JSON.stringify(
        process.env.API_URL || 'https://api.hivesigner.com',
      ),
      // The public origin this build is served from, for canonical and Open
      // Graph URLs, which must be absolute. Staging builds pass their own so
      // shared staging links do not advertise production.
      __SITE_URL__: JSON.stringify(SITE_URL),
    },
  },
  output: {
    // Ten hash characters rather than the default eight. The length itself
    // does not matter; changing it gave every asset a URL no browser had seen
    // before, after a release in which missing assets were served as
    // cacheable 404s that some browsers kept. Leave it as it is.
    filenameHash: 'contenthash:10',
  },
  html: {
    template: './template.html',
    templateParameters: { siteUrl: SITE_URL },
  },
  resolve: {
    alias: {
      '@': './src',
    },
  },
  tools: {
    rspack: {
      plugins: [
        tanstackRouter({
          target: 'react',
          autoCodeSplitting: true,
        }),
      ],
    },
  },
});
