import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const RECHARTS_PACKAGES = ['recharts', 'recharts-scale', 'react-smooth', 'victory-vendor'];
const VENDOR_CHUNKS: Record<string, string[]> = {
  react: ['react', 'react-dom', 'react-router', 'react-router-dom', 'scheduler'],
  mui: ['@mui', '@emotion'],
  data: ['@tanstack', 'axios'],
};

function belongsToPackage(normalizedId: string, packageName: string) {
  return normalizedId.includes(`/node_modules/${packageName}/`);
}

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replaceAll('\\', '/');
          if (RECHARTS_PACKAGES.some((packageName) => belongsToPackage(normalizedId, packageName))) {
            return 'recharts';
          }
          for (const [chunkName, packageNames] of Object.entries(VENDOR_CHUNKS)) {
            if (packageNames.some((packageName) => belongsToPackage(normalizedId, packageName))) {
              return chunkName;
            }
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
