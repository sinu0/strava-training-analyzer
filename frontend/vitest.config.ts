import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: ['**/e2e/**', 'node_modules'],
    maxWorkers: 4,
    setupFiles: ['./test/setup.ts'],
    testTimeout: 15_000,
  },
});
