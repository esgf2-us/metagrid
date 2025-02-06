import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    server: {
      host: true,
      port: 8080,
      strictPort: true,
      watch: true,
      proxy: {
        '/account-confirm-email': 'http://localhost:5000',
        '/accounts': 'http://localhost:5000',
        '/api': 'http://localhost:5000',
        '/complete': 'http://localhost:5000',
        '/frontend-config.js': 'http://localhost:5000',
        '/globus': 'http://localhost:5000',
        '/login': 'http://localhost:5000',
        '/proxy': 'http://localhost:5000',
        '/redoc': 'http://localhost:5000',
        '/swagger': 'http://localhost:5000',
        '/tempStorage': 'http://localhost:5000',
      },
    },
    build: {
      outDir: 'build',
    },
    plugins: [react()],
    define: {
      global: 'globalThis',
    },
    transform: {
      '^.+\\.(js|jsx|ts|tsx)$': '@swc/jest',
    },
    moduleNameMapper: {
      '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    },
  };
});
