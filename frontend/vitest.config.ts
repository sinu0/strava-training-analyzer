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
    setupFiles: ['./test/setup.ts'],
    // keep default reporters and other settings
  },
});
