import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { docFileInfo, renderDoc } from './scripts/docs-markdown.mjs';

export default defineConfig({
  plugins: [
    {
      // The same rendering the rspack loader does for the build.
      name: 'docs-markdown',
      enforce: 'pre',
      transform(source, id) {
        if (!id.endsWith('.md')) return null;
        const { lang } = docFileInfo(id);
        const page = renderDoc(source, { lang, file: id });
        return { code: `export default ${JSON.stringify(page)};`, map: null };
      },
    },
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    // Above the 10s wait ceiling (test-setup.ts): a test that waits on key
    // derivation under load must fail on its assertion, not on the clock.
    testTimeout: 30_000,
    // .tsx included so component tests actually run (a .ts-only glob silently
    // collects zero files and reports green).
    include: ['src/**/*.test.{ts,tsx}'],
    alias: {
      // Absolute: Vite resolves an alias target relative to the importing file,
      // so a bare './src' never matches '@/...' imports in a spec.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
