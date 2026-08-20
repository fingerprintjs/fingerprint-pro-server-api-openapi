import dxTeamConfig from '@fingerprintjs/eslint-config-dx-team/type-checked';
import importX from 'eslint-plugin-import-x';
import tseslint from 'typescript-eslint';

const relaxedFiles = ['bin/**', 'utils/**', 'scripts/**', '*.js', '*.cjs', '*.mjs', 'vite.config.ts'];

export default [
  ...dxTeamConfig,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    plugins: { 'import-x': importX },
    rules: {
      'import-x/first': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/newline-after-import': 'error',
      'import-x/order': [
        'error',
        { 'newlines-between': 'never', alphabetize: { order: 'asc', caseInsensitive: true } },
      ],
    },
  },
  {
    files: relaxedFiles,
    ...tseslint.configs.disableTypeChecked,
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
      '@typescript-eslint/consistent-type-assertions': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-dynamic-delete': 'off',
      'no-promise-executor-return': 'off',
      'no-prototype-builtins': 'off',
      'import-x/order': 'off',
    },
  },
];
