import { test, expect, GIVEN, THEN, WHEN } from './__base-test__.js'

test.skip(
  true,
  'Skipping all tests in this file, because Google is too nerdy, blocking robots like us 😇',
)

test('finds playwright | StepsObject, AAA pattern (implicit)', async ({ app }) => {
  await app.google.open()
  await app.google.query.shouldBeEmpty()

  await app.google.search('playwright')
  await app.google.shouldHaveResultsAtLeast(6)
  await app.google.shouldHaveResult({ number: 1, partialText: 'Playwright' })

  await app.google.followLinkOfResult(1)
  await app.shouldHavePageTitle(/Playwright/)
})

test('finds playwright | PageObject-like (assertion-free, kind of), AAA pattern (implicit)', async ({
  app,
}) => {
  await app.google.open()
  await expect(app.google.query.locator).toBeEmpty()

  await app.google.search('playwright')
  await expect(app.google.results).toHaveCountGreaterThanOrEqual(6)
  await expect(app.google.result(1)).toContainText('Playwright')

  await app.google.resultHeader(1).click()
  await expect(app.page).toHaveTitle(/Playwright/)
})

test('finds playwright | Straightforward, AAA pattern (implicit)', async ({ page }) => {
  await page.goto('https://google.com/ncr')
  await expect(page.locator('[name="q"]')).toBeEmpty()

  await page.locator('[name="q"]').pressSequentially('playwright')
  await page.keyboard.press('Enter')
  await expect(page.locator('#rso .g[data-hveid]')).toHaveCountGreaterThanOrEqual(6)

  await page.locator('#rso .g[data-hveid]').first().locator('h3').first().click()
  await expect(page).toHaveTitle(/Playwright/)
})

test('finds playwright | StepsObject, AAA pattern (explicit, titles-like)', async ({
  app,
}) => {
  GIVEN()
  await app.google.open()
  await app.google.query.shouldBeEmpty()

  WHEN()
  await app.google.search('playwright')

  THEN()
  await app.google.shouldHaveResultsAtLeast(6)
  await app.google.shouldHaveResult({ number: 1, partialText: 'Playwright' })
  await app.google.followLinkOfResult(1)
  await app.shouldHavePageTitle(/Playwright/)
})

test('finds playwright | StepsObject, AAA pattern (explicit, nested)', async ({
  app,
}) => {
  await GIVEN(async () => {
    await app.google.open()
    await app.google.query.shouldBeEmpty()
  })

  await WHEN(async () => {
    await app.google.search('playwright')
  })

  await THEN(async () => {
    await app.google.shouldHaveResultsAtLeast(6)
    await app.google.shouldHaveResult({ number: 1, partialText: 'Playwright' })
    await app.google.followLinkOfResult(1)
    await app.shouldHavePageTitle(/Playwright/)
  })
})

test('finds playwright | StepsObject, AAA pattern (explicit, nested, with summaries)', async ({
  app,
}) => {
  await GIVEN('at google', async () => {
    await app.google.open()
    await app.google.query.shouldBeEmpty()
  })

  await WHEN('search for query', async () => {
    await app.google.search('playwright')
  })

  await THEN('should have found relevant results', async () => {
    await app.google.shouldHaveResultsAtLeast(6)
    await app.google.shouldHaveResult({ number: 1, partialText: 'Playwright' })
    await app.google.followLinkOfResult(1)
    await app.shouldHavePageTitle(/Playwright/)
  })
})
