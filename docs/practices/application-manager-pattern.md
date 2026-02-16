# Application Manager pattern

## Concept

A single `App` class serves as the entry point to all page objects.
Tests receive it via a Playwright fixture and navigate from there:

```ts
test('finds playwright', async ({ app }) => {
  await app.duckduckgo.open()
  await app.duckduckgo.search('playwright')
})
```

This avoids scattered `new DuckDuckGo(page)` calls in every test,
keeps page object wiring in one place, and makes the test API
discoverable through IDE autocompletion on `app.`.

## Implementation

> `lib/model/app-manager.fixture.ts`

The core idea — without `PageContext` — looks like this:

```ts
class App {
  google: Google
  duckduckgo: DuckDuckGo
  searchEngine: AnySearchEngine

  constructor(public page: Page) {
    this.google = new Google(page)
    this.duckduckgo = new DuckDuckGo(page)
    this.searchEngine = new AnySearchEngine(page)

    return withAsyncAsSteps(this)
  }

  async shouldHavePageTitle(
    valueOrPattern: string | RegExp,
    options: { timeout?: number } = {},
  ) {
    await expect(this.page).toHaveTitle(valueOrPattern, options)
  }
}

export const AppManagerFixture: Fixtures<{ app: App }, ...> = {
  app: async ({ page }, use) => {
    await use(new App(page))
  },
}
```

The `App` class:

- Creates all page objects in its constructor
- Is itself wrapped with `withAsyncAsSteps(this)` so cross-page methods
  (like `shouldHavePageTitle`) appear in the step report
- Exposes the raw `page` for cases where direct Playwright access is needed

### With PageContext

This project uses `PageContext`
(see [PageObject pattern](./page-object-pattern.md#pagecontext-base-class)),
which removes the constructor boilerplate:

```ts
class App extends PageContext {
  google = new Google(this.page)
  duckduckgo = new DuckDuckGo(this.page)
  searchEngine = new AnySearchEngine(this.page)

  async shouldHavePageTitle(
    valueOrPattern: string | RegExp,
    options: { timeout?: number } = {},
  ) {
    await expect(this.page).toHaveTitle(valueOrPattern, options)
  }
}
```

No constructor, no field type declarations, no manual step wrapping —
all inherited from `PageContext`.

## Test wiring

> `__tests__/__base-test__.js`

```ts
import * as base from '@playwright/test'
import { AppManagerFixture } from '../lib/model/app-manager.fixture.ts'

export const test = base.test.extend(AppManagerFixture)
```

All test files import `test` from `__base-test__` to get the `{ app }` fixture.
This is the single place where the fixture is registered.

## External reference

The Application Manager pattern (including JavaScript versions)
is explained in detail in the
[Selenides for PageObjects Tutorial](https://autotest.how/selenides-for-page-objects-tutorial-md).

## See also

- [PageObject pattern](./page-object-pattern.md) —
  how individual page objects are structured
- [Steps proxy](./steps-proxy.md) —
  how `withAsyncAsSteps(this)` works
