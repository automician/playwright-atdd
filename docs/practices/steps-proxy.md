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

> `lib/support/playwright/reporting/configurable/withAsyncAsSteps.js`

A `WithSteps(...)` factory call with `ignoreNonAsync: true` and
humanization settings read from `project.config.js`:

```js
export default WithSteps({
  ignoreNonAsync: true,
  humanizeContext: config.humanizeContext,
  humanizeStepNames: config.humanizeStepNames,
})
```

Recommended for page objects where only async methods should be steps
(sync helper accessors like `result(number)` are skipped).

### `WithSteps(options)` -- factory for reusable presets

Returns a decorator function `(obj) => withSteps(obj, options)`.
Use it to define project-level step presets (as `withAsyncAsSteps` does above).

## Options

| Option              | Default                     | Description                                              |
| ------------------- | --------------------------- | -------------------------------------------------------- |
| `context`           | class name or `toString()`  | Label prefix for steps (string or `() => string`)        |
| `ignore`            | `[/^_/, /^\$/, 'toString']` | Method names/patterns to skip                            |
| `ignoreAlso`        | `[]`                        | Additional methods to skip (merged with `ignore`)        |
| `ignoreNonAsync`    | `false`                     | Only wrap async methods                                  |
| `box`               | `false`                     | Visually box steps in the HTML report                    |
| `cancelable`        | `true`                      | Respect `config.cancelWithSteps` to disable all wrapping |
| `paramsInSubSteps`  | `true`                      | Render method arguments as nested `<params>` sub-steps   |
| `returnInSubSteps`  | `true`                      | Render return values as nested `<return>` sub-steps      |
| `humanizeStepNames` | `false`                     | Convert `camelCase` method names to `camel case`         |
| `humanizeContext`   | `false`                     | Apply humanization to the context label too              |

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
