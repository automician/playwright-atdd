# PageObject pattern

## Approach

Page objects in this project follow a locator-based style where:

- Locators are defined as field initializers (or getters)
- **Page URL lives inside `open()`** — a page's URL is part of its essence,
  colocated with locators for cohesion
- Methods represent **user-level steps**, not raw Playwright actions
- **Assertion-steps are included** (this is not an assertion-free PageObject) --
  making the implementation closer to a "StepsObject" than a classic PageObject
- The pattern applies equally to **pages** and **controls** (reusable components)

Every page object's method calls are automatically reported as test steps
in a human-readable way with additional rendering of method arguments
and return values as nested sub-steps,
making the report even more readable in case of multi-parameter methods,
that is usually a common case for API based steps.
See [Steps proxy](./steps-proxy.md) for details.

## PageContext base class

> `lib/model/PageContext.ts`

Page objects extend `PageContext` — a thin base class that absorbs
the repetitive constructor boilerplate:

```ts
export class PageContext {
  constructor(public page: Page) {
    return withAsyncAsSteps(this)
  }

  locator(...args: Parameters<Page['locator']>) {
    return this.page.locator(...args)
  }
}
```

This gives every subclass:

- `page` property (via constructor parameter property)
- `locator(...)` shorthand for `this.page.locator(...)`
- automatic step wrapping (inherited — no `return withAsyncAsSteps(this)`
  needed in subclasses)

Subclasses typically need **no constructor at all** — locators are defined
as field initializers with types inferred automatically:

```ts
export class DuckDuckGo extends PageContext {
  query = new TextInput(this.locator('[name="q"]'))
  results = this.locator('[data-testid="result"]')
  // ...methods...
}
```

### Why inheritance here?

This trades a bit of "flat is better than nested" for a large reduction
in per-class boilerplate. The relationship is a genuine is-a:
every page object _is_ a page context.
See the "Practicality beats purity" guiding [principle](../guiding-principles.md).

**Keep `PageContext` minimal.** It should only hold what every page object
needs: access to `page` and its locators, plus the step-wrapping proxy.
Do not add domain logic, shared assertions, or helper methods —
that path leads to a "god class" and breaks composition over inheritance.

The class is deliberately named `PageContext` rather than the conventional
`BasePage` to signal its narrow purpose: it provides context (page access
and locators), not behaviour. The name `BasePage` tends to invite
"let me put shared helpers here" thinking.

## Page example: DuckDuckGo

> `lib/model/pages/duckduckgo.ts`

```ts
export class DuckDuckGo extends PageContext {
  query = new TextInput(this.locator('[name="q"]'))
  results = this.locator('[data-testid="result"]')
  firstResultHeader = this.results.first().locator('[data-testid="result-title-a"]')

  async open() {
    await this.page.goto('https://duckduckgo.com/')
  }

  async shouldHaveResultsAtLeast(number: number) {
    await expect(this.results).toHaveCountGreaterThanOrEqual(number)
  }

  result(number: number) {
    return this.results.nth(number - 1)
  }

  async shouldHaveResult({
    number,
    partialText = undefined,
    text = undefined,
  }: {
    number: number
    partialText?: string
    text?: string
  }) {
    const result = this.result(number)
    if (!partialText && !text) await expect(result).toBeVisible()
    if (partialText) await expect(result).toContainText(partialText)
    if (text) await expect(result).toHaveText(text)
  }

  resultHeader(number: number) {
    return this.result(number).locator('[data-testid="result-title-a"]')
  }

  async search(text: string) {
    await this.query.pressSequentially(text).then(() => {
      this.page.keyboard.press('Enter')
    })
  }

  async followLinkOfResult(number: number) {
    await this.resultHeader(number).click()
  }
}
```

Key points:

