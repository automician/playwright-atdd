# Steps proxy

## What it does

Wraps any object so that every method call is automatically reported
as a Playwright `test.step()`. This eliminates boilerplate:

```js
// without steps proxy — manual step wrapping
async search(text) {
  await test.step('DuckDuckGo: search', async () => {
    await this.query.pressSequentially(text)
    // ...
  })
}

// with steps proxy — automatic, just write the method
async search(text) {
  await this.query.pressSequentially(text)
  // ...
}
```

The proxy is applied at the **object level**, not per-method.

## How to apply

### `withSteps(this)` -- general form

> `lib/support/playwright/reporting/steps.proxy.js`

Place `return withSteps(this)` as the last line of a constructor:

```js
class TextInput {
  constructor(locator) {
    this.locator = locator
    return withSteps(this)
  }
}
```

### `withAsyncAsSteps(this)` -- preconfigured variant

> `lib/model/withAsyncAsSteps.ts`

A `WithSteps(...)` factory call with `ignoreNonAsync: true`,
humanization settings from `project.config.js`, and model-aware
`parsedOptions` that configure how params/return values are traversed
for sub-step reporting:

```ts
/** Playwright doesn't export Page/Browser/etc. as runtime classes,
 *  so we detect them by constructor name instead of instanceof. */
const playwrightInfrastructure = new Set(['Page', 'Browser', 'BrowserContext'])

export default WithSteps({
  ignoreNonAsync: true,
  humanizeContext: config.humanizeContext,
  humanizeStepNames: config.humanizeStepNames,
  parsedOptions: {
    skip: ({ key, value }) => {
      if (key.startsWith('_')) return true
      if (value === Marker.inaccessible || value === Marker.circular) return true
      if (value instanceof PageContext) return true
      if (
        value !== null &&
        typeof value === 'object' &&
        playwrightInfrastructure.has(value.constructor?.name)
      )
        return true
      if (typeof value === 'function') return true
      if (
        value !== null &&
        typeof value === 'object' &&
        value.constructor?.name === 'Locator'
      )
        return 'toString'
      return false
    },
  },
})
```

Note: `PageContext` is a real class exported from this project, so
`instanceof` works. Playwright types (`Page`, `Browser`,
`BrowserContext`, `Locator`) are only exported as TypeScript interfaces —
not as runtime classes — so we detect them by `constructor.name` instead.

This skip predicate:

- **Skips** private `_`-prefixed properties, inaccessible/circular markers,
  Playwright infrastructure (`Page`, `Browser`, `BrowserContext`),
  page objects (`PageContext` subclasses), and functions
- **Summarizes** `Locator` instances via `toString()` instead of walking
  their internals

Recommended for page objects where only async methods should be steps
(sync helper accessors like `result(number)` are skipped).
Lives in `lib/model/` because the skip predicate depends on model-layer
types (`PageContext`) and Playwright classes.

### `WithSteps(options)` -- factory for reusable presets

Returns a decorator function `(obj) => withSteps(obj, options)`.
Use it to define project-level step presets (as `withAsyncAsSteps` does above).

## Options

| Option              | Default                     | Description                                                                                                             |
| ------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `context`           | class name or `toString()`  | Label prefix for steps (string or `() => string`)                                                                       |
| `ignore`            | `[/^_/, /^\$/, 'toString']` | Method names/patterns to skip                                                                                           |
| `ignoreAlso`        | `[]`                        | Additional methods to skip (merged with `ignore`)                                                                       |
| `ignoreNonAsync`    | `false`                     | Only wrap async methods                                                                                                 |
| `box`               | `false`                     | Visually box steps in the HTML report                                                                                   |
| `cancelable`        | `true`                      | Respect `config.cancelWithSteps` to disable all wrapping                                                                |
| `parsedOptions`     | `{}`                        | Shared `ParsedOptions` for both params and return sub-step traversal (maxDepth, maxLeaves, skip)                        |
| `paramsInSubSteps`  | `true`                      | `boolean \| ParsedOptions` — `false` to disable, `true` to use `parsedOptions`, or a `ParsedOptions` object to override |
| `returnInSubSteps`  | `true`                      | `boolean \| ParsedOptions` — `false` to disable, `true` to use `parsedOptions`, or a `ParsedOptions` object to override |
| `humanizeStepNames` | `false`                     | Convert `camelCase` method names to `camel case`                                                                        |
| `humanizeContext`   | `false`                     | Apply humanization to the context label too                                                                             |

## How it works internally

1. Uses `proxy.wrapMethodCalls()` from `lib/support/common/proxy.js`
   to intercept method calls via ES `Proxy`
2. For each intercepted call, checks ignore rules and async detection
3. Builds a step title: `{context}: {methodName}: {args}`
4. Wraps the call in `test.step(title, callback, { box })`
5. Optionally renders `<params>` and `<return>` as nested sub-steps
   using `its.parsed()` to traverse object trees
6. Cleans proxy frames from stack traces on errors

The proxy detects whether code is running inside a test context
(via `test.info()`) and passes through without wrapping when
called outside of tests (e.g. during module loading).

## Configuration via project.config.js

```js
const defaults = {
  cancelWithSteps: false, // set true to disable all step wrapping
  enableMatcherSteps: true, // wrap expect() matchers as steps
  humanizeContext: true, // 'DuckDuckGo' → 'duck duck go'
  humanizeStepNames: true, // 'shouldHaveResult' → 'should have result'
}

export const config = withEnvOverrides(defaults)
```

All settings can be overridden via environment variables
(see [Project configuration](./project-configuration.md)).

## HTML report tips

Set `noSnippets: true` in the HTML reporter config to remove boilerplate
code snippets from the report, keeping only the step tree:

```js
// playwright.config.js
;['html', { open: 'always', noSnippets: true }]
```

## See also

- [PageObject pattern](./page-object-pattern.md) --
  where `withSteps` / `withAsyncAsSteps` are applied
- [BDD-style steps](./bdd-style-steps.md) --
  complementary GIVEN/WHEN/THEN structure for tests
