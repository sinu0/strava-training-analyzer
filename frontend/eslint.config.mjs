import importPlugin from 'eslint-plugin-import';
import reactPlugin from 'eslint-plugin-react';
import tsParser from '@typescript-eslint/parser';

const leakedRenderRule = ['warn', { validStrategies: ['coerce', 'ternary'] }];

export default [
  {
    ignores: ['dist', 'coverage', 'node_modules'],
  },
  {
    files: ['src/**/*.{ts,tsx}', 'vite.config.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      import: importPlugin,
      react: reactPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      'import/order': ['error', {
        groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index'], 'type'],
        pathGroups: [
          {
            pattern: '@/**',
            group: 'internal',
            position: 'before',
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
          orderImportKind: 'asc',
        },
      }],
      'react/jsx-no-leaked-render': leakedRenderRule,
      'react/no-array-index-key': 'warn',
    },
  },
  {
    files: ['src/components/common/**/*.{ts,tsx}', 'src/components/layout/**/*.{ts,tsx}'],
    rules: {
      'react/jsx-no-leaked-render': ['error', { validStrategies: ['coerce', 'ternary'] }],
      'react/no-array-index-key': 'error',
    },
  },
];
