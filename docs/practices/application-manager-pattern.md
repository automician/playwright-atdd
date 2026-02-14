# Application Manager pattern

## Concept

A single `App` class serves as the entry point to all page objects.
Tests receive it via a Playwright fixture and navigate from there:

```js
test('finds playwright', async ({ app }) => {
  await app.duckduckgo.open()
  await app.duckduckgo.search('playwright')
})
```

This avoids scattered `new DuckDuckGo(page)` calls in every test,
keeps page object wiring in one place, and makes the test API
discoverable through IDE autocompletion on `app.`.

## Implementation

> `lib/model/app-manager.fixture.js`

```js
class App {
  constructor(page) {
    this.page = page
    this.google = new Google(page)
    this.duckduckgo = new DuckDuckGo(page)
    this.searchEngine = new AnySearchEngine(page)

    return withSteps(this)
  }

  async shouldHavePageTitle(titleOrRegExp, options = {}) {
    await expect(this.page).toHaveTitle(titleOrRegExp, options)
  }
}

export const AppManagerFixture = {
  app: async ({ page }, use) => {
    await use(new App(page))
  },
}
```

The `App` class:

- Creates all page objects in its constructor
- Is itself wrapped with `withSteps(this)` so cross-page methods
  (like `shouldHavePageTitle`) appear in the step report
- Exposes the raw `page` for cases where direct Playwright access is needed

## Test wiring

> `__tests__/__base-test__.js`

```js
import * as base from '@playwright/test'
import { AppManagerFixture } from '../lib/model/app-manager.fixture.js'

export const test = base.test.extend(AppManagerFixture)
```

All test files import `test` from `__base-test__` to get the `{ app }` fixture.
This is the single place where the fixture is registered.

## External reference

The Application Manager pattern is explained in detail in the
[Selenides for PageObjects Tutorial](https://autotest.how/selenides-for-page-objects-tutorial-md).

## See also

- [PageObject pattern](./page-object-pattern.md) --
  how individual page objects are structured
- [Steps proxy](./steps-proxy.md) --
  how `withSteps(this)` works
