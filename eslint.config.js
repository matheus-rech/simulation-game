import js from '@eslint/js'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

const reactRecommended = react.configs.flat.recommended
export default [
  {
    ignores: [
      'coverage/**',
      'dist/**',
      'node_modules/**',
      '**/__tests__/**',
      'src/anatomy/**',
      'src/examples/**',
      'src/physics/**',
      'src/rigs/**',
      'src/test/**',
    ],
  },
  js.configs.recommended,
  ...typescriptEslint.configs['flat/recommended'],
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ...reactRecommended.languageOptions,
      parserOptions: {
        ...reactRecommended.languageOptions?.parserOptions,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      ...reactRecommended.plugins,
      'react-hooks': reactHooks,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactRecommended.rules,
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react/no-unknown-property': 'off',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
]
