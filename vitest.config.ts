import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
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
