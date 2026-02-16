# tsgo (native TypeScript type-checker)

## What is tsgo

`tsgo` is the official native (Go-based) implementation of the TypeScript
type-checker, developed by the TypeScript team at Microsoft. It is
distributed via the `@typescript/native-preview` npm package and provides
the same type semantics as `tsc` — it reads the same `tsconfig.json` and
checks the same TypeScript / JSDoc type annotations.

The project lives at
[github.com/microsoft/typescript-go](https://github.com/microsoft/typescript-go)
and is expected to become the default TypeScript CLI in a future major
release.

## Why we chose it

- **10x+ faster typechecking.** Because `tsgo` is compiled to native code
  (Go), it runs significantly faster than node-based `tsc`. On large
  codebases the difference is dramatic; even on smaller projects the
  sub-second feedback loop is noticeably better.
- **Same type semantics.** `tsgo` is not an alternative type system — it is
  the same TypeScript compiler rewritten in Go. The type rules, error
  messages, and `tsconfig.json` interpretation are intended to be identical
  to `tsc`.
- **Official Microsoft project.** This is not a community fork or a
  third-party tool. It is maintained by the TypeScript team and tracks
  `tsc` feature-for-feature.

## How to use

```sh
# Type-check the project (no output files)
pnpm typecheck
```

This runs:

```sh
tsgo --noEmit --emitDeclarationOnly false
```

## How to migrate to `tsc` if needed

If you ever need to switch back to the standard node-based TypeScript
compiler, the migration is a one-line change:

1. Update the `typecheck` script in `package.json`:

   ```diff
   - "typecheck": "tsgo --noEmit --emitDeclarationOnly false"
   + "typecheck": "tsc --noEmit"
   ```

2. Remove the `@typescript/native-preview` devDependency:

   ```sh
   pnpm remove @typescript/native-preview
   ```

3. Keep the `typescript` devDependency — it is still needed for IDE
   support and provides the `tsc` binary.

That's it. No `tsconfig.json` changes are required — both tools read the
same configuration.

## Potential divergence risks

`tsgo` is tracking `tsc` feature-for-feature, so the risk of meaningful
divergence is low. Known areas to watch:

- **Preview status.** `tsgo` is currently distributed as
  `@typescript/native-preview`. Until it reaches stable status, minor
  edge-case differences in error messages or diagnostics may appear.
- **Niche compiler options.** Some rarely used `tsc` flags may not yet be
  implemented in `tsgo`. The options used in this project (`noEmit`,
  `strict`, `allowJs`, `checkJs`, etc.) are all supported.
- **Timing.** `tsgo` may lag behind `tsc` by a minor version when new
  TypeScript features are released.

If any of these become a problem, migrating back to `tsc` takes under a
minute (see above).
