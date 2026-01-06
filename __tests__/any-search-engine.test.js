import { test, expect, GIVEN, THEN, WHEN } from './__base-test__.js'

test('finds playwright | StepsObject, AAA pattern (implicit)', async ({ app }) => {
  await app.searchEngine.open()
  await app.searchEngine.query.shouldBeEmpty()

  await app.searchEngine.search('playwright')
  await app.searchEngine.shouldHaveResultsAtLeast(6)
  await app.searchEngine.shouldHaveResult({ number: 1, partialText: 'Playwright' })

  await app.searchEngine.followLinkOfResult(1)
  await app.shouldHavePageTitle(/Playwright/)
})

test('finds playwright | PageObject-like (assertion-free, kind of), AAA pattern (implicit)', async ({
  app,
}) => {
  await app.searchEngine.open()
  await expect(app.searchEngine.query.locator).toBeEmpty()

  await app.searchEngine.search('playwright')
  await expect(app.searchEngine.results).toHaveCountGreaterThanOrEqual(6)
  await expect(app.searchEngine.result(1)).toContainText('Playwright')

  await app.searchEngine.resultHeader(1).click()
  await expect(app.page).toHaveTitle(/Playwright/)
})

test('finds playwright | Straightforward, AAA pattern (implicit)', async ({ page }) => {
  await page.goto('https://duckduckgo.com/')
  await expect(page.locator('[name="q"]')).toBeEmpty()

  await page.locator('[name="q"]').pressSequentially('playwright')
  await page.keyboard.press('Enter')
  await expect(page.locator('[data-testid="result"]')).toHaveCountGreaterThanOrEqual(6)

  await page
    .locator('[data-testid="result"]')
    .first()
    .locator('[data-testid="result-title-a"]')
    .click()
  await expect(page).toHaveTitle(/Playwright/)
})

test('finds playwright | StepsObject, AAA pattern (explicit, titles-like)', async ({
  app,
}) => {
  GIVEN()
  await app.searchEngine.open()
  await app.searchEngine.query.shouldBeEmpty()

  WHEN()
  await app.searchEngine.search('playwright')

  THEN()
  await app.searchEngine.shouldHaveResultsAtLeast(6)
  await app.searchEngine.shouldHaveResult({ number: 1, partialText: 'Playwright' })
  await app.searchEngine.followLinkOfResult(1)
  await app.shouldHavePageTitle(/Playwright/)
})

test('finds playwright | StepsObject, AAA pattern (explicit, nested)', async ({
  app,
}) => {
  await GIVEN(async () => {
    await app.searchEngine.open()
    await app.searchEngine.query.shouldBeEmpty()
  })

  await WHEN(async () => {
    await app.searchEngine.search('playwright')
  })

  await THEN(async () => {
    await app.searchEngine.shouldHaveResultsAtLeast(6)
    await app.searchEngine.shouldHaveResult({ number: 1, partialText: 'Playwright' })
    await app.searchEngine.followLinkOfResult(1)
    await app.shouldHavePageTitle(/Playwright/)
  })
})

test('finds playwright | StepsObject, AAA pattern (explicit, nested, with summaries)', async ({
  app,
}) => {
  await GIVEN('at search engine', async () => {
    await app.searchEngine.open()
    await app.searchEngine.query.shouldBeEmpty()
  })

  await WHEN('search for query', async () => {
    await app.searchEngine.search('playwright')
  })

  await THEN('should have found relevant results', async () => {
    await app.searchEngine.shouldHaveResultsAtLeast(6)
    await app.searchEngine.shouldHaveResult({ number: 1, partialText: 'Playwright' })
    await app.searchEngine.followLinkOfResult(1)
    await app.shouldHavePageTitle(/Playwright/)
  })
})
