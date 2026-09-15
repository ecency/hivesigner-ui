import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/rspack';

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
      // unauthenticated. Overridable so a deployment can point elsewhere; the
      // app falls back to reading the directory off the chain if it is down.
      __API_URL__: JSON.stringify(
        process.env.API_URL || 'https://api.hivesigner.com',
      ),
    },
  },
  html: {
    template: './template.html',
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
