# CLAUDE.md

## What is this project?

An open-source showcase of how an e2e test framework with Playwright may look,
doubling as a reusable "snippets" collection for Playwright-based test automation projects. Designed to work both as a standalone project and as a sub-package
in a monorepo — the recommended way to set up a test automation framework
in a modern agentic software development workflow.
Maintained by a QA & Automation consultant (Yakiv Kramarenko @yashaka)
for reuse across projects of his clients.

## Key architectural decisions

- **Pure JS codebase** – so snippets are easy to copy-paste regardless of
  whether the target project uses JS or TS.
  Typing safety is achieved via **JSDoc annotations** + `tsconfig.json`
  (`allowJs`, `checkJs`, `noEmit`) for IDE inference.
  Tests and page-objects may eventually migrate to TypeScript,
  but core helpers will stay in pure JS.
- **ESM** (`"type": "module"` in package.json).
- **Minimal external dependencies.** Prefer standard/built-in solutions.
  When a widely-adopted standard lib exists (e.g. Zod for parsing) – use it
  instead of hand-rolling. <!-- todo: adopt Zod for config parsing -->
- **Self-contained helper modules.** Some small helpers intentionally avoid
  imports so they can be copied independently.
  Duplication between such modules is accepted for now.
  <!-- todo: reconsider the "zero-dep snippet module" approach;
       maybe there's a better way to organise reusable snippets -->

## Guiding principles

See `.claude/rules/principles.md` for extended rationale and sources.

- **KISS & "Simple Made Easy".**
- **Explicit is better than implicit.**
- **Flat is better than nested** (where possible).
- **Self-Documented Code.**
  In the face of ambiguity, refuse the temptation to guess.
- **Ubiquitous Language** in naming –
  use the same convention everywhere
  (e.g. `mySetting` → `process.env.mySetting`, not `MY_SETTING`).
- **Loose coupling, high cohesion & colocation.**
- **Create abstractions for self-documentation and composition first, not just for DRY.**
  Consider DRY where there is a high probability of co-change.
- **YAGNI.**
- **"Only one way" where possible** –
  though not always achievable here since different clients may need
  different flavours of the same helper.
- **Single Responsibility Principle.**
- **Prefer functional programming style over imperative** where possible.
- **Seek referential transparency, avoid side effects.**
- **Prefer composition over inheritance** –
  always use composition for has-a relationships;
  consider inheritance for is-a only when the practical win is large.
- **Unit tests: classical (Detroit) school** –
  a "unit" is a functionally useful chunk of code (not necessarily
  a single function or method); replace with test doubles only
  unmanaged (not fully controlled by the app) out-of-process dependencies.

## Do NOT

- Do not add TypeScript to core helper modules under `lib/support/`.
- Do not add external dependencies without explicit approval.

## Module conventions

- For single-function or single-class modules, use the same name as the function/class (camelCase or PascalCase), export as default. For modules with multiple exports, use `kebab-case`.

## Tooling reference

Where this project needs a tool and it aligns with what
[epic-stack](https://github.com/epicweb-dev/epic-stack) uses – consider
epic-stack's choice first (see their
[features doc](https://github.com/epicweb-dev/epic-stack/blob/main/docs/features.md)).
Not everything from epic-stack fits a pure e2e testing project,
and client-project conventions may take precedence.

## Project layout

```text
__tests__/          – Playwright test specs
docs/
  monorepo-setup.md – Guide for integrating into a monorepo
  practices/        – Patterns & techniques documentation
  tooling/          – Rationale behind tooling choices (pnpm, Prettier, etc.)
lib/
  model/            – Page-objects, controls, app-manager fixture
  support/
    common/         – General-purpose helpers (http, string/url/object utils)
    config/         – Config loading (env, dotenv, yml overrides)
    git/            – Git helpers (commit ref, slug, user)
    playwright/     – Playwright-specific helpers (steps, matchers, request)
project.config.js   – Project-level config
playwright.config.js
```

## Commands

```sh
# Run all tests
pnpm exec playwright test

# Run a specific test
pnpm exec playwright test __tests__/duckduckgo.test.js:3

# Run a specific test file
pnpm exec playwright test __tests__/duckduckgo.test.js

# Run unit tests colocated with helpers (uses node:test, not Playwright)
node --test lib/

# Show HTML report
pnpm exec playwright show-report
```

## Code style

- Prettier is configured (`.prettierrc.cjs`, with `experimentalTernary`).
- EditorConfig is present (`.editorconfig`).
- **Naming convention across layers:** keep the original casing from the
  source (e.g. a camelCase config key stays camelCase even as an env var:
  `process.env.mySetting`, not `process.env.MY_SETTING`).

## TODO conventions

- **`TODO`** (uppercase) in code or markdown — must be resolved before
  the current feature is considered done (i.e. before pushing to `main`
  or merging a feature branch).
- **`todo`** (lowercase) — a backlog item for future addition or
  refactoring. Not blocking the current work.
