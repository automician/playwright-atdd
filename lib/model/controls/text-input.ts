import type { Locator } from '@playwright/test'
import { expect } from '../../support/playwright/test.js'
import withAsyncAsSteps from '../withAsyncAsSteps.ts'

export class TextInput {
  constructor(public locator: Locator) {
    return withAsyncAsSteps(this)
  }

  toString() {
    // TODO: what about this.locator._selector?
    return `TextInput(${this.locator})`
  }

  async shouldBeEmpty() {
    await expect(this.locator).toBeEmpty()
  }

  async fill(
    value: string,
    options: { force?: boolean; noWaitAfter?: boolean; timeout?: number } = {},
  ) {
    await this.locator.fill(value, options)
  }

  async pressSequentially(
    text: string,
    options: { delay?: number; noWaitAfter?: boolean; timeout?: number } = {},
  ) {
    await this.locator.pressSequentially(text, options)
  }

  async press(
    key: string,
    options: { delay?: number; noWaitAfter?: boolean; timeout?: number } = {},
  ) {
    await this.locator.press(key, options)
  }

  async clear(
    options: { force?: boolean; noWaitAfter?: boolean; timeout?: number } = {},
  ) {
    await this.locator.clear(options)
  }
}
