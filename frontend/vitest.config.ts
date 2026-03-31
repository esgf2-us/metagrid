import { defineConfig } from 'vitest/config';
import path from 'path';

// Use `InlineConfig` to type the config object so we avoid `any` while matching
// Vitest's expected config shape (keeps `timeout` and other test options).
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    testTimeout: 120000,
    // Ensure the early setup file runs before the heavier setup files
    setupFiles: ['src/vitest.setup.early.ts', 'src/setupTests.ts'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'lcov'],
      exclude: ['src/index.tsx', 'src/test/**', 'src/assets', '**/lib/**'],
    },
  },
  resolve: {
    alias: {
      'react-markdown': path.resolve(__dirname, 'src/test/__mocks__/ReactMarkdownMock.tsx'),
    },
  },
} as Parameters<typeof defineConfig>[0]);
