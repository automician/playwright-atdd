import { test, expect, GIVEN, THEN, WHEN } from './__base-test__.ts'

test('finds playwright | StepsObject, AAA pattern (implicit)', async ({ app }) => {
  await app.duckduckgo.open()
  await app.duckduckgo.query.shouldBeEmpty()

  await app.duckduckgo.search('playwright')
  await app.duckduckgo.shouldHaveResultsAtLeast(6)
  await app.duckduckgo.shouldHaveResult({ number: 1, partialText: 'Playwright' })

  await app.duckduckgo.followLinkOfResult(1)
  await app.shouldHavePageTitle(/Playwright/)
})

test('finds playwright | PageObject-like (assertion-free, kind of), AAA pattern (implicit)', async ({
  app,
}) => {
  await app.duckduckgo.open()
  await expect(app.duckduckgo.query.locator).toBeEmpty()

  await app.duckduckgo.search('playwright')
  await expect(app.duckduckgo.results).toHaveCountGreaterThanOrEqual(6)
  await expect(app.duckduckgo.result(1)).toContainText('Playwright')

  await app.duckduckgo.resultHeader(1).click()
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
  await app.duckduckgo.open()
  await app.duckduckgo.query.shouldBeEmpty()

  WHEN()
  await app.duckduckgo.search('playwright')

  THEN()
  await app.duckduckgo.shouldHaveResultsAtLeast(6)
  await app.duckduckgo.shouldHaveResult({ number: 1, partialText: 'Playwright' })
  await app.duckduckgo.followLinkOfResult(1)
  await app.shouldHavePageTitle(/Playwright/)
})

test('finds playwright | StepsObject, AAA pattern (explicit, nested)', async ({
  app,
}) => {
  await GIVEN(async () => {
    await app.duckduckgo.open()
    await app.duckduckgo.query.shouldBeEmpty()
  })

  await WHEN(async () => {
    await app.duckduckgo.search('playwright')
  })

  await THEN(async () => {
    await app.duckduckgo.shouldHaveResultsAtLeast(6)
    await app.duckduckgo.shouldHaveResult({ number: 1, partialText: 'Playwright' })
    await app.duckduckgo.followLinkOfResult(1)
    await app.shouldHavePageTitle(/Playwright/)
  })
})

test('finds playwright | StepsObject, AAA pattern (explicit, nested, with summaries)', async ({
  app,
}) => {
  await GIVEN('at duckduckgo', async () => {
    await app.duckduckgo.open()
    await app.duckduckgo.query.shouldBeEmpty()
  })

  await WHEN('search for query', async () => {
    await app.duckduckgo.search('playwright')
  })

  await THEN('should have found relevant results', async () => {
    await app.duckduckgo.shouldHaveResultsAtLeast(6)
    await app.duckduckgo.shouldHaveResult({ number: 1, partialText: 'Playwright' })
    await app.duckduckgo.followLinkOfResult(1)
    await app.shouldHavePageTitle(/Playwright/)
  })
})

test('finds playwright | StepsObject, AAA pattern (explicit, with summaries)', async ({
  app,
}) => {
  await GIVEN('at duckduckgo')
  await app.duckduckgo.open()
  await app.duckduckgo.query.shouldBeEmpty()

  await WHEN('search for query')
  await app.duckduckgo.search('playwright')

  await THEN('should have found relevant results')
  await app.duckduckgo.shouldHaveResultsAtLeast(6)
  await app.duckduckgo.shouldHaveResult({ number: 1, partialText: 'Playwright' })
  await app.duckduckgo.followLinkOfResult(1)
  await app.shouldHavePageTitle(/Playwright/)
})
