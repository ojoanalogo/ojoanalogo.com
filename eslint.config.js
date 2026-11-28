import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import prettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const scriptFiles = [
  'src/**/*.{js,mjs,cjs,jsx,ts,tsx}',
  'test/**/*.{js,mjs,cjs,jsx,ts,tsx}',
  'e2e/**/*.{js,mjs,cjs,ts}',
  'eslint.config.js',
  '*.config.{js,mjs,cjs,ts}',
];

export default defineConfig(
  {
    ignores: ['dist/', '.astro/', 'src/env.d.ts', '.claude/'],
  },

  js.configs.recommended,

  {
    files: scriptFiles,
    extends: [tseslint.configs.recommended],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  ...astro.configs['flat/recommended'],
  ...astro.configs['flat/jsx-a11y-recommended'],

  {
    files: ['**/*.astro'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
    },
  },

  prettier,
);
