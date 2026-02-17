# ESLint

## Configuration

ESLint is configured via `eslint.config.js` (flat config, ESLint v9+).
The config uses `typescript-eslint` for TypeScript and JSDoc-typed JS support,
and `eslint-plugin-playwright` for Playwright-specific test rules.

## Scripts

```json
"scripts": {
  "lint": "eslint --cache --cache-location node_modules/.cache/.eslintcache",
  "lint:fix": "eslint --fix --cache --cache-location node_modules/.cache/.eslintcache"
}
```

### `--cache`

Makes ESLint skip files that haven't changed since the last run.
Without it, every matched file is re-parsed on every invocation.

### `--cache-location node_modules/.cache/.eslintcache`

Stores the cache file inside `node_modules/.cache/` -- a conventional
location that many tools use (Prettier, Vite, etc.) and that is already
gitignored via `node_modules`.

## Rule philosophy

This project intentionally relaxes many strict TypeScript-ESLint rules.
The helper library (`lib/support/`) uses pure JS with JSDoc annotations
and makes heavy use of `any`-typed proxies. Enforcing `no-explicit-any`
or `no-unsafe-*` rules would add noise without catching real bugs in
this context.

Rules that _are_ on catch real problems:

- `no-misused-promises` -- catches forgotten `await`
- `array-type` -- enforces consistent `T[]` syntax
- `consistent-type-imports` -- encourages `import type` for type-only imports
- `reportUnusedDisableDirectives` -- keeps disable comments honest
- All `eslint.configs.recommended` rules -- standard JS quality checks
- `playwright/flat/recommended` rules -- Playwright best practices in tests

## Playwright plugin scope

The Playwright plugin is scoped to `__tests__/**` and `lib/model/**`.
Test-structure rules (`expect-expect`, `no-skipped-test`, etc.) are
structurally inert on page-object files — they look for `test()` /
`describe()` calls. API-hygiene rules (`no-element-handle`, `no-eval`,
`no-force-option`, `no-wait-for-selector`, etc.) apply to both tests
and page objects, catching deprecated or inconsistent Playwright API
usage everywhere it matters.

Several recommended rules are overridden to match this project's
architecture and [guiding principles](../guiding-principles.md).
See **[Playwright ESLint rules](../practices/playwright-eslint-rules.md)**
for the full per-rule review and rationale.

## Comparison with epic-stack

This section documents differences between our setup and
[epic-stack](https://github.com/epicweb-dev/epic-stack)'s ESLint approach,
for users who want to consider alternatives.

### Similarities

| Aspect             | This project               | epic-stack                   |
| ------------------ | -------------------------- | ---------------------------- |
| Config format      | Flat config                | Flat config                  |
| TypeScript support | `typescript-eslint`        | `typescript-eslint` (^8.38+) |
| Playwright plugin  | `eslint-plugin-playwright` | `eslint-plugin-playwright`   |

### Key differences

| Aspect             | This project                | epic-stack                                     | Notes                                                                                                                                                                                                  |
| ------------------ | --------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Import plugin      | _None_                      | `eslint-plugin-import-x`                       | epic-stack uses the maintained fork `import-x`. We omit import plugins since import rules are disabled anyway (delegated to Prettier). If import ordering enforcement is desired, consider `import-x`. |
| Oxlint             | _Not included_              | `@oxlint/plugins`                              | epic-stack integrates Oxlint for faster linting of a subset of rules. Worth considering if lint speed becomes an issue.                                                                                |
| FIXME comments     | _Not checked by ESLint_     | Error on `FIXME`                               | epic-stack uses `no-warning-comments` to forbid FIXME in code. This project uses TODO/todo conventions documented in CLAUDE.md instead.                                                                |
| Import ordering    | _Not enforced_              | Alphabetical via import plugin rules           | epic-stack actively sorts imports. This project delegates all formatting to Prettier.                                                                                                                  |
| Type-checked rules | `stylisticTypeChecked`      | Varies by `@epic-web/config` preset            | Both enable type-aware linting but may differ in which rule bundles are active.                                                                                                                        |
| Strictness         | Relaxed (many TS rules off) | Minimalist (only rules catching real problems) | Similar philosophy, different execution. epic-stack has fewer explicit "off" rules because its base config is less aggressive.                                                                         |

### Settings to consider adopting

- **`eslint-plugin-import-x`** -- if you add import sorting or
  want to enforce import boundaries (e.g. no test-file imports
  from source code). Prefer `import-x` over `eslint-plugin-import`
  (better maintained, ESM-first).
- **`@oxlint/plugins`** -- if lint speed matters. Offloads simple
  rules to the Rust-based Oxlint for faster execution.
- **FIXME enforcement** -- add `'no-warning-comments': ['error',
{ terms: ['FIXME'] }]` if you want ESLint to catch leftover
  fix-me markers.
