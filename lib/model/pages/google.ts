import { TextInput } from '../controls/text-input.ts'
import { expect } from '../../support/playwright/test.js'
import { PageContext } from '../PageContext.ts'

export class Google extends PageContext {
  query = new TextInput(this.locator('[name="q"]'))
  results = this.locator('#rso .g[data-hveid]')
  firstResultHeader = this.results.first().locator('h3').first()

  async open() {
    await this.page.goto('https://google.com/ncr')
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
    return this.result(number).locator('h3').first()
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
