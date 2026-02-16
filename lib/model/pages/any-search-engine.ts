import { TextInput } from '../controls/text-input.ts'
import { expect } from '../../support/playwright/test.js'
import { config } from '../../../project.config.js'
import { PageContext } from '../PageContext.ts'

/**
 * This Page is just for example purposes of using "dotenv based project config settings".
 * Don't store locators in config files on most of real projects❗️
 */
export class AnySearchEngine extends PageContext {
  query = new TextInput(this.locator(config.searchEngineQuerySelector))
  results = this.locator(config.searchEngineResultSelector)
  firstResultHeader = this.results
    .first()
    .locator(config.searchEngineResultHeaderSelector)

  async open() {
    await this.page.goto(config.searchEngineUrl)
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
    return this.result(number).locator(config.searchEngineResultHeaderSelector)
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
