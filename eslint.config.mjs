import antfu from '@antfu/eslint-config';

export default antfu(
  {
    stylistic: {
      semi: true,
      quotes: 'single',
      indent: 2,
    },
    react: true,
    typescript: {
      tsconfigPath: './tsconfig.json',
      parserOptions: {
        projectService: {},
      },
      overridesTypeChecked: {
        'ts/no-floating-promises': 'error',
        'ts/no-misused-promises': 'error',
        'ts/await-thenable': 'error',
      },
    },
  },
  {
    rules: {
      'unused-imports/no-unused-vars': 'error',
      'ts/no-empty-function': ['error', { allow: ['constructors'] }],
      'ts/no-explicit-any': 'error',
      'n/prefer-global/process': 'off',
      'no-console': 'off',
      'style/quote-props': 'off',
      'antfu/if-newline': 'off',
      'react-refresh/only-export-components': 'off',
      'test/prefer-lowercase-title': 'off',
      'yaml/flow-mapping-curly-spacing': 'off',
    },
  },
  {
    files: ['apps/backend/**/*.ts', 'server/**/*.ts', 'backend/**/*.ts'],
    rules: {
      'ts/consistent-type-imports': 'off',
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'ts/no-unsafe-call': 'off',
      'ts/no-unsafe-member-access': 'off',
    },
  },
  {
    ignores: ['**/generated/**', '**/node_modules/**', '**/dist/**', '**/.git/**'],
  },
);
