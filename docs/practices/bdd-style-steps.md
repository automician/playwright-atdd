# BDD-style steps

## Concept

Structure test bodies with **GIVEN / WHEN / THEN** instead of the generic
Arrange / Act / Assert. All step functions wrap Playwright's `test.step()`
with a prefix and are rendered as boxed steps in the HTML report.

## API

> `lib/support/playwright/reporting/gherkin.js`

```js
export const GIVEN = Step('GIVEN ')
export const WHEN = Step('WHEN ')
export const THEN = Step('THEN ')
export const AND = Step('AND ')
export const STEP = Step('')
```

Each export is an overloaded function that accepts different argument
combinations (see usage styles below).

Imported via `__tests__/__base-test__.js`:

```js
export {
  GIVEN,
  WHEN,
  THEN,
  AND,
  STEP,
} from '../lib/support/playwright/reporting/gherkin.js'
```

## Usage styles

All examples reference `__tests__/duckduckgo.test.js`.

### 1. Implicit AAA (no markers)

The simplest style -- no GIVEN/WHEN/THEN calls at all.
The test structure is implicit through method naming
(`open` = arrange, `search` = act, `shouldHave*` = assert):

```js
test('finds playwright', async ({ app }) => {
  await app.duckduckgo.open()
  await app.duckduckgo.query.shouldBeEmpty()

  await app.duckduckgo.search('playwright')
  await app.duckduckgo.shouldHaveResultsAtLeast(6)
  await app.duckduckgo.shouldHaveResult({
    number: 1,
    partialText: 'Playwright',
  })

  await app.duckduckgo.followLinkOfResult(1)
  await app.shouldHavePageTitle(/Playwright/)
})
```

### 2. Title-only markers (flat)

Call `GIVEN()`, `WHEN()`, `THEN()` with no arguments as visual separators.
They appear as boxed title-only steps in the report:

```js
test('finds playwright', async ({ app }) => {
  GIVEN()
  await app.duckduckgo.open()
  await app.duckduckgo.query.shouldBeEmpty()

  WHEN()
  await app.duckduckgo.search('playwright')

  THEN()
  await app.duckduckgo.shouldHaveResultsAtLeast(6)
})
```

### 3. Nested blocks (no summary)

Pass a function body to group steps under the GIVEN/WHEN/THEN node
in the report:

```js
test('finds playwright', async ({ app }) => {
  await GIVEN(async () => {
    await app.duckduckgo.open()
    await app.duckduckgo.query.shouldBeEmpty()
  })

  await WHEN(async () => {
    await app.duckduckgo.search('playwright')
  })

  await THEN(async () => {
    await app.duckduckgo.shouldHaveResultsAtLeast(6)
  })
})
```

### 4. Nested blocks with summaries

Add a title string before the body for maximum readability:

```js
test('finds playwright', async ({ app }) => {
  await GIVEN('at duckduckgo', async () => {
    await app.duckduckgo.open()
    await app.duckduckgo.query.shouldBeEmpty()
  })

  await WHEN('search for query', async () => {
    await app.duckduckgo.search('playwright')
  })

  await THEN('should have found relevant results', async () => {
    await app.duckduckgo.shouldHaveResultsAtLeast(6)
    await app.duckduckgo.shouldHaveResult({
      number: 1,
      partialText: 'Playwright',
    })
  })
})
```

## Which style to choose

All four styles can coexist in the same project. Pick based on context:

- **Implicit AAA** -- for short, obvious tests
- **Title-only markers** -- when you want visual separation without nesting
- **Nested blocks** -- when grouping helps readability in the report
- **Nested with summaries** -- for complex scenarios where the report
  should tell a story

## Avoid

Avoid often use of nested blocks with summaries for a single steps, like in:

```js
await WHEN('search for query', async () => {
  await app.duckduckgo.search('playwright')
})
```

Above the `app.duckduckgo.search('playwright')` is already readable itself, and if `duckduckgo.search` is already a step (built with [Steps proxy](./steps-proxy.md)), it will be rendered as readable step in the report. A valuable reason for doing so would be to stay consistent with the already used style in the test, for example, if you have a long test with many steps, and all of them can be grouped in 4 groups, where 3 groups have more than 2 steps and only one group has a single step, then it would be a good idea to use nested blocks with summaries for the single step group too.

## See also

- [Steps proxy](./steps-proxy.md) --
  automatic step wrapping at the object level (complements BDD-style steps)
