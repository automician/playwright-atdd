# Using this project in a monorepo

Setting up your test automation framework as a sub-package in a monorepo
is the recommended approach for agentic software development workflows.
It keeps your e2e tests close to the application code, lets AI agents
navigate both the app and its tests in a single context, and shares
tooling (linters, formatters, CI) across the entire repo.

## Directory structure

A recommended pnpm monorepo layout with this project as a sub-package:

```text
your-monorepo/
  apps/
    web/                 – your application
  packages/
    ui/                  – shared UI components (example)
  tooling/
    test-e2e/            – this project (copied or cloned here)
      __tests__/
      lib/
      playwright.config.js
      package.json
  pnpm-workspace.yaml
  package.json           – monorepo root
```

The reasoning behind this structure:

- **`apps/`** — deployable applications and services.
- **`packages/`** — shared libraries with potential to become
  standalone external packages (UI components, utilities, etc.).
- **`tooling/`** — packages that support development quality:
  linting configs, type-checking, and testing. End-to-end tests
  belong here because they are quality assurance tooling,
  not a deployable app or a reusable library.
- **`test-e2e`** — the name is explicit about the type of tests
  (not "autotests" or "tests" which are ambiguous). It also
  naturally matches the `test:e2e` convenience script
  in the monorepo root `package.json`.

This follows the flat root structure recommended by
[pnpm workspaces](https://pnpm.io/workspaces) and
[Turborepo](https://turbo.build/repo/docs/crafting-your-repository/structuring-a-repository).

## Step by step

### 1. Copy the project into your monorepo

Download this project, and then from your monorepo folder:

```sh
cp -r <path-to-this-project> tooling/test-e2e
```

Or clone it as a subdirectory, or use your preferred method.

### 2. Register it as a workspace package

In your monorepo root `pnpm-workspace.yaml`, make sure the path
is included:

```yaml
packages:
  - apps/*
  - packages/*
  - tooling/*
```

### 3. Update `package.json` name

Give the sub-package a scoped name so it's easy to reference
with `pnpm -F`. The `@repo/` scope is a common convention
for monorepo-internal packages (your actual scope may differ):

```json
{
  "name": "@repo/test-e2e",
  "private": true
}
```

### 4. Install dependencies

From the monorepo root:

```sh
pnpm install
pnpm -F '@repo/test-e2e' exec playwright install
```

### 5. Run tests from the monorepo root

Use pnpm workspace filtering:

```sh
pnpm -F '@repo/test-e2e' test
```

Add a convenience alias in the monorepo root `package.json`:

```json
"scripts": {
  "test:e2e": "pnpm -F '@repo/test-e2e' test"
}
```

Then just:

```sh
pnpm test:e2e
```

A convenience alias for playwright installation would be also handy:

```json
"scripts": {
  "test:e2e:install": "pnpm -F '@repo/test-e2e' exec playwright install"
}
```

or reusing this project's install:playwright script:

```json
"scripts": {
  "test:e2e:install": "pnpm -F '@repo/test-e2e' install:playwright"
}
```

Thus, your coworkers will start running tests first time with simpler:

```sh
pnpm test:e2e:install
pnpm test:e2e
```

## Common pitfalls

### Playwright can't find its config

Do **not** use `npx --prefix` to run Playwright from the monorepo root:

```sh
# broken — Playwright won't find playwright.config.js
npx --prefix tooling/test-e2e playwright test
```

Always use `pnpm -F` instead — it sets the working directory correctly.
See [`docs/tooling/pnpm.md`](tooling/pnpm.md) for details.

### IDE "two versions of @playwright/test" error

If your IDE (Cursor, VS Code) shows:

> Playwright Test did not expect test() to be called here.
> ...You have two different versions of @playwright/test.

Add to the `.npmrc` in the sub-package (or monorepo root):

```ini
public-hoist-pattern[]=@playwright/*
```

Then reinstall (`rm -rf node_modules && pnpm install`).
See [`docs/tooling/pnpm.md`](tooling/pnpm.md) for the full explanation.