- **No constructor** — `PageContext` handles `page`, locators, and step wrapping
- **`open()` with the URL inside** — a page's URL is part of the page's
  essence, just like its locators. Storing the URL in the `open()` method
  increases cohesion (URL colocated with the page's structure)
  and is the most practical form — the main use case for a page URL
  is to navigate to it, so wrapping it in `open()` is the natural place.
  Some approaches store URLs separately (in constants, or a `url`
  property), but for most pages this just adds indirection with no benefit
- **Action methods** (`open`, `search`, `followLinkOfResult`) —
  named after what the user does, not after Playwright API calls
- **Assertion methods** (`shouldHaveResultsAtLeast`, `shouldHaveResult`) —
  read as expectations, named with `should` prefix
- **Helper accessors** (`result(number)`, `resultHeader(number)`) —
  return locators for composition; not async, so they are skipped by
  `withAsyncAsSteps` and don't appear in the step report

## Control example: TextInput (without PageContext)

> `lib/model/controls/text-input.ts`

Not every control needs `PageContext`. Simple controls that only wrap
a single `Locator` can manage their own constructor:

```ts
export class TextInput {
  constructor(public locator: Locator) {
    return withAsyncAsSteps(this)
  }

  toString() {
    return `TextInput(${this.locator})`
  }

  async shouldBeEmpty() {
    await expect(this.locator).toBeEmpty()
  }

  async fill(value: string, options: { ... } = {}) { /* ... */ }
  async pressSequentially(text: string, options: { ... } = {}) { /* ... */ }
  async press(key: string, options: { ... } = {}) { /* ... */ }
  async clear(options: { ... } = {}) { /* ... */ }
}
```

Controls wrap a `Locator` (not a `Page`) and provide domain-meaningful
methods. The `toString()` override gives readable context in step reports
(e.g. `TextInput(locator('[name="q"]')): press sequentially`).

Since `TextInput` only needs a single locator, there is no benefit to
extending `PageContext` — the constructor is trivial and self-contained.

## Control example: Autocomplete (with PageContext)

> `lib/model/controls/autocomplete.ts`

Some controls need access to both a root element and the full page.
For example, a MUI Autocomplete has an input inside the root element
but its dropdown listbox is rendered outside the root's DOM subtree,
attached to the page body. Extending `PageContext` fits naturally here:

```ts
export class Autocomplete extends PageContext {
  get input() {
    return this.root.getByRole('combobox')
  }
  dropdown = this.locator('[role="listbox"]')

  constructor(
    public root: Locator,
    page: Page,
  ) {
    super(page)
  }

  toString() {
    return `Autocomplete(${this.root})`
  }

  option(text: string) {
    return this.dropdown.getByRole('option', { name: text })
  }

  async select(text: string) {
    await this.fill(text)
    await this.option(text).click()
  }

  // ...other methods...
}
```

Key points:

- **`root` for the control element, `page` for detached elements** —
  `dropdown` uses `this.locator(...)` (from `PageContext`, scoped to page)
  because the listbox is rendered outside the root's DOM subtree
- **`root` not `locator`** — the root element property is named `root`
  to avoid clashing with the `locator(...)` method inherited from `PageContext`
- **`input` uses a getter** — because `this.root` is a constructor parameter
  not yet available during field initialization (field initializers run
  before the subclass constructor body). The getter also keeps locator
  definitions colocated with `dropdown` at the top of the class.
  An alternative would be an arrow function field
  (`input = () => this.root.getByRole('combobox')`) — arguably more concise,
  but it changes the access from `this.input` to `this.input()`,
  making it inconsistent with how `dropdown` and other locator fields
  are accessed

## Alternative: pure KISS without inheritance

For projects that prefer maximum simplicity and flatness over
boilerplate reduction, every page object can manage its own constructor
without a base class:

```ts
export class DuckDuckGo {
  query: TextInput
  results: Locator
  firstResultHeader: Locator

  constructor(public page: Page) {
    this.query = new TextInput(this.page.locator('[name="q"]'))
    this.results = this.page.locator('[data-testid="result"]')
    this.firstResultHeader = this.results
      .first()
      .locator('[data-testid="result-title-a"]')

    return withAsyncAsSteps(this)
  }

  // ...methods...
}
```

This is simpler (no inheritance, no base class to understand) but requires:

- Explicit field type declarations for all locators
- Manual `return withAsyncAsSteps(this)` in every constructor
- `this.page.locator(...)` instead of `this.locator(...)`

Both approaches are valid.
This project uses `PageContext` for practicality.

## Usage in tests

Tests interact with page objects through the
[Application Manager](./application-manager-pattern.md) fixture:

```ts
test('finds playwright', async ({ app }) => {
  await app.duckduckgo.open()
  await app.duckduckgo.search('playwright')
  await app.duckduckgo.shouldHaveResultsAtLeast(6)
})
```

See `__tests__/duckduckgo.test.js` for the full set of test examples.

## External reference

The PageObject pattern variations in different programming languages
and frameworks (including JavaScript versions of these same patterns)
are explained in detail in the
[Selenides for PageObjects Tutorial](https://autotest.how/selenides-for-page-objects-tutorial-md).

The classic PageObject pattern explanation can be found in
Martin Fowler's article [Page Object](https://martinfowler.com/bliki/PageObject.html).

## See also

- [Application Manager pattern](./application-manager-pattern.md) —
  how page objects are wired into tests
- [Steps proxy](./steps-proxy.md) —
  how method calls become test steps automatically
