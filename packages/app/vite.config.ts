/// <reference types='vitest' />
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import analyze from 'rollup-plugin-analyzer';
import visualizer from 'rollup-plugin-visualizer';
import tsconfigPaths from 'vite-tsconfig-paths';

const analyzeBundle = true;

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/dashboard',
  server: {
    port: 4200,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:3000/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/iam': {
        target: 'http://localhost:3000/iam',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/iam/, ''),
      },
    },
  },
  preview: {
    port: 4200,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:3000/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/iam': {
        target: 'http://localhost:3000/iam',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/iam/, ''),
      },
    },
  },
  plugins: [tsconfigPaths(), react()],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  build: {
    minify: false,
    sourcemap: true,
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('mantine')) {
            return '@mantine';
          }

          if (id.includes('node_modules')) {
            return 'vendor';
          }

          return undefined;
        },
      },
      plugins: analyzeBundle
        ? [
            analyze(),
            visualizer({
              brotliSize: true,
              filename: path.join(__dirname, 'dist/stats/stats.html'),
              gzipSize: true,
              open: false,
              projectRoot: path.join(__dirname),
            }),
          ]
        : [],
    },
  },
  test: {
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['./vite-config/test-setup.ts'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
