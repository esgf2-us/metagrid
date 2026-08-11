import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fixupPluginRules, fixupConfigRules } from '@eslint/compat';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import hooksPlugin from 'eslint-plugin-react-hooks';
import reactPlugin from 'eslint-plugin-react';
import importPlugin from 'eslint-plugin-import';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '**/*.test.{ts,tsx,js,jsx}',
      '**/*.spec.{ts,tsx,js,jsx}',
      'src/test/**',
      'src/setupTests.ts',
      'src/vite-env.d.ts',
      '**/vitest.*{js,ts,tsx}',
      'vite.config.*',
    ],
  },
  ...fixupConfigRules(
    compat.extends(
      'eslint-config-airbnb',
      '@kesills/eslint-config-airbnb-typescript',
      'plugin:@typescript-eslint/recommended-type-checked',
    ),
  ).map((config) => ({
    ...config,
    files: ['src/**/*.{ts,tsx}'],
  })),
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      'react-hooks': fixupPluginRules(hooksPlugin),
      react: fixupPluginRules(reactPlugin),
      import: fixupPluginRules(importPlugin),
    },
    rules: {
      ...hooksPlugin.configs.recommended.rules,
      'react/function-component-definition': [
        'error',
        {
          namedComponents: ['function-declaration', 'arrow-function'],
          unnamedComponents: ['function-expression', 'arrow-function'],
        },
      ],
      '@stylistic/lines-between-class-members': 'off',
      'react/destructuring-assignment': 'off',
      'react/jsx-filename-extension': [1, { extensions: ['.ts', '.tsx'] }],
      'react/prop-types': 'off',
      'react/require-default-props': 'off',
      'react/function-component-definition': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react/no-unstable-nested-components': 'off',
      'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
      '@typescript-eslint/no-unused-vars': ['warn', { caughtErrors: 'none' }],
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      'spaced-comment': ['error', 'always', { markers: ['/'] }],
      '@typescript-eslint/return-await': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/dot-notation': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  },
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    ...tseslint.configs.disableTypeChecked,
    rules: {
      '@typescript-eslint/dot-notation': 'off',
      '@typescript-eslint/no-implied-eval': 'off',
    },
  },
  eslintPluginPrettierRecommended,
];
