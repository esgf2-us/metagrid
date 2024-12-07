import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    server: {
      host: true,
      port: 8080,
      strictPort: true,
      proxy: {
        '/frontend-config.js': 'http://django:5000',
        '/api': 'http://django:5000',
        '/accounts': 'http://django:5000',
        '/account-confirm-email': 'http://django:5000',
        '/swagger': 'http://django:5000',
        '/redoc': 'http://django:5000',
        '/proxy': 'http://django:5000',
        '/tempStorage': 'http://django:5000',
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
      '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    },
    moduleNameMapper: {
      '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    },
  };
});
