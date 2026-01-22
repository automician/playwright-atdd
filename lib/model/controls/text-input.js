import { expect } from '../../support/playwright/test.js'
import { withSteps } from '../../support/playwright/reporting/steps.proxy.js'

export class TextInput {
  /** @param { import('@playwright/test').Locator } locator */
  constructor(locator) {
    this.locator = locator

    return withSteps(this)
  }

  toString() {
    // todo: what about this.locator._selector?
    return `TextInput(${this.locator})`
  }

  async shouldBeEmpty() {
    await expect(this.locator).toBeEmpty()
  }

  /**
   * @param { string } value
   * @param { { force?: boolean; noWaitAfter?: boolean; timeout?: number; } } options
   */
  async fill(value, options = {}) {
    await this.locator.fill(value, options)
  }

  /**
   * @param { string } text
   * @param { { delay?: number; noWaitAfter?: boolean; timeout?: number; } } options
   */
  async pressSequentially(text, options = {}) {
    await this.locator.pressSequentially(text, options)
  }

  /**
   * @param { string } key
   * @param { { delay?: number; noWaitAfter?: boolean; timeout?: number; } } options
   */
  async press(key, options = {}) {
    await this.locator.press(key, options)
  }

  /**
   * @param { { force?: boolean; noWaitAfter?: boolean; timeout?: number; } } options
   */
  async clear(options = {}) {
    await this.locator.clear(options)
  }
}
