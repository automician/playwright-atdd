# pnpm

## Why pnpm over npm

- **Strict dependency resolution.** pnpm uses a content-addressable store
  with symlinks, so packages can only access dependencies they explicitly
  declare in `package.json`. This catches "phantom dependency" bugs where
  code accidentally imports a transitive dep.
  Good hygiene for a project meant to be copied.
- **Faster installs & less disk usage.** Packages are hardlinked from a
  global store, so repeated installs (CI, fresh clones) are noticeably
  faster.
- **Idiomatic for monorepos.** pnpm workspace filtering (`pnpm -F`)
  makes running scripts in sub-packages straightforward, which matters
  when this project is used as a template inside a monorepo, what is actually a recommended way to setup your Test Automation framework in a modern Agentic Software Development world.

## `.npmrc` and hoisting

By default pnpm isolates dependencies strictly. This can cause issues
with IDE extensions (e.g. Cursor / VS Code Playwright extension) that
resolve packages from the top-level `node_modules` and end up loading
a different instance than the one pnpm symlinked. The symptom is:

> Playwright Test did not expect test() to be called here.
> ...You have two different versions of @playwright/test.

The fix is surgical hoisting in `.npmrc`:

```ini
public-hoist-pattern[]=@playwright/*
```

This hoists only `@playwright/*` packages to the top-level
`node_modules` so the IDE extension finds the same copy that tests use.
Everything else stays strictly isolated.

Avoid `shamefully-hoist=true` unless you have a specific reason --
it hoists everything, which removes the strictness benefit of pnpm.

## Scripts: `pnpm exec` vs `npx`

Use `pnpm exec` (not `npx`) in `package.json` scripts:

```json
"scripts": {
  "test": "pnpm exec playwright test"
}
```

**Why not `npx`?** In a monorepo, `npx --prefix <sub-package>` does not
set the working directory the way pnpm filtering does. Playwright may
not find its config file when invoked this way:

```sh
# broken -- Playwright can't find playwright.config.js
npx --prefix <your-e2e-package> playwright test

# works -- pnpm sets cwd correctly
pnpm -F '<your-e2e-package>' exec playwright test
```

This matters when someone copies this project into a monorepo.
Using `pnpm exec` from the start avoids a subtle, hard-to-debug problem.
