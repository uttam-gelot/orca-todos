// Flat config: JS + typescript-eslint recommended, with Prettier owning formatting.
import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist/', 'release/', 'node_modules/', '.impeccable/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      // Log through src/log.ts so every line carries the plugin prefix and a level.
      'no-console': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }]
    }
  },
  {
    // Bun scripts that run on this machine, not in the plugin frame.
    files: ['scripts/**/*.ts'],
    languageOptions: { globals: { ...globals.node } }
  },
  {
    files: ['tests/**'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' }
  },
  prettier
)
