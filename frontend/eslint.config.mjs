import importPlugin from 'eslint-plugin-import';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import tsParser from '@typescript-eslint/parser';

const leakedRenderRule = ['error', { validStrategies: ['coerce', 'ternary'] }];

// Design-system guard: colours come from theme tokens and surfaces from `@/ui`
// (docs/DESIGN_SYSTEM.md). DS_GUARD=off disables it for an emergency local run only.
const designSystemGuard = process.env.DS_GUARD ?? 'error';
const colorLiteral = String.raw`/(#[0-9A-Fa-f]{3,8}\b|rgba?\()/`;

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
      'jsx-a11y': jsxA11yPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
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
      ...jsxA11yPlugin.flatConfigs.recommended.rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
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
      'react/no-array-index-key': 'error',
    },
  },
  {
    files: ['src/components/common/**/*.{ts,tsx}', 'src/components/layout/**/*.{ts,tsx}'],
    rules: {
      'react/jsx-no-leaked-render': ['error', { validStrategies: ['coerce', 'ternary'] }],
      'react/no-array-index-key': 'error',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/theme/**', 'src/**/__tests__/**', 'src/**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [designSystemGuard,
        { selector: `Literal[value=${colorLiteral}]`, message: 'Kolory tylko z tokenów motywu (theme.tokens / useTokens) — nie wpisuj hex ani rgba.' },
        { selector: `TemplateElement[value.raw=${colorLiteral}]`, message: 'Kolory tylko z tokenów motywu (theme.tokens / useTokens) — nie wpisuj hex ani rgba.' },
      ],
      'no-restricted-imports': [designSystemGuard, {
        paths: [
          { name: '@mui/material', importNames: ['Card', 'CardContent', 'CardHeader', 'Paper'], message: 'Użyj Surface / Widget z @/ui.' },
          { name: '@mui/material/Card', message: 'Użyj Surface / Widget z @/ui.' },
          { name: '@mui/material/Paper', message: 'Użyj Surface / Widget z @/ui.' },
        ],
        patterns: [
          { group: ['@/components/v2/*', '@/components/common/DataCard', '@/components/common/MetricTile', '@/components/common/Section', '@/components/common/StatDisplay', '@/components/common/ScoreBadge', '@/components/common/EditorialHero', '@/components/common/ChartWrapper'], message: 'Komponent zastąpiony przez @/ui.' },
        ],
      }],
    },
  },
  {
    // The component library itself is the one place allowed to build on MUI surfaces.
    files: ['src/ui/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': 'off' },
  },
];
