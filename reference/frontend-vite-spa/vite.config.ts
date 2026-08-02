import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

const API_TARGET = process.env.VITE_API_TARGET || 'http://127.0.0.1:8001';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},

      /**
       * Proxy the API so the browser sees a single origin.
       *
       * This is not a convenience. Session cookies are SameSite=Lax, and a
       * browser treats http://localhost:3000 and http://127.0.0.1:8001 as
       * different *sites* — so a direct cross-origin XHR silently drops the
       * session cookie and every authenticated request returns 403.
       *
       * Proxying makes /api/v1/* same-origin: the cookie travels, CSRF works,
       * and no CORS configuration is needed in development.
       */
      proxy: {
        '/api': {
          target: API_TARGET,
          // Keep the original Host header so Django's CSRF referer check
          // sees a same-origin request.
          changeOrigin: false,
          secure: false,
        },
        '/healthz': {
          target: API_TARGET,
          changeOrigin: false,
          secure: false,
        },
      },
    },
  };
});
