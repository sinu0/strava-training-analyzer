import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const RECHARTS_PACKAGES = ['recharts', 'recharts-scale', 'react-smooth', 'victory-vendor'];

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replaceAll('\\', '/');
          if (RECHARTS_PACKAGES.some((packageName) => normalizedId.includes(`/node_modules/${packageName}/`))) {
            return 'recharts';
          }

          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        proxyTimeout: 300_000,
        timeout: 300_000,
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
