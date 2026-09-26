/** @type {import('xo').FlatXoConfig} */
const xoConfig = [
  {
    name: 'default',
    prettier: 'compat',
    rules: {
      complexity: 'off',
      'jsdoc/check-indentation': 'off',
      'jsdoc/check-line-alignment': 'off',
      'jsdoc/informative-docs': 'off',
      'jsdoc/require-asterisk-prefix': 'off',
      'jsdoc/valid-types': 'off',
      'no-shadow': 'off',
      'prefer-destructuring': 'off',
      'regexp/no-obscure-range': 'off',
      'regexp/no-unused-capturing-group': 'off',
      'regexp/prefer-named-capture-group': 'off',
      'require-unicode-regexp': 'off',
      '@typescript-eslint/no-restricted-types': 'off',
      'unicorn/better-dom-traversing': 'off',
      'unicorn/consistent-boolean-name': 'off',
      'unicorn/max-nested-calls': 'off',
      'unicorn/no-array-sort': 'off',
      'unicorn/no-break-in-nested-loop': 'off',
      'unicorn/no-immediate-mutation': 'off',
      'unicorn/prefer-at': 'off',
      'unicorn/prefer-code-point': 'off',
      'unicorn/prefer-combined-guards': 'off',
      'unicorn/prefer-early-return': 'off',
      'unicorn/prefer-https': 'off',
      'unicorn/prefer-minimal-ternary': 'off',
      'unicorn/prefer-simple-condition-first': 'off',
      'unicorn/prefer-string-pad-start-end': 'off',
      'unicorn/prefer-string-raw': 'off',
      'unicorn/prefer-string-repeat': 'off',
      'unicorn/prefer-ternary': 'off',
      'unicorn/prefer-unicode-code-point-escapes': 'off',
      'unicorn/require-array-sort-compare': 'off',
      'unicorn/single-line-block-comment-style': 'off'
    },
    space: true
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/array-type': ['error', {default: 'generic'}],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface']
    }
  },
  {
    files: ['**/package.json'],
    rules: {
      'package-json/no-orphan-types': 'off',
      'package-json/require-engines': 'off',
      'package-json/sort-files': 'off',
      'package-json/sort-properties': 'off'
    }
  },
  {
    files: ['test/**/*.js'],
    rules: {'max-depth': 'off', 'max-lines': 'off', 'no-await-in-loop': 'off'}
  },
  {rules: {curly: 'off', 'prefer-arrow-callback': 'off'}}
]

export default xoConfig
