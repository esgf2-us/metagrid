import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    server: {
      host: true,
      port: 8080,
      strictPort: true,
      watch: true,
    },
    base: process.env.HOST_SUBPATH || '/',
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
