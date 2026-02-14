# PageObject pattern

## Approach

Page objects in this project follow a locator-based style where:

- Locators are defined in the constructor
- Methods represent **user-level steps**, not raw Playwright actions
- **Assertion-steps are included** (this is not an assertion-free PageObject) --
  making the implementation closer to a "StepsObject" than a classic PageObject
- The pattern applies equally to **pages** and **controls** (reusable components)

Every constructor ends with `return withAsyncAsSteps(this)` (or `withSteps(this)`),
so all method calls are automatically reported as test steps in a human-readable way with additional rendering of method arguments and return values as nested sub-steps, making the report even more readable in case of multi-parameter methods, that is usually a common case for API based steps.
See [Steps proxy](./steps-proxy.md) for details.

## Page example: DuckDuckGo

> `lib/model/pages/duckduckgo.js`

```js
export class DuckDuckGo {
  constructor(page) {
    this.page = page
    this.query = new TextInput(this.page.locator('[name="q"]'))
    this.results = this.page.locator('[data-testid="result"]')

    return withAsyncAsSteps(this)
  }

  async open() {
    await this.page.goto('https://duckduckgo.com/')
  }

  async shouldHaveResultsAtLeast(number) {
    await expect(this.results).toHaveCountGreaterThanOrEqual(number)
  }

  result(number) {
    return this.results.nth(number - 1)
  }

  async shouldHaveResult({ number, partialText = undefined, text = undefined }) {
    const result = this.result(number)
    if (!partialText && !text) await expect(result).toBeVisible()
    if (partialText) await expect(result).toContainText(partialText)
    if (text) await expect(result).toHaveText(text)
  }

  resultHeader(number) {
    return this.result(number).locator('[data-testid="result-title-a"]')
  }

  async search(text) {
    await this.query.pressSequentially(text).then(() => {
      this.page.keyboard.press('Enter')
    })
  }

  async followLinkOfResult(number) {
    await this.resultHeader(number).click()
  }
}
```

Key points:

- **Action methods** (`open`, `search`, `followLinkOfResult`) --
  named after what the user does, not after Playwright API calls
- **Assertion methods** (`shouldHaveResultsAtLeast`, `shouldHaveResult`) --
  read as expectations, named with `should` prefix
- **Helper accessors** (`result(number)`, `resultHeader(number)`) --
  return locators for composition; not async, so they are skipped by
  `withAsyncAsSteps` and don't appear in the step report

## Control example: TextInput

> `lib/model/controls/text-input.js`

```js
export class TextInput {
  constructor(locator) {
    this.locator = locator
    return withSteps(this)
  }

  toString() {
    return `TextInput(${this.locator})`
  }

  async shouldBeEmpty() {
    await expect(this.locator).toBeEmpty()
  }

  async fill(value, options = {}) { /* ... */ }
  async pressSequentially(text, options = {}) { /* ... */ }
  async press(key, options = {}) { /* ... */ }
  async clear(options = {}) { /* ... */ }
}
```

Controls wrap a `Locator` (not a `Page`) and provide domain-meaningful
methods. The `toString()` override gives readable context in step reports
(e.g. `TextInput(locator('[name="q"]')): press sequentially`).

## Usage in tests

Tests interact with page objects through the
[Application Manager](./application-manager-pattern.md) fixture:

```js
test('finds playwright', async ({ app }) => {
  await app.duckduckgo.open()
  await app.duckduckgo.search('playwright')
  await app.duckduckgo.shouldHaveResultsAtLeast(6)
})
```

See `__tests__/duckduckgo.test.js` for the full set of test examples.

## External reference

The PageObject pattern variations in different programming languages and frameworks is explained in detail in the
[Selenides for PageObjects Tutorial](https://autotest.how/selenides-for-page-objects-tutorial-md).

The classic PageObject pattern explanation can be found in the Martin Fowler's article [Page Object](https://martinfowler.com/bliki/PageObject.html).

## See also

- [Application Manager pattern](./application-manager-pattern.md) --
  how page objects are wired into tests
- [Steps proxy](./steps-proxy.md) --
  how method calls become test steps automatically
