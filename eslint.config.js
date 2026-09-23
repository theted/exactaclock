import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/**', 'coverage/**', 'dist/**'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        L: 'readonly' // Leaflet, loaded from a CDN <script> tag
      }
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'prefer-const': 'error',
      eqeqeq: ['error', 'smart'],
      'no-var': 'error'
    }
  },
  {
    files: ['**/*.test.js', 'test/**/*.js', 'eslint.config.js'],
    languageOptions: { globals: { ...globals.node } }
  }
];
