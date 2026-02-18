// @ts-check
import { defineConfig } from 'eslint/config'
import eslint from '@eslint/js'
import playwright from 'eslint-plugin-playwright'
import tseslint from 'typescript-eslint'

// ESLint flat config: rule-merging logic
//
// defineConfig() receives a sequence of config objects.
// For each file ESLint collects every object whose "files" pattern matches
// (objects without "files" match all files) and merges their "rules"
// maps — later entries win on a per-rule basis.
//
// So in this config:
// 1. Base presets (recommended, stylisticTypeChecked) — apply globally,
//    set the baseline rules.
// 2. Our overrides block (files: .js + .ts) — sits later,
//    so its rules override the baseline per-rule where specified.
// 3. Playwright blocks — scoped to test/model files; their rules merge
//    on top of 1 + 2 for those files only.
//
// NOTE: We spread presets at the top level rather than using "extends"
// inside a files-scoped block. defineConfig's "extends" intersects
// the outer "files" with each preset's internal "files", which would
// narrow tseslint's no-undef:off (intended for .ts only) so it
// wouldn't cover .js — breaking JS linting.
export default defineConfig(
  // ── Global ignores ──────────────────────────────────────────────
  {
    ignores: [
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'blob-report/**',
      '**/*.cjs',
      '.prettierrc.js',
    ],
  },

  // ── Base: ESLint recommended + TS recommended + TS stylistic ───
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylisticTypeChecked,

  // ── Type-checked config + rule overrides ─────────────────────
  {
    files: ['**/*.js', '**/*.ts'],
    linterOptions: { reportUnusedDisableDirectives: true },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
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
      // With tseslint parser + projectService, no-undef is redundant
      // (the TS compiler checks undefined variables for both .ts and .js).
      // tseslint.configs.recommended disables it only for .ts files;
      // we extend that to .js since projectService covers them too.
      'no-undef': 'off',
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
