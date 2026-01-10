import { TextInput } from '../controls/text-input.js'
import { expect } from '../../support/playwright/test.js'
import withAsyncAsSteps from '../../support/playwright/reporting/configurable/withAsyncAsSteps.js'

export class DuckDuckGo {
  async open() {
    await this.page.goto('https://duckduckgo.com/')
  }

  /** @param { import('@playwright/test').Page } page */
  constructor(page) {
    this.page = page
    this.query = new TextInput(this.page.locator('[name="q"]'))
    this.results = this.page.locator('[data-testid="result"]')
    this.firstResultHeader = this.results
      .first()
      .locator('[data-testid="result-title-a"]')

    return withAsyncAsSteps(this)
    /* OR ⬇️ */
    // return withSteps(this, {ignoreNonAsync: true})
    /* OR ⬇ simply (if you changed default of ignoreNonAsync to true in withSteps impl.)️ */
    // return withSteps(this)
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
