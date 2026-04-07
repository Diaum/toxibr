// @ts-check
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default defineConfig([
  globalIgnores(['dist/', 'node_modules/', 'coverage/', 'docs/', 'website/', 'jest.config.js']),

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    name: 'toxibr/typescript-core',
    files: ['**/*.ts', '**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      ...eslintConfigPrettier.rules,

      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'warn',
      'no-useless-escape': 'off',
    },
  },
]);
