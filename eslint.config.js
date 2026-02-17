// @ts-check
import eslint from '@eslint/js'
import playwright from 'eslint-plugin-playwright'
import tseslint from 'typescript-eslint'

/* TODO: fix "The signature '(...configs: InfiniteDepthConfigWithExtends[]): ConfigArray' of 'tseslint.config' is deprecated.ts(6387)"
 */
/** @type {import('typescript-eslint').Config} */
export default tseslint.config(
  // ── Global ignores ──────────────────────────────────────────────
  {
    ignores: [
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'blob-report/**',
    ],
  },

  // ── Base: ESLint recommended + TS recommended + TS stylistic ───
  {
    files: ['**/*.js', '**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    rules: {
      // ── TypeScript overrides ──────────────────────────────────
      // Intentionally relaxed for a test automation project
      // that heavily uses `any` in JSDoc-typed proxy/helper code.
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/array-type': ['error', { default: 'array' }],

      // ── Import ordering ────────────────────────────────────────
      // Not using eslint-plugin-import; if a Prettier sort-imports
      // plugin is added later, keep these off.
      'sort-imports': 'off',

      // ── Vanilla ESLint overrides ───────────────────────────────
      // Playwright fixtures use empty destructuring: async ({}, use) => ...
      'no-empty-pattern': 'off',
    },
  },

  // ── Type-checked config: enable projectService ─────────────────
  {
    linterOptions: { reportUnusedDisableDirectives: true },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // ── Playwright plugin: tests + page-object model ───────────────
  // API-hygiene rules (no-element-handle, no-eval, no-force-option,
  // no-wait-for-selector, etc.) apply to both test files and
  // page-object / control code. Test-structure rules (expect-expect,
  // no-skipped-test, valid-describe-callback, etc.) are structurally
  // inert on non-test files — they look for test()/describe() calls.
  {
    ...playwright.configs['flat/recommended'],
    files: ['__tests__/**', 'lib/model/**'],
  },
  {
    files: ['__tests__/**', 'lib/model/**'],
    rules: {
      // ── Customized rules ───────────────────────────────────────
      // See docs/practices/playwright-eslint-rules.md for rationale.
      'playwright/no-element-handle': 'error',
      'playwright/no-eval': 'error',
      'playwright/no-wait-for-selector': 'error',
    },
  },
  {
    files: ['__tests__/**'],
    rules: {
      // ── Test-only overrides ────────────────────────────────────
      'playwright/expect-expect': ['warn', { assertFunctionPatterns: ['^should'] }],
      'playwright/max-nested-describe': ['warn', { max: 1 }],
      'playwright/no-conditional-in-test': 'error',
      'playwright/no-nested-step': 'error',
      'playwright/no-unused-locators': 'warn',
    },
  },
)
