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
  // ===== GLOBAL RULES =====
  {
    rules: {
      // Code quality & style
      'unused-imports/no-unused-vars': 'error',
      'ts/no-explicit-any': 'error',
      'no-console': 'off',
      'no-alert': 'off',

      // Relaxed stylistic rules (global)
      'n/prefer-global/process': 'off',
      'style/quote-props': 'off',
      'antfu/if-newline': 'off',
      'style/arrow-parens': 'off',
      'style/quotes': 'off',
      'style/brace-style': 'off',
      'style/multiline-ternary': 'off',
      'style/operator-linebreak': 'off',

      // Relaxed TypeScript rules (global)
      'ts/consistent-type-imports': 'off',
      'ts/strict-boolean-expressions': 'off',
      'ts/no-unsafe-assignment': 'off',
      'ts/no-unsafe-argument': 'off',
      'ts/no-unsafe-member-access': 'off',
      'ts/no-unsafe-call': 'off',
      'ts/no-floating-promises': 'off',
      'ts/no-misused-promises': 'off',
      'ts/restrict-template-expressions': 'off',
      'ts/no-empty-function': ['error', { allow: ['constructors'] }],

      // Tool-specific
      'react-refresh/only-export-components': 'off',
      'test/prefer-lowercase-title': 'off',
      'yaml/flow-mapping-curly-spacing': 'off',
    },
  },
  // ===== BACKEND-SPECIFIC RULES =====
  {
    files: ['backend/**/*.ts'],
    rules: {
      // Backend uses type imports differently
      'ts/consistent-type-imports': 'off',

      // Strict type safety for backend (override global relaxed settings)
      'ts/strict-boolean-expressions': 'error',
      'ts/no-unsafe-assignment': 'error',
      'ts/no-unsafe-argument': 'error',
      'ts/no-unsafe-member-access': 'error',
      'ts/no-unsafe-call': 'error',
      'ts/no-floating-promises': 'error',
      'ts/no-misused-promises': 'error',
      'ts/restrict-template-expressions': 'error',
    },
  },
  // ===== FRONTEND-SPECIFIC RULES =====
  {
    files: ['frontend/**/*.ts', 'frontend/**/*.tsx'],
    rules: {
      // Next.js specific
      '@next/next/no-img-element': 'off',

      // React specific
      'react/no-array-index-key': 'off',
      'react/purity': 'off',
      'style/jsx-one-expression-per-line': 'off',

      // Already relaxed globally, but explicitly shown for frontend context
      'ts/strict-boolean-expressions': 'off',
      'ts/no-unsafe-assignment': 'off',
      'ts/no-unsafe-argument': 'off',
      'ts/no-unsafe-member-access': 'off',
      'ts/no-unsafe-call': 'off',
      'ts/no-floating-promises': 'off',
      'ts/no-misused-promises': 'off',
      'ts/restrict-template-expressions': 'off',
      'ts/no-explicit-any': 'off',
    },
  },
  // ===== TEST-SPECIFIC RULES =====
  {
    files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      // Tests need looser type safety for mocks and assertions
      'ts/no-unsafe-call': 'off',
      'ts/no-unsafe-member-access': 'off',
      'ts/unbound-method': 'off',
      'ts/no-explicit-any': 'off',
    },
  },
  // ===== YAML-SPECIFIC RULES =====
  {
    files: ['**/*.yml', '**/*.yaml'],
    rules: {
      'yaml/quotes': 'off',
      'yaml/plain-scalar': 'off',
    },
  },
  // ===== IGNORES =====
  {
    ignores: ['**/generated/**', '**/node_modules/**', '**/dist/**', '**/.git/**'],
  },
);
