import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {ignores: ['build/**', '.docusaurus/**', 'node_modules/**', '.qoder/**', '.tocodex/**']},
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}', '*.{ts,tsx}'],
    plugins: {'react-hooks': reactHooks},
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', {argsIgnorePattern: '^_', varsIgnorePattern: '^_'}],
    },
  },
  {
    files: ['scripts/**/*.cjs'],
    rules: {'@typescript-eslint/no-require-imports': 'off'},
    languageOptions: {
      sourceType: 'commonjs',
      globals: {require: 'readonly', module: 'readonly', process: 'readonly', console: 'readonly'},
    },
  },
);
